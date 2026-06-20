// roster.js — the full boardroom: seats, distinct Kokoro voices, and the faces.
// FACE seats get a moving mouth. ABSTRACT seats keep glow + sound-bars only.
//
// REAL HippoChattie tiles are now wired for the captioned seats — each loads its
// real avatars/<seat>.jpg and its mouth box is tuned to that character's actual
// mouth/beak (same method as Bobby/Roberta). The tiles were supplied as card
// screenshots and cropped to just the character art (caption bar + chrome removed).
//
// The 'Amanda' seat is special: it's a SPEAK-AS-AVATAR seat (this is YOU) whose
// mouth is driven by the LIVE MIC, not TTS — see boardroom.html's toggleMic().
//
// DeepSeek now has its REAL tile too — 'DeepSeek (Whale), Deep-Sea Scholar' (a
// friendly blue whale in a lab coat). Its mouth box sits on the SMILE LINE where
// the upper/lower jaw meet and opens a MODEST dark cavity downward (a whale's jaw
// opens downward), so it reads as talking, not unhinging. GROK is the one seat with
// no mouth, so it stays the single ABSTRACT seat (speaking-glow + sound-bars) —
// showing its real helmet tile as a static face behind the glow. The branded
// stand-in drawer DeepSeek used (drawBrandFace) is retired now its tile has landed.
import { BOBBY } from "./engine.js";

const FACE_COMMON = { kind: "face", maxShift: 0.012 };

