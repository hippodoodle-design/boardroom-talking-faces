// roster.js — the Hippo Round Table boardroom, 12 seats in 2 rows of 6.
//
// THE ROOM IS THE ART. The whole warm watercolour boardroom (curved walls,
// parchment banner, the 12 framed portraits in their cosy settings, and the
// foreground wood table with books, coffee and a wee plant) is one finished
// render shipped as room.webp. Each seat here is NOT a separate avatar file —
// it's a `crop` (fractions of room.webp) that the live talking-canvas lifts
// straight out of the room and animates. So every face you see IS the target
// render; only the mouth (and, where it sits cleanly, a blink) moves over it.
//
// Voices are all British (bf_/bm_) — one distinct voice per seat. AMANDA is the
// special speak-as-avatar seat: her mouth is driven by the LIVE MIC, not TTS.
//
// BLINK POLICY (founder fix): a stray eyelid band is worse than no blink. Blink
// is enabled ONLY on clearly-visible open eyes; it is SKIPPED on glasses-wearers
// (cfg.glasses), on screen/printed faces, and on the abstract seat — those omit
// `eye` entirely, so engine.js never draws a lid. OpenRouter (the paper-bag seat
// whose blink used to float as a white band above its dot-eyes) now has NO eye
// box at all: it talks, it does not blink.

// Shared geometry: every seat is a fixed overlay on the baked room (noSway) and
// uses the proven top-lip-anchored jaw-drop with a softly feathered band.
const FACE = { kind: "face", noSway: true, maxShift: 0.005, jawW: 0.5 };

