// roster.js — the full boardroom: seats, distinct Kokoro voices, and the
// stand-in character faces (drawn here so the talking mechanism is exact).
// FACE seats get a moving mouth. ABSTRACT seats keep glow + sound-bars only.
//
// NOTE: Roberta / the hippo Chair / the owl are STAND-IN faces — the real
// HippoChattie character tiles weren't reachable from this build. Drop the real
// tiles in and swap `imageCanvas` for `image:'avatars/<x>.png'` + tune geometry.
import { BOBBY } from "./engine.js";

function mk() { const c = document.createElement("canvas"); c.width = 360; c.height = 360; return c; }
function rr(x, a, b, w, h, r) { r = Math.min(r, w / 2, h / 2); x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
function eye(x, cx, cy, rw, rh, pr, look) {
  x.fillStyle = "#fff"; x.beginPath(); x.ellipse(cx, cy, rw, rh, 0, 0, 7); x.fill();
  x.fillStyle = "#2b2b2b"; x.beginPath(); x.ellipse(cx + (look || 0), cy + 3, pr, pr, 0, 0, 7); x.fill();
  x.fillStyle = "#fff"; x.beginPath(); x.ellipse(cx + (look || 0) + pr * 0.4, cy - pr * 0.3, pr * 0.32, pr * 0.32, 0, 0, 7); x.fill();
}

// ---- Hippo Chair (mauve) ------------------------------------------------------
function drawHippo() {
  const c = mk(), x = c.getContext("2d");
  x.fillStyle = "#6f6a88"; // ears
  for (const ex of [112, 248]) { x.beginPath(); x.ellipse(ex, 96, 26, 30, 0, 0, 7); x.fill(); }
  x.fillStyle = "#9189ad"; x.strokeStyle = "#6f6a88"; x.lineWidth = 4; // head
  x.beginPath(); x.ellipse(180, 196, 132, 122, 0, 0, 7); x.fill(); x.stroke();
  eye(x, 132, 150, 28, 28, 12, 4); eye(x, 228, 150, 28, 28, 12, 4);
  x.fillStyle = "#a7a0c2"; x.beginPath(); x.ellipse(180, 256, 96, 70, 0, 0, 7); x.fill(); // snout
  x.fillStyle = "#5b5375"; // nostrils
  for (const nx of [150, 210]) { x.beginPath(); x.ellipse(nx, 240, 9, 13, 0, 0, 7); x.fill(); }
  x.strokeStyle = "#5b5375"; x.lineWidth = 7; x.lineCap = "round"; // closed smile
  x.beginPath(); x.moveTo(120, 292); x.quadraticCurveTo(180, 312, 240, 292); x.stroke();
  return c;
}
// ---- Owl / Perplexity (teal) --------------------------------------------------
function drawOwl() {
  const c = mk(), x = c.getContext("2d");
  x.fillStyle = "#1a6b76"; // ear tufts
  x.beginPath(); x.moveTo(70, 70); x.lineTo(120, 120); x.lineTo(95, 150); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(290, 70); x.lineTo(240, 120); x.lineTo(265, 150); x.closePath(); x.fill();
  x.fillStyle = "#20808D"; x.beginPath(); x.ellipse(180, 188, 140, 140, 0, 0, 7); x.fill(); // head
  x.fillStyle = "#15616b"; // eye discs
  for (const ex of [120, 240]) { x.beginPath(); x.ellipse(ex, 165, 60, 60, 0, 0, 7); x.fill(); }
  eye(x, 120, 165, 44, 44, 24, 3); eye(x, 240, 165, 44, 44, 24, 3);
  x.fillStyle = "#E8833A"; // beak
  x.beginPath(); x.moveTo(180, 192); x.lineTo(206, 214); x.lineTo(180, 240); x.lineTo(154, 214); x.closePath(); x.fill();
  return c;
}
// ---- Daisy-robot Roberta (golden + white petals) ------------------------------
function drawDaisy() {
  const c = mk(), x = c.getContext("2d");
  const cx = 180, cy = 176;
  x.fillStyle = "#ffffff"; x.strokeStyle = "#ece4cb"; x.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const px = cx + Math.cos(a) * 96, py = cy + Math.sin(a) * 96;
    x.save(); x.translate(px, py); x.rotate(a);
    x.beginPath(); x.ellipse(0, 0, 40, 22, 0, 0, 7); x.fill(); x.stroke(); x.restore();
  }
  x.fillStyle = "#FBE3A0"; x.strokeStyle = "#e9c869"; x.lineWidth = 4; // face disc
  x.beginPath(); x.ellipse(cx, cy, 92, 92, 0, 0, 7); x.fill(); x.stroke();
  x.fillStyle = "rgba(231,120,120,.5)"; // cheeks
  for (const chx of [128, 232]) { x.beginPath(); x.ellipse(chx, 196, 16, 11, 0, 0, 7); x.fill(); }
  eye(x, 150, 166, 14, 17, 10, 1); eye(x, 210, 166, 14, 17, 10, 1);
  x.strokeStyle = "#a85a4a"; x.lineWidth = 6; x.lineCap = "round"; // smile
  x.beginPath(); x.moveTo(156, 210); x.quadraticCurveTo(180, 226, 204, 210); x.stroke();
  return c;
}

