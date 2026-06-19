// roster.js — the full boardroom: seats, distinct Kokoro voices, and the
// stand-in character faces (drawn here so the talking mechanism is exact).
// FACE seats get a moving mouth. ABSTRACT seats keep glow + sound-bars only.
//
// NOTE: Roberta now uses her REAL canonical tile (avatars/roberta.png —
// Roberta_Front_Canonical_v2). Her moving mouth sits on the SMILE on her FACE;
// the blue belly SCREEN is a screen, not a mouth, and stays static.
// The hippo Chair / the owl / the OpenRouter paper bag / the
// ChatGPT-Gemini-DeepSeek brand seats are still STAND-IN faces — the real
// HippoChattie tiles weren't reachable from this build. Drop the real tiles in
// and swap `imageCanvas` for `image:'avatars/<x>.png'` + tune geometry. GROK is
// the one seat with no mouth, so it stays abstract (speaking-glow + sound-bars).
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
// (Roberta's hand-drawn daisy-robot stand-in has been retired — she now loads
//  her real canonical tile avatars/roberta.png. See the ROSTER entry below.)

// ---- OpenRouter — paper-bag character (teal "map" is just print on the bag) ---
// OpenRouter is NOT an abstract map: it's a paper-bag CHARACTER with a real
// mouth, so it gets the jaw-drop like the other faces. The map-looking lines are
// just the pattern printed on the kraft bag.
function drawPaperBag() {
  const c = mk(), x = c.getContext("2d");
  const kraft = "#c9a36a", edge = "#a9824c", fold = "#b8915c";
  x.fillStyle = kraft; x.strokeStyle = edge; x.lineWidth = 4; // bag body
  rr(x, 60, 72, 240, 250, 24); x.fill(); x.stroke();
  x.fillStyle = fold; // crumpled folded top
  x.beginPath(); x.moveTo(60, 96);
  x.lineTo(96, 72); x.lineTo(134, 92); x.lineTo(174, 70);
  x.lineTo(212, 92); x.lineTo(248, 72); x.lineTo(300, 96);
  x.lineTo(300, 108); x.lineTo(60, 108); x.closePath(); x.fill();
  x.save(); rr(x, 60, 72, 240, 250, 24); x.clip();
  x.strokeStyle = "rgba(120,90,50,.16)"; x.lineWidth = 3; // vertical creases
  for (const cx of [120, 180, 240]) { x.beginPath(); x.moveTo(cx, 110); x.lineTo(cx, 318); x.stroke(); }
  // printed "map": faint grid + a couple of dashed routes + pins, in OR purple
  x.strokeStyle = "rgba(90,70,40,.20)"; x.lineWidth = 1.4;
  for (let gy = 124; gy < 312; gy += 26) { x.beginPath(); x.moveTo(66, gy); x.lineTo(294, gy); x.stroke(); }
  for (let gx = 88; gx < 296; gx += 26) { x.beginPath(); x.moveTo(gx, 110); x.lineTo(gx, 316); x.stroke(); }
  x.strokeStyle = "#6b5bd1"; x.lineWidth = 3; x.lineCap = "round"; x.setLineDash([7, 6]);
  x.beginPath(); x.moveTo(96, 150); x.quadraticCurveTo(174, 130, 252, 168); x.stroke();
  x.beginPath(); x.moveTo(108, 296); x.quadraticCurveTo(180, 256, 262, 290); x.stroke();
  x.setLineDash([]); x.fillStyle = "#6b5bd1";
  for (const [px, py] of [[96, 150], [252, 168], [108, 296], [262, 290]]) { x.beginPath(); x.ellipse(px, py, 5, 5, 0, 0, 7); x.fill(); }
  x.restore();
  eye(x, 132, 190, 26, 26, 12, 2); eye(x, 228, 190, 26, 26, 12, 2); // face on the bag
  x.strokeStyle = "#5a4422"; x.lineWidth = 6; x.lineCap = "round"; // closed mouth (anchor row)
  x.beginPath(); x.moveTo(150, 232); x.quadraticCurveTo(180, 246, 210, 232); x.stroke();
  return c;
}