// crop {x,y,w,h}: this seat's portrait as a fraction of room.webp (1536x916 → the
// banner+walls+12 tiles+table, baked toolbar trimmed). The same rect positions the
// talking canvas over the room, so it overlays its own pixels seamlessly.
export const ROSTER = [
  // ---- Row 1 -----------------------------------------------------------------
  // Claude · Chairman (mauve hippo in tweed). Mouth on the snout's smile line.
  { ...FACE, id: "chair", name: "Chairman", role: "Claude · the Chair · hippo",
    voice: "bm_george", crop: { x: 0.012, y: 0.1676, w: 0.146, h: 0.3665 },
    eye: { x: 0.46, y: 0.18, w: 0.30, h: 0.10 },
    anchor: 0.47, mouthCx: 0.57, mouthW: 0.20, jawBottom: 0.58, maxOpen: 0.05,
    cavityColor: "#5b2b3a", lidColor: "#8d8898",
    line: "As Chair I'll keep us on track, and sum it up at the end." },

  // Roberta · Secretary (daisy-robot). Mouth on her little smile; big eyes blink.
  { ...FACE, id: "roberta", name: "Roberta", role: "Secretary · daisy-robot",
    voice: "bf_emma", crop: { x: 0.175, y: 0.1676, w: 0.145, h: 0.3665 },
    eye: { x: 0.35, y: 0.28, w: 0.30, h: 0.09 },
    anchor: 0.45, mouthCx: 0.50, mouthW: 0.09, jawBottom: 0.53, maxOpen: 0.028,
    cavityColor: "#7e3b33", lidColor: "#f2f1f6",
    line: "Welcome — I'm Roberta, taking the minutes. The table's set; let's begin." },

  // Amanda · Founder & host (YOU). LIVE-MIC seat: tap to grant the mic, then your
  // real voice moves her mouth — no camera, no TTS. Glasses → no blink.
  { ...FACE, id: "amanda", name: "Amanda", role: "You · Founder & host · live mic",
    self: true, live: true, glasses: true, mouthGain: 1.2,
    voice: "bf_alice", crop: { x: 0.338, y: 0.1676, w: 0.145, h: 0.3665 },
    anchor: 0.47, mouthCx: 0.49, mouthW: 0.10, jawBottom: 0.57, maxOpen: 0.03,
    cavityColor: "#5a2a2b", cavityAlpha: 0.62, lipColor: "#c47e78",
    line: "And this is me — when I talk, my avatar talks. No camera, just my voice." },

  // CC · Coder (Claude Code, the builder). Glasses → no blink; open-smile mouth.
  { ...FACE, id: "cc", name: "CC", role: "Coder · Claude Code",
    glasses: true, voice: "bm_daniel", crop: { x: 0.500, y: 0.1676, w: 0.146, h: 0.3665 },
    anchor: 0.45, mouthCx: 0.48, mouthW: 0.13, jawBottom: 0.56, maxOpen: 0.045,
    cavityColor: "#5a2a2e", lipColor: "#c98a6e",
    line: "I'm CC — I'll wire it up and make sure it actually runs." },

  // OpenAI (robot in the teal hoodie; face is a dark screen). Mouth = the glowing
  // smile; dark cavity blends into the screen. NO eye box → no lid on the screen.
  { ...FACE, id: "openai", name: "OpenAI", role: "seat · OpenAI",
    voice: "bm_fable", crop: { x: 0.662, y: 0.1676, w: 0.146, h: 0.3665 },
    anchor: 0.42, mouthCx: 0.50, mouthW: 0.13, jawBottom: 0.50, maxOpen: 0.04,
    cavityColor: "#0a1a1a",
    line: "Happy to help shape the plan and draft the words." },

  // Gemini (galaxy baby). Big clear eyes → gentle blink; small smile.
  { ...FACE, id: "gemini", name: "Gemini", role: "seat · Gemini",
    voice: "bf_lily", crop: { x: 0.825, y: 0.1676, w: 0.160, h: 0.3665 },
    eye: { x: 0.30, y: 0.33, w: 0.40, h: 0.12 },
    anchor: 0.47, mouthCx: 0.48, mouthW: 0.12, jawBottom: 0.58, maxOpen: 0.045,
    cavityColor: "#2a1a3a", lidColor: "#4a4a78",
    line: "I'll weigh the trade-offs and keep us balanced." },

  // ---- Row 2 (foreground table overlaps their lower bodies in the render) -----
  // Perplexity · research (scholar owl in round glasses). Glasses → no blink;
  // mouth = the beak parting, modest open.
  { ...FACE, id: "perplexity", name: "Perplexity", role: "research · owl",
    glasses: true, voice: "bf_isabella", crop: { x: 0.012, y: 0.5810, w: 0.146, h: 0.2067 },
    anchor: 0.46, mouthCx: 0.52, mouthW: 0.10, jawBottom: 0.62, maxOpen: 0.05,
    cavityColor: "#241a0e",
    line: "I'll bring the live facts — freshly checked, with sources." },

  // Grok (dark 'G' astronaut). The ONE seat with no mouth: it speaks with a
  // speaking-glow ring only (maxOpen 0, no eye) — no fake mouth bolted on.
  { ...FACE, id: "grok", name: "Grok", role: "seat · no mouth · glow",
    voice: "bm_lewis", crop: { x: 0.175, y: 0.5810, w: 0.145, h: 0.2067 },
    anchor: 0.5, mouthCx: 0.5, mouthW: 0.0, jawBottom: 0.5, maxOpen: 0.0, maxShift: 0.0,
    line: "I'll say the blunt thing everyone's thinking." },

  // OpenRouter (paper-bag character; the map look is just print on the kraft bag).
  // FOUNDER FIX: NO eye box — the old blink rendered as a white band floating above
  // its dot-eyes. It talks; it does not blink. Mouth on its open smile.
  { ...FACE, id: "openrouter", name: "OpenRouter", role: "paper-bag seat · one key, many minds",
    voice: "bf_alice", crop: { x: 0.338, y: 0.5810, w: 0.145, h: 0.2067 },
    anchor: 0.40, mouthCx: 0.50, mouthW: 0.11, jawBottom: 0.52, maxOpen: 0.05,
    cavityColor: "#3a2a16",
    line: "I'm the doorway — one key, many minds at the table." },

  // Visitors — three guest seats. Clear human faces → gentle blink + open smile.
  { ...FACE, id: "vis1", name: "Visitor", role: "guest seat",
    voice: "bf_emma", crop: { x: 0.500, y: 0.5810, w: 0.146, h: 0.2067 },
    eye: { x: 0.40, y: 0.32, w: 0.30, h: 0.10 },
    anchor: 0.56, mouthCx: 0.55, mouthW: 0.11, jawBottom: 0.70, maxOpen: 0.05,
    cavityColor: "#5a2a28", lipColor: "#caa07e", lidColor: "#caa07e",
    line: "Lovely to be here — I'm just visiting the table today." },

  { ...FACE, id: "vis2", name: "Visitor", role: "guest seat",
    voice: "bm_daniel", crop: { x: 0.662, y: 0.5810, w: 0.146, h: 0.2067 },
    eye: { x: 0.36, y: 0.24, w: 0.32, h: 0.10 },
    anchor: 0.50, mouthCx: 0.50, mouthW: 0.12, jawBottom: 0.64, maxOpen: 0.045,
    cavityColor: "#3a1f1a", lipColor: "#c8966e", lidColor: "#c8966e",
    line: "Good to join you all — thanks for having me along." },

  { ...FACE, id: "vis3", name: "Visitor", role: "guest seat",
    voice: "bf_isabella", crop: { x: 0.825, y: 0.5810, w: 0.160, h: 0.2067 },
    eye: { x: 0.38, y: 0.27, w: 0.30, h: 0.10 },
    anchor: 0.50, mouthCx: 0.52, mouthW: 0.12, jawBottom: 0.64, maxOpen: 0.05,
    cavityColor: "#5a2a28", lipColor: "#caa07e", lidColor: "#caa07e",
    line: "Hello from the visitor's chair — happy to be at the round table." },
];
