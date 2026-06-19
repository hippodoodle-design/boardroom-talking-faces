// engine.js — shared engine for the talking-faces preview
// Three pieces: KokoroEngine (free in-browser TTS), SpeechPlayer (Web Audio +
// live RMS for lip-sync), FaceRenderer (top-lip-anchored jaw-drop + blink + sway).
// Plus the seat roster (characters + seat->voice mapping).

import { KokoroTTS } from "https://esm.sh/kokoro-js@1.2.1";

export const DEBUG = new URLSearchParams(location.search).has("debug");
const QS = new URLSearchParams(location.search);
// ?overlay draws the geometry guides (anchor/jawBottom/eye-box) for tuning faces;
// kept separate from ?debug so a debug build can still screenshot a clean face.
export const OVERLAY = QS.has("overlay");

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

// ---- KokoroEngine: load model once, generate raw PCM for any text -------------
export class KokoroEngine {
  constructor() {
    this.tts = null;
    this.device = null;
    this.dtype = null;
    this.loadMs = 0;
    this.ready = false;
  }

  async detectDevice() {
    let webgpu = false;
    try {
      if ("gpu" in navigator && navigator.gpu) {
        const adapter = await navigator.gpu.requestAdapter();
        webgpu = !!adapter;
      }
    } catch (_) { webgpu = false; }
    // Allow override via ?device=wasm|webgpu and ?dtype=q8|fp32|fp16|q4
    const dev = QS.get("device") || (webgpu ? "webgpu" : "wasm");
    // q8 is the sweet spot for a phone: ~86MB, runs on both backends.
    const dt = QS.get("dtype") || "q8";
    return { device: dev, dtype: dt, webgpu };
  }

  async load(onProgress) {
    const t0 = performance.now();
    const { device, dtype } = await this.detectDevice();
    this.device = device; this.dtype = dtype;
    this.tts = await KokoroTTS.from_pretrained(MODEL_ID, {
      dtype,
      device,
      progress_callback: (p) => {
        if (!onProgress) return;
        if (p.status === "progress" && p.total) {
          onProgress({ pct: p.loaded / p.total, file: p.file });
        } else if (p.status === "done") {
          onProgress({ pct: 1, file: p.file });
        }
      },
    });
    this.loadMs = performance.now() - t0;
    this.ready = true;
    return { device: this.device, dtype: this.dtype, loadMs: this.loadMs };
  }

  // Returns { audio:Float32Array, sr:number, genMs, audioSec, rtf }
  async generate(text, voice) {
    const t0 = performance.now();
    const raw = await this.tts.generate(text, { voice });
    const genMs = performance.now() - t0;
    const audio = raw.audio;            // Float32Array
    const sr = raw.sampling_rate;       // e.g. 24000
    const audioSec = audio.length / sr;
    return { audio, sr, genMs, audioSec, rtf: (genMs / 1000) / audioSec };
  }
}

// ---- SpeechPlayer: plays PCM through an AnalyserNode, exposes live RMS --------
export class SpeechPlayer {
  constructor() {
    this.ctx = null; this.analyser = null; this.data = null;
    this.level = 0; this.active = false; this.cur = null;
  }
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.0;
      this.data = new Float32Array(this.analyser.fftSize);
      this.analyser.connect(this.ctx.destination);
    }
    return this.ctx;
  }
  // Must be called from a user gesture (iOS / Samsung autoplay unlock).
  async unlock() {
    this.ensure();
    if (this.ctx.state !== "running") { try { await this.ctx.resume(); } catch (_) {} }
    const b = this.ctx.createBuffer(1, 1, 22050);
    const s = this.ctx.createBufferSource();
    s.buffer = b; s.connect(this.ctx.destination); s.start(0);
  }
  stop() { try { if (this.cur) this.cur.stop(); } catch (_) {} this.active = false; }
  play(float32, sr) {
    return new Promise((resolve) => {
      this.ensure();
      const buf = this.ctx.createBuffer(1, float32.length, sr);
      buf.copyToChannel(float32, 0);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.analyser);
      this.cur = src; this.active = true;
      src.onended = () => { this.active = false; this.cur = null; resolve(); };
      src.start();
    });
  }
  // Live RMS amplitude -> 0..1, with fast attack / slower release smoothing.
  sample() {
    if (!this.active || !this.analyser) { this.level *= 0.75; return this.level; }
    this.analyser.getFloatTimeDomainData(this.data);
    let s = 0;
    for (let i = 0; i < this.data.length; i++) s += this.data[i] * this.data[i];
    const rms = Math.sqrt(s / this.data.length);
    let v = (rms - 0.004) / 0.11;          // noise floor + range
    v = Math.max(0, Math.min(1, v));
    const a = v > this.level ? 0.55 : 0.20; // snappy open, gentle close
    this.level += (v - this.level) * a;
    return this.level;
  }
}