// ---- Brand stand-in face (ChatGPT / Gemini / DeepSeek) ------------------------
// Their real HippoChattie tiles weren't reachable, but they DO have mouths (only
// Grok doesn't) — so each gets a simple branded stand-in face that talks. Keeps
// the brand colour + monogram so the seat stays recognisable; swap imageCanvas
// for the real tile when it lands.
function drawBrandFace(color, mark) {
  return function () {
    const c = mk(), x = c.getContext("2d");
    rr(x, 40, 44, 280, 280, 58); x.fillStyle = "#f3efe4"; x.fill(); // plate
    x.save(); rr(x, 40, 44, 280, 280, 58); x.clip();
    x.globalAlpha = 0.16; x.fillStyle = color; x.fillRect(40, 44, 280, 280); x.restore();
    x.strokeStyle = color; x.lineWidth = 5; rr(x, 40, 44, 280, 280, 58); x.stroke();
    x.fillStyle = color; x.beginPath(); x.ellipse(180, 96, 30, 30, 0, 0, 7); x.fill(); // monogram chip
    x.fillStyle = "#fff"; x.font = "700 30px -apple-system,Segoe UI,Roboto,sans-serif";
    x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(mark, 180, 98);
    eye(x, 142, 198, 22, 24, 12, 1); eye(x, 218, 198, 22, 24, 12, 1);
    x.globalAlpha = 0.18; x.fillStyle = color; // cheeks
    for (const chx of [126, 234]) { x.beginPath(); x.ellipse(chx, 226, 16, 11, 0, 0, 7); x.fill(); }
    x.globalAlpha = 1;
    x.strokeStyle = color; x.lineWidth = 6; x.lineCap = "round"; // closed mouth (anchor row)
    x.beginPath(); x.moveTo(154, 250); x.quadraticCurveTo(180, 264, 206, 250); x.stroke();
    return c;
  };
}
const drawChatGPT = drawBrandFace("#10a37f", "C");
const drawGemini = drawBrandFace("#4285F4", "G");
const drawDeepSeek = drawBrandFace("#4D6BFE", "D");

const FACE_COMMON = { kind: "face", maxShift: 0.012 };

export const ROSTER = [
  { ...BOBBY, role: "your Bobby · personal aide",
    line: "And I'm your Bobby — here for you, and I'll speak up when it helps." },

  // Roberta — REAL canonical tile (Roberta_Front_Canonical_v2). Mouth box sits on
  // the SMILE on her FACE; the blue belly SCREEN is a screen, not a mouth, so it
  // stays static (anchor/jawBottom are kept well above the screen's top edge).
  { ...FACE_COMMON, id: "roberta", name: "Roberta", role: "house host · daisy-robot",
    image: "avatars/roberta.png", voice: "af_heart",
    eye: { x: 0.355, y: 0.247, w: 0.235, h: 0.052 }, anchor: 0.311, mouthCx: 0.503, mouthW: 0.063,
    jawBottom: 0.352, maxOpen: 0.028, maxShift: 0.004, cavityColor: "#7e3b33", lidColor: "#f2f1f6",
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

  // BRAND seats — stand-in faces with a mouth (real tiles pending). Each keeps
  // its own distinct Kokoro voice.
  { ...FACE_COMMON, id: "chatgpt", name: "ChatGPT", role: "seat · brand · stand-in art",
    standin: true, imageCanvas: drawChatGPT(), voice: "am_adam",
    eye: { x: 0.36, y: 0.475, w: 0.28, h: 0.15 }, anchor: 0.694, mouthCx: 0.5, mouthW: 0.16,
    jawBottom: 0.90, maxOpen: 0.075, cavityColor: "#0c352a", lidColor: "#efe9dd",
    line: "Happy to help shape the plan and draft the words." },

  { ...FACE_COMMON, id: "gemini", name: "Gemini", role: "seat · brand · stand-in art",
    standin: true, imageCanvas: drawGemini(), voice: "af_sarah",
    eye: { x: 0.36, y: 0.475, w: 0.28, h: 0.15 }, anchor: 0.694, mouthCx: 0.5, mouthW: 0.16,
    jawBottom: 0.90, maxOpen: 0.075, cavityColor: "#16284a", lidColor: "#efe9dd",
    line: "I'll weigh the trade-offs and keep us balanced." },

  { ...FACE_COMMON, id: "deepseek", name: "DeepSeek", role: "seat · brand · stand-in art",
    standin: true, imageCanvas: drawDeepSeek(), voice: "am_eric",
    eye: { x: 0.36, y: 0.475, w: 0.28, h: 0.15 }, anchor: 0.694, mouthCx: 0.5, mouthW: 0.16,
    jawBottom: 0.90, maxOpen: 0.075, cavityColor: "#172148", lidColor: "#efe9dd",
    line: "I'll dig into the technical detail and the edge cases." },

  { ...FACE_COMMON, id: "openrouter", name: "OpenRouter",
    role: "paper-bag seat · one key, many minds · stand-in art",
    standin: true, imageCanvas: drawPaperBag(), voice: "af_bella",
    eye: { x: 0.30, y: 0.44, w: 0.40, h: 0.16 }, anchor: 0.645, mouthCx: 0.5, mouthW: 0.18,
    jawBottom: 0.872, maxOpen: 0.08, cavityColor: "#3a2a16", lidColor: "#c9a36a",
    line: "I'm the doorway — one key, many minds at the table." },

  // ABSTRACT seat — GROK is the ONLY avatar without a mouth, so it alone keeps
  // the speaking-glow + sound-bars (no fake mouth bolted on).
  { id: "grok", name: "Grok", role: "seat · no mouth · glow + sound-bars", kind: "abstract",
    color: "#1d1d1f", mark: "X", voice: "am_fenrir",
    line: "I'll say the blunt thing everyone's thinking." },
];
