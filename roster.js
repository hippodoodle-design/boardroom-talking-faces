// roster.js — the full boardroom: seats, distinct Kokoro voices, and the faces.
// FACE seats get a moving mouth. ABSTRACT seats keep glow + sound-bars only.
//
// REAL HippoChattie tiles are now wired for the captioned seats — each loads its
// real avatars/<seat>.jpg and its mouth box is tuned to that character's actual
// mouth/beak (same method as Bobby/Roberta). The tiles were supplied as card
// screenshots and cropped to just the character art (caption bar + chrome removed).
//
// Still stand-in: DeepSeek (no tile supplied yet — keeps its branded stand-in
// face that still talks). GROK is the one seat with no mouth, so it stays the
// single ABSTRACT seat (speaking-glow + sound-bars) — now showing its real helmet
// tile as a static face behind the glow.
import { BOBBY } from "./engine.js";

function mk() { const c = document.createElement("canvas"); c.width = 360; c.height = 360; return c; }
function rr(x, a, b, w, h, r) { r = Math.min(r, w / 2, h / 2); x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
function eye(x, cx, cy, rw, rh, pr, look) {
  x.fillStyle = "#fff"; x.beginPath(); x.ellipse(cx, cy, rw, rh, 0, 0, 7); x.fill();
  x.fillStyle = "#2b2b2b"; x.beginPath(); x.ellipse(cx + (look || 0), cy + 3, pr, pr, 0, 0, 7); x.fill();
  x.fillStyle = "#fff"; x.beginPath(); x.ellipse(cx + (look || 0) + pr * 0.4, cy - pr * 0.3, pr * 0.32, pr * 0.32, 0, 0, 7); x.fill();
}

// ---- Brand stand-in face (DeepSeek only — its real tile hasn't landed yet) -----
// Keeps the brand colour + monogram so the seat stays recognisable; it still has a
// mouth and talks (only Grok is mouthless). Swap for the real tile when it lands.
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
const drawDeepSeek = drawBrandFace("#4D6BFE", "D");

const FACE_COMMON = { kind: "face", maxShift: 0.012 };

export const ROSTER = [
  { ...BOBBY, role: "your Bobby · personal aide",
    line: "And I'm your Bobby — here for you, and I'll speak up when it helps." },

  // Roberta — REAL canonical tile. Mouth box sits on the SMILE on her FACE; the
  // blue belly SCREEN stays static (anchor/jawBottom kept above the screen edge).
  { ...FACE_COMMON, id: "roberta", name: "Roberta", role: "house host · daisy-robot",
    image: "avatars/roberta.png", voice: "af_heart",
    eye: { x: 0.355, y: 0.247, w: 0.235, h: 0.052 }, anchor: 0.311, mouthCx: 0.503, mouthW: 0.063,
    jawBottom: 0.352, maxOpen: 0.028, maxShift: 0.004, cavityColor: "#7e3b33", lidColor: "#f2f1f6",
    line: "Welcome — I'm Roberta, your host. The table's set; let's begin." },

  // Chair — REAL tile (Claude ai · Chairman hippo). Mouth box on the hippo's mouth
  // line where the snout meets the lower jaw; modest jaw-drop.
  { ...FACE_COMMON, id: "chair", name: "Chairman", role: "the Chair · Claude ai · hippo",
    image: "avatars/chair.jpg", voice: "bm_george",
    eye: { x: 0.36, y: 0.25, w: 0.28, h: 0.10 }, anchor: 0.455, mouthCx: 0.50, mouthW: 0.22,
    jawBottom: 0.565, maxOpen: 0.055, maxShift: 0.004, cavityColor: "#5b2b3a", lidColor: "#8d8898",
    line: "As Chair I'll keep us on track, and sum it up at the end." },

  // CC / Coder — REAL tile. NEW seat: the captioned 'CC / Coder' tile had no
  // pre-existing stand-in seat, so a face seat was added for it (Claude Code, the
  // builder). Mouth box on the open smile.
  { ...FACE_COMMON, id: "cc", name: "CC", role: "Coder · Claude Code",
    image: "avatars/cc.jpg", voice: "am_liam",
    eye: { x: 0.33, y: 0.36, w: 0.36, h: 0.13 }, anchor: 0.565, mouthCx: 0.47, mouthW: 0.13,
    jawBottom: 0.66, maxOpen: 0.05, maxShift: 0.004, cavityColor: "#5a2a2e", lidColor: "#d59a72",
    line: "I'm CC — I'll wire it up and make sure it actually runs." },

  // Perplexity — REAL tile (scholar owl). Mouth box on the beak; modest open so it
  // reads as the beak parting, not unhinging.
  { ...FACE_COMMON, id: "perplexity", name: "Perplexity", role: "research · owl",
    image: "avatars/perplexity.jpg", voice: "bf_emma",
    eye: { x: 0.22, y: 0.33, w: 0.52, h: 0.15 }, anchor: 0.52, mouthCx: 0.48, mouthW: 0.11,
    jawBottom: 0.63, maxOpen: 0.06, maxShift: 0.004, cavityColor: "#241a0e", lidColor: "#d9cdb8",
    line: "I'll bring the live facts — freshly checked, with sources." },

  // OpenAI — REAL tile (robot in the teal hoodie). Mouth box on the little smile on
  // the dark face screen; dark cavity blends into the screen.
  { ...FACE_COMMON, id: "chatgpt", name: "ChatGPT", role: "seat · OpenAI",
    image: "avatars/openai.jpg", voice: "am_adam",
    eye: { x: 0.36, y: 0.28, w: 0.28, h: 0.09 }, anchor: 0.40, mouthCx: 0.49, mouthW: 0.12,
    jawBottom: 0.48, maxOpen: 0.045, maxShift: 0.003, cavityColor: "#0a1a1a", lidColor: "#0e1c1f",
    line: "Happy to help shape the plan and draft the words." },

  // Gemini — REAL tile (galaxy baby). Mouth box on the small smile.
  { ...FACE_COMMON, id: "gemini", name: "Gemini", role: "seat · brand",
    image: "avatars/gemini.jpg", voice: "af_sarah",
    eye: { x: 0.28, y: 0.40, w: 0.44, h: 0.15 }, anchor: 0.57, mouthCx: 0.48, mouthW: 0.14,
    jawBottom: 0.66, maxOpen: 0.05, maxShift: 0.004, cavityColor: "#2a1a3a", lidColor: "#6a5a88",
    line: "I'll weigh the trade-offs and keep us balanced." },

  // DeepSeek — STILL stand-in (no real tile supplied yet). Keeps a branded face
  // that talks. Swap imageCanvas for image:'avatars/deepseek.png' when it lands.
  { ...FACE_COMMON, id: "deepseek", name: "DeepSeek", role: "seat · brand · stand-in art",
    standin: true, imageCanvas: drawDeepSeek(), voice: "am_eric",
    eye: { x: 0.36, y: 0.475, w: 0.28, h: 0.15 }, anchor: 0.694, mouthCx: 0.5, mouthW: 0.16,
    jawBottom: 0.90, maxOpen: 0.075, cavityColor: "#172148", lidColor: "#efe9dd",
    line: "I'll dig into the technical detail and the edge cases." },

  // OpenRouter — REAL tile (paper-bag character; the map look is just print on the
  // bag). Mouth box on its open smile.
  { ...FACE_COMMON, id: "openrouter", name: "OpenRouter",
    role: "paper-bag seat · one key, many minds",
    image: "avatars/openrouter.jpg", voice: "af_bella",
    eye: { x: 0.34, y: 0.36, w: 0.30, h: 0.12 }, anchor: 0.52, mouthCx: 0.47, mouthW: 0.13,
    jawBottom: 0.63, maxOpen: 0.06, maxShift: 0.004, cavityColor: "#5a2a28", lidColor: "#e6dcc6",
    line: "I'm the doorway — one key, many minds at the table." },

  // ABSTRACT seat — GROK is the ONLY avatar without a mouth, so it alone keeps the
  // speaking-glow + sound-bars (no fake mouth bolted on). Now shows its REAL helmet
  // tile as a static face behind the glow.
  { id: "grok", name: "Grok", role: "seat · no mouth · glow + sound-bars", kind: "abstract",
    image: "avatars/grok.jpg", color: "#5b6cff", mark: "G", voice: "am_fenrir",
    line: "I'll say the blunt thing everyone's thinking." },
];