export const ROSTER = [
  // Amanda — the FIRST 'speak-as-avatar' seat. This is the previously-held '3'
  // tile, now ASSIGNED as Amanda's own self-avatar (warm grey-haired woman, round
  // glasses, flower, red-heart necklace, green cardigan). Unlike every other seat
  // its mouth is driven by the LIVE MICROPHONE (Web Audio RMS on a getUserMedia
  // stream), NOT by TTS: tap it to grant the mic, then it moves its mouth to your
  // real voice — present & expressive with NO camera. Same top-lip-anchored
  // jaw-drop + blink + sway; the speaking-glow is lit while the mic is live.
  { ...FACE_COMMON, id: "amanda", name: "Amanda", role: "You · Founder & host · live mic",
    self: true, live: true, image: "avatars/amanda.jpg", glasses: true,
    eye: { x: 0.358, y: 0.322, w: 0.267, h: 0.080 }, anchor: 0.452, mouthCx: 0.487, mouthW: 0.085,
    jawBottom: 0.600, jawW: 0.42, maxOpen: 0.024, maxShift: 0.020, mouthGain: 1.2,
    cavityColor: "#5a2a2b", cavityAlpha: 0.62, lipColor: "#c47e78", lidColor: "#e7b89c",
    line: "And this is me — when I talk, my avatar talks. No camera, just my voice." },

  { ...BOBBY, role: "your Bobby · personal aide",
    line: "And I'm your Bobby — here for you, and I'll speak up when it helps." },

  // Roberta — REAL canonical tile. Mouth box sits on the SMILE on her FACE; the
  // blue belly SCREEN stays static (anchor/jawBottom kept above the screen edge).
  { ...FACE_COMMON, id: "roberta", name: "Roberta", role: "house host · daisy-robot",
    image: "avatars/roberta.png", voice: "bf_emma",
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
    image: "avatars/cc.jpg", voice: "bm_daniel", glasses: true,
    eye: { x: 0.33, y: 0.36, w: 0.36, h: 0.13 }, anchor: 0.565, mouthCx: 0.47, mouthW: 0.13,
    jawBottom: 0.66, maxOpen: 0.05, maxShift: 0.004, cavityColor: "#5a2a2e", lipColor: "#c98a6e", lidColor: "#d59a72",
    line: "I'm CC — I'll wire it up and make sure it actually runs." },

  // Perplexity — REAL tile (scholar owl). Mouth box on the beak; modest open so it
  // reads as the beak parting, not unhinging.
  { ...FACE_COMMON, id: "perplexity", name: "Perplexity", role: "research · owl",
    image: "avatars/perplexity.jpg", voice: "bf_isabella", glasses: true,
    eye: { x: 0.22, y: 0.33, w: 0.52, h: 0.15 }, anchor: 0.52, mouthCx: 0.48, mouthW: 0.11,
    jawBottom: 0.63, maxOpen: 0.06, maxShift: 0.004, cavityColor: "#241a0e", lidColor: "#d9cdb8",
    line: "I'll bring the live facts — freshly checked, with sources." },

  // OpenAI — REAL tile (robot in the teal hoodie). Mouth box on the little smile on
  // the dark face screen; dark cavity blends into the screen.
  { ...FACE_COMMON, id: "chatgpt", name: "ChatGPT", role: "seat · OpenAI",
    image: "avatars/openai.jpg", voice: "bm_fable",
    eye: { x: 0.36, y: 0.28, w: 0.28, h: 0.09 }, anchor: 0.40, mouthCx: 0.49, mouthW: 0.12,
    jawBottom: 0.48, maxOpen: 0.045, maxShift: 0.003, cavityColor: "#0a1a1a", lidColor: "#0e1c1f",
    line: "Happy to help shape the plan and draft the words." },

  // Gemini — REAL tile (galaxy baby). Mouth box on the small smile.
  { ...FACE_COMMON, id: "gemini", name: "Gemini", role: "seat · brand",
    image: "avatars/gemini.jpg", voice: "bf_lily",
    eye: { x: 0.28, y: 0.40, w: 0.44, h: 0.15 }, anchor: 0.57, mouthCx: 0.48, mouthW: 0.14,
    jawBottom: 0.66, maxOpen: 0.05, maxShift: 0.004, cavityColor: "#2a1a3a", lidColor: "#6a5a88",
    line: "I'll weigh the trade-offs and keep us balanced." },

  // DeepSeek — REAL tile (the blue whale in a lab coat, 'Deep-Sea Scholar'). Mouth
  // box sits on the SMILE LINE where the upper jaw (grey snout) meets the cream
  // lower jaw; the dark cavity opens MODESTLY downward (whales open downward) so it
  // reads as talking. Eye box on the one visible eye; lid matches the head's blue.
  { ...FACE_COMMON, id: "deepseek", name: "DeepSeek", role: "research · whale · Deep-Sea Scholar",
    image: "avatars/deepseek.jpg", voice: "bm_lewis",
    eye: { x: 0.555, y: 0.305, w: 0.115, h: 0.070 }, anchor: 0.455, mouthCx: 0.31, mouthW: 0.26,
    jawBottom: 0.58, maxOpen: 0.042, maxShift: 0.006, cavityColor: "#16212e", lidColor: "#3d6c9a",
    line: "I'll dig into the technical detail and the edge cases." },

  // OpenRouter — REAL tile (paper-bag character; the map look is just print on the
  // bag). Mouth box on its open smile. The bag has only tiny stylised dot-eyes, so the
  // blink-lid drew as a stray whiteish band floating high on the bag (nowhere near the
  // dots) — noBlink turns it off entirely; its mouth still moves. (rev2 fix #1.)
  { ...FACE_COMMON, id: "openrouter", name: "OpenRouter",
    role: "paper-bag seat · one key, many minds",
    image: "avatars/openrouter.jpg", voice: "bf_alice", noBlink: true,
    eye: { x: 0.34, y: 0.36, w: 0.30, h: 0.12 }, anchor: 0.52, mouthCx: 0.47, mouthW: 0.13,
    jawBottom: 0.63, maxOpen: 0.06, maxShift: 0.004, cavityColor: "#5a2a28", lipColor: "#caa67e", lidColor: "#e6dcc6",
    line: "I'm the doorway — one key, many minds at the table." },

  // ABSTRACT seat — GROK is the ONLY avatar without a mouth, so it alone keeps the
  // speaking-glow + sound-bars (no fake mouth bolted on). Now shows its REAL helmet
  // tile as a static face behind the glow.
  { id: "grok", name: "Grok", role: "seat · no mouth · glow + sound-bars", kind: "abstract",
    image: "avatars/grok.jpg", color: "#5b6cff", mark: "G", voice: "bm_daniel",
    line: "I'll say the blunt thing everyone's thinking." },
];