// ---- MicEngine: LIVE microphone amplitude for the speak-as-avatar feature -----
// getUserMedia mic stream -> AnalyserNode -> live RMS, shaped to the same 0..1
// envelope as SpeechPlayer.sample(). This is what lets a human drive a chosen
// avatar's mouth from their REAL voice — no camera, no TTS. Designed to fail
// GRACEFULLY: if there's no mic API or the user blocks permission, enable()
// resolves false and the avatar simply stays static (its face still renders).
export class MicEngine {
  constructor() {
    this.ctx = null; this.analyser = null; this.data = null;
    this.stream = null; this.source = null;
    this.level = 0; this.active = false; this.denied = false; this.error = null;
  }
  get supported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia &&
              (window.AudioContext || window.webkitAudioContext));
  }
  // Must be called from a user gesture (the seat tap). Resolves true once the mic
  // is live; false (never throws) if unsupported or permission was blocked.
  async enable() {
    if (this.active) return true;
    if (!this.supported) { this.error = "unsupported"; return false; }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
    } catch (e) {
      this.denied = true;
      this.error = (e && e.name) || "denied";
      return false;                         // graceful: caller shows a fallback note
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    if (this.ctx.state !== "running") { try { await this.ctx.resume(); } catch (_) {} }
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.0;
    this.data = new Float32Array(this.analyser.fftSize);
    // analyser is intentionally NOT connected to destination — we only READ the
    // amplitude; routing the mic to the speakers would cause feedback/echo.
    this.source.connect(this.analyser);
    this.active = true; this.denied = false; this.error = null;
    return true;
  }
  disable() {
    this.active = false;
    try { if (this.source) this.source.disconnect(); } catch (_) {}
    try { if (this.stream) this.stream.getTracks().forEach((t) => t.stop()); } catch (_) {}
    try { if (this.ctx) this.ctx.close(); } catch (_) {}
    this.source = null; this.stream = null; this.analyser = null; this.ctx = null;
    this.level = 0;
  }
  // Live RMS amplitude -> 0..1, fast attack / slower release (same envelope shape
  // the faces already expect from TTS, so the exact jaw-drop path is reused).
  sample() {
    if (!this.active || !this.analyser) { this.level *= 0.75; return this.level; }
    this.analyser.getFloatTimeDomainData(this.data);
    let s = 0;
    for (let i = 0; i < this.data.length; i++) s += this.data[i] * this.data[i];
    const rms = Math.sqrt(s / this.data.length);
    let v = (rms - 0.006) / 0.10;           // mic noise floor a touch above TTS's
    v = Math.max(0, Math.min(1, v));
    const a = v > this.level ? 0.6 : 0.22;  // snappy open, gentle close
    this.level += (v - this.level) * a;
    return this.level;
  }
}