const FACE_COMMON = { kind: "face", maxShift: 0.012 };

export const ROSTER = [
  { ...BOBBY, role: "your Bobby · personal aide",
    line: "And I'm your Bobby — here for you, and I'll speak up when it helps." },

  { ...FACE_COMMON, id: "roberta", name: "Roberta", role: "house host · daisy-robot · stand-in art",
    standin: true, imageCanvas: drawDaisy(), voice: "af_heart",
    eye: { x: 0.355, y: 0.40, w: 0.29, h: 0.16 }, anchor: 0.585, mouthCx: 0.5, mouthW: 0.17,
    jawBottom: 0.72, maxOpen: 0.075, cavityColor: "#8f3a31", lidColor: "#FBE3A0",
    line: "Welcome — I'm Roberta, your host. The table's set; let's begin." },

  { ...FACE_COMMON, id: "chair", name: "Chairman", role: "the Chair · hippo · stand-in art",
    standin: true, imageCanvas: drawHippo(), voice: "bm_george",
    eye: { x: 0.27, y: 0.345, w: 0.46, h: 0.16 }, anchor: 0.795, mouthCx: 0.5, mouthW: 0.36,
    jawBottom: 0.89, maxOpen: 0.10, cavityColor: "#5b2b3a", lidColor: "#9189ad",
    line: "As Chair I'll keep us on track, and sum it up at the end." },

  { ...FACE_COMMON, id: "perplexity", name: "Perplexity", role: "research · owl · stand-in art",
    standin: true, imageCanvas: drawOwl(), voice: "bf_emma",
    eye: { x: 0.16, y: 0.30, w: 0.67, h: 0.30 }, anchor: 0.665, mouthCx: 0.5, mouthW: 0.20,
    jawBottom: 0.82, maxOpen: 0.085, cavityColor: "#2a1c0e", lidColor: "#20808D",
    line: "I'll bring the live facts — freshly checked, with sources." },

  // ABSTRACT seats — logo / map / faceless. Glow + sound-bars only, no fake mouth.
  { id: "chatgpt", name: "ChatGPT", role: "seat · abstract", kind: "abstract",
    color: "#10a37f", mark: "C", voice: "am_adam",
    line: "Happy to help shape the plan and draft the words." },
  { id: "gemini", name: "Gemini", role: "seat · abstract", kind: "abstract",
    color: "#4285F4", mark: "G", voice: "af_sarah",
    line: "I'll weigh the trade-offs and keep us balanced." },
  { id: "deepseek", name: "DeepSeek", role: "seat · abstract", kind: "abstract",
    color: "#4D6BFE", mark: "D", voice: "am_eric",
    line: "I'll dig into the technical detail and the edge cases." },
  { id: "grok", name: "Grok", role: "seat · abstract", kind: "abstract",
    color: "#1d1d1f", mark: "X", voice: "am_fenrir",
    line: "I'll say the blunt thing everyone's thinking." },
  { id: "openrouter", name: "OpenRouter", role: "the map · one key, many minds", kind: "abstract",
    color: "#6b5bd1", mark: "OR", voice: "af_bella",
    line: "I'm the doorway — one key, many minds at the table." },
];
