// engine.js — shared engine for the talking-faces preview
// Three pieces: KokoroEngine (free in-browser TTS), SpeechPlayer (Web Audio +
// live RMS for lip-sync), FaceRenderer (top-lip-anchored jaw-drop + blink + sway).
// Plus the seat roster (characters + seat->voice mapping).

import { KokoroTTS } from "https://esm.sh/kokoro-js@1.2.1";

export const DEBUG = new URLSearchParams(location.search).has("debug");
const QS = new URLSearchParams(location.search);

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
    this.img = await loadImage(this.cfg.image);
    this.c.width = this.img.naturalWidth;
    this.c.height = this.img.naturalHeight;
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

    if (DEBUG) {
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