// ---- FaceRenderer: the proven top-lip-anchored jaw-drop, in the browser -------
function loadImage(src) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
}
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class FaceRenderer {
  constructor(canvas, cfg) {
    this.c = canvas; this.cfg = cfg;
    this.ctx = canvas.getContext("2d");
    this.img = null;
    this.open = 0; this.blink = 0; this.blinkPhase = null;
    this.t = 0; this.nextBlink = 1 + Math.random() * 3;
    this.levelFn = () => 0;
    this.speaking = false;
  }
  async load() {
    if (this.cfg.imageCanvas) {
      // a pre-rendered stand-in face (offscreen canvas) — reuses every effect
      this.img = this.cfg.imageCanvas;
      this.c.width = this.img.width;
      this.c.height = this.img.height;
    } else {
      this.img = await loadImage(this.cfg.image);
      this.c.width = this.img.naturalWidth;
      this.c.height = this.img.naturalHeight;
    }
    this.draw();
  }
  setLevelFn(fn) { this.levelFn = fn; }
  tick(dt) {
    this.t += dt;
    const target = Math.min(1, this.levelFn() * (this.cfg.mouthGain || 1));
    this.open += (target - this.open) * (target > this.open ? 0.6 : 0.3);
    // blink scheduler
    this.nextBlink -= dt;
    if (this.nextBlink <= 0 && this.blinkPhase == null) this.blinkPhase = 0;
    if (this.blinkPhase != null) {
      this.blinkPhase += dt / 0.13;
      if (this.blinkPhase >= 1) { this.blinkPhase = null; this.blink = 0; this.nextBlink = 2 + Math.random() * 4; }
      else this.blink = Math.sin(this.blinkPhase * Math.PI);
    }
    this.swayX = Math.sin(this.t * 0.7) * 2;
    this.swayY = Math.sin(this.t * 0.5 + 1) * 1.4 + this.open * 1.2;
    this.draw();
  }
  draw() {
    const { ctx, img, cfg } = this;
    if (!img) return;
    const W = this.c.width, H = this.c.height;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(this.swayX || 0, this.swayY || 0);
    ctx.drawImage(img, 0, 0, W, H);

    const anchorY = cfg.anchor * H;
    const jawBottom = (cfg.jawBottom || 0.95) * H;
    const shift = this.open * (cfg.maxShift || 0) * H;
    if (shift > 0.4) {
      const jawH = jawBottom - anchorY;
      ctx.drawImage(img, 0, anchorY, W, jawH, 0, anchorY + shift, W, jawH);
    }
    // mouth cavity — pinned at the top-lip anchor, opens DOWNWARD only
    const ch = this.open * (cfg.maxOpen || 0.08) * H;
    if (ch > 0.6) {
      const cw = cfg.mouthW * W, cx = cfg.mouthCx * W;
      roundRect(ctx, cx - cw / 2, anchorY, cw, ch, Math.min(cw, ch) / 2.3);
      ctx.fillStyle = cfg.cavityColor || "#2a2620";
      ctx.fill();
    }
    // blink — sage eyelid drops from the top of the eye box
    if (this.blink > 0.02 && cfg.eye) {
      const ex = cfg.eye.x * W, ey = cfg.eye.y * H, ew = cfg.eye.w * W, eh = cfg.eye.h * H;
      const lidH = this.blink * eh;
      ctx.fillStyle = cfg.lidColor || "#7b8a65";
      roundRect(ctx, ex, ey, ew, lidH, Math.min(8, lidH));
      ctx.fill();
    }
    ctx.restore();

    if (OVERLAY) {
      ctx.save();
      ctx.strokeStyle = "#0078ff"; ctx.lineWidth = 1.5;
      if (cfg.eye) ctx.strokeRect(cfg.eye.x * W, cfg.eye.y * H, cfg.eye.w * W, cfg.eye.h * H);
      ctx.strokeStyle = "red";
      ctx.beginPath(); ctx.moveTo(0, anchorY); ctx.lineTo(W, anchorY); ctx.stroke();
      ctx.strokeStyle = "#00c800";
      ctx.beginPath(); ctx.moveTo(0, jawBottom); ctx.lineTo(W, jawBottom); ctx.stroke();
      ctx.restore();
    }
  }
}

// ---- AbstractRenderer: NO face. Speaking-glow + sound-bars only. -------------
// For logo / map / faceless seats — we never bolt a fake mouth on these.
export class AbstractRenderer {
  constructor(canvas, cfg) {
    this.c = canvas; this.cfg = cfg;
    this.ctx = canvas.getContext("2d");
    this.t = 0; this.level = 0; this.glow = 0;
    this.levelFn = () => 0;
    this.img = null;
    this.c.width = 360; this.c.height = 360;
  }
  async load() {
    // Optional STATIC face behind the glow (e.g. Grok's helmet tile). It never
    // moves a mouth — abstract seats show a speaking-glow + sound-bars only.
    if (this.cfg.image) {
      try {
        this.img = await loadImage(this.cfg.image);
        this.c.width = this.img.naturalWidth;
        this.c.height = this.img.naturalHeight;
      } catch (_) { this.img = null; }
    }
    this.draw();
  }
  setLevelFn(fn) { this.levelFn = fn; }
  tick(dt) {
    this.t += dt;
    const target = this.levelFn();
    this.level += (target - this.level) * (target > this.level ? 0.5 : 0.2);
    const gt = target > 0.02 ? 1 : 0;
    this.glow += (gt - this.glow) * 0.12;
    this.draw();
  }
  draw() {
    const { ctx, cfg, img } = this, W = this.c.width, H = this.c.height;
    ctx.clearRect(0, 0, W, H);
    const col = cfg.color || "#6b6b6b";
    if (img) {
      // STATIC real face (Grok's helmet). No mouth — glow + bars signal speaking.
      ctx.drawImage(img, 0, 0, W, H);
    } else {
      // plate
      roundRect(ctx, 16, 16, W - 32, H - 32, 28);
      ctx.fillStyle = cfg.plate || "#f3efe4"; ctx.fill();
    }
    // speaking glow ring
    if (this.glow > 0.01) {
      ctx.save();
      ctx.globalAlpha = 0.35 * this.glow + 0.25 * this.level;
      ctx.lineWidth = 6 + 10 * this.level;
      ctx.strokeStyle = col;
      roundRect(ctx, 16, 16, W - 32, H - 32, 28); ctx.stroke();
      ctx.restore();
    }
    if (!img) {
      // brand mark: monogram in a coloured disc (only when there's no real face)
      const cx = W / 2, cy = H / 2 - 18, R = 64;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "700 64px -apple-system,Segoe UI,Roboto,sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(cfg.mark || (cfg.name || "?")[0], cx, cy + 2);
    }
    // sound-bars / equaliser at the bottom — react to live amplitude
    const bars = 7, bw = 12, gap = 9;
    const totW = bars * bw + (bars - 1) * gap;
    let bx = W / 2 - totW / 2;
    const baseY = H - 58;
    for (let i = 0; i < bars; i++) {
      const phase = this.t * 9 + i * 0.9;
      const amp = this.level * (0.55 + 0.45 * Math.sin(phase));
      const h = 6 + Math.max(0, amp) * 46;
      roundRect(ctx, bx, baseY - h, bw, h, 5);
      ctx.fillStyle = col; ctx.globalAlpha = 0.55 + 0.45 * this.level;
      ctx.fill(); ctx.globalAlpha = 1;
      bx += bw + gap;
    }
  }
}

// One shared rAF loop drives every renderer on the page.
const _renderers = new Set();
let _last = 0;
export function registerRenderer(r) { _renderers.add(r); }
export function startLoop() {
  function frame(t) {
    const dt = _last ? Math.min(0.05, (t - _last) / 1000) : 0.016;
    _last = t;
    _renderers.forEach((r) => r.tick(dt));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ---- Roster: seats, kinds, and the seat->voice mapping -----------------------
// FACE seats get a moving mouth (real Kokoro voice). ABSTRACT seats keep a
// speaking-glow / sound-bars only — no fake mouth bolted on.
export const BOBBY = {
  id: "bobby", name: "Bobby", kind: "face",
  image: "avatars/bobby.png",
  voice: "am_michael",                 // warm, steady American male
  eye: { x: 0.205, y: 0.455, w: 0.600, h: 0.250 },
  anchor: 0.755, mouthCx: 0.500, mouthW: 0.190,
  jawBottom: 0.915, maxOpen: 0.090, maxShift: 0.013,
  cavityColor: "#2a2620", lidColor: "#7b8a65", mouthGain: 1.0,
};
