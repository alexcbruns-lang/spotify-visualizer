export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { trackName, artistName, genres, titleKeywords, artistContext, sceneShortlist, forbiddenCenterpieces, sessionStreak, streakDesc, isExplicit, songDurationSecs } = req.body;
  if (!trackName || !artistName) return res.status(400).json({ error: 'Missing fields' });
  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) return res.status(500).json({ error: 'No API key' });

  const prompt = `You are the world's most creative concert VJ director. Design TOTALLY IMMERSIVE festival stage visuals.

SONG: "${trackName}" by ${artistName}
GENRES: ${(genres||[]).join(', ')||'unknown'}
TITLE KEYWORDS: ${(titleKeywords||[]).join(', ')||'none'}
ARTIST CONTEXT: ${artistContext||'unknown'}
EXPLICIT: ${isExplicit?'YES — darker worlds/centerpieces unlocked':'NO — keep it clean'}
DURATION: ${songDurationSecs||180}s
SESSION: ${sessionStreak||0} songs — ${streakDesc||'early'}

══════════════════════════════════════
PICK YOUR SCENE FROM THIS LIST ONLY — these are overdue for variety:
${(sceneShortlist||[]).slice(0,12).join(', ')}
Choose the best thematic fit. Do NOT pick outside this list.
══════════════════════════════════════

⛔ FORBIDDEN CENTERPIECES (do not repeat): ${(forbiddenCenterpieces||[]).join(', ')||'none'}

═══ CENTERPIECE — CHOOSE ONE ═══
Every centerpiece is a UNIQUE hand-drawn canvas illustration. Pick the one that best fits this song's identity.

CHARACTER CENTERPIECES (distinctive faces/creatures):
skull, flaming_skull, skull_crossbones, smiley, demon_face, alien_head, robot_head, wolf_head, eagle, dragon

SYMBOL CENTERPIECES (graphic icons):
peace_sign, lightning_bolt, yin_yang, star, ankh, trident, eye, mandala

OBJECT CENTERPIECES (real things):
flame, diamond, coffin, crown, hourglass, clock_face, chandelier, crystal

SPACE/COSMIC:
sun, moon, planet, comet, black_hole, wormhole, ufo, astronaut, rocket

MUSIC:
vinyl_record, turntable, disco_ball

COMPLEX:
dna_helix, tesseract, lotus

null = no centerpiece (use for ~20% of songs — heavy instrumentals, ambient, metal)

═══ CENTERPIECE MATCHING GUIDE ═══
- Marshmello → robot_head or skull (his aesthetic)
- Daft Punk → robot_head
- Dark rap / trap → skull, flaming_skull, demon_face, coffin
- Pop / upbeat → smiley, star, disco_ball, peace_sign
- Rock / metal → lightning_bolt, skull_crossbones, flaming_skull
- Space / cosmic → black_hole, comet, planet, ufo, astronaut
- Love songs → lotus, eye, yin_yang, mandala
- EDM / rave → disco_ball, lightning_bolt, smiley
- Reggae / peace → peace_sign, lotus, yin_yang
- Country / folk → crown, hourglass, vinyl_record
- Nature → lotus, sun, moon, eagle, wolf_head
- High session streak → demon_face, tesseract, black_hole, flaming_skull
- Explicit + dark → flaming_skull, demon_face, coffin, skull_crossbones

═══ CENTERPIECE POSITION ═══
centerpieceX / centerpieceY: 0.0–1.0 fraction of screen. CENTER (0.5, 0.5) IS BORING.
Try: 0.3, 0.7, 0.25, 0.75, 0.8, 0.2 — AI should be creative with placement.
centerpieceScale: 0.0–1.4. Go BIG (0.8–1.2) or tiny accent (0.1–0.25). Avoid always 0.4–0.6.
centerpieceBehavior: rotate | spin_fast | pulse_beat | breathe | orbit_slow | rise_set | fixed | strobe | bounce | drift | watermark

═══ BEAT REACTIONS — PICK 3-4 ═══
speed_burst, shockwave, color_invert, world_crack, bass_slam, strobe_cut, creature_surge, cannon_fire, lightning_strike, gravity_wave, petal_burst, pixel_explode, skull_surge, coin_shower, tentacle_surge

═══ PALETTE ═══
Be bold and specific. Match the song's emotional character.
bgColor: very dark hex matching the mood.

Return ONLY raw JSON — no markdown, no explanation:
{
  "scene": "string from shortlist",
  "label": "ALL CAPS 4-6 WORD CINEMATIC TITLE",
  "splashDesc": "15-20 word vivid description of being inside this world",
  "palette": ["#hex1","#hex2","#hex3","#hex4"],
  "bgColor": "#very dark hex",
  "centerpiece": "name or null",
  "centerpieceScale": 0.0-1.4,
  "centerpieceX": 0.0-1.0,
  "centerpieceY": 0.0-1.0,
  "centerpieceBehavior": "string",
  "beatReactions": ["r1","r2","r3","r4"],
  "sceneSpeed": 0.3-3.0,
  "sceneIntensity": 0.3-1.0,
  "energy": 0.0-1.0,
  "chaos": 0.0-1.0
}`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 700,
        messages: [{ role: 'user', content: prompt }] })
    });
    const data = await r.json();
    const text = data.content?.[0]?.text || '';
    const match = text.replace(/```json|```/g, '').match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    return res.status(200).json(JSON.parse(match[0]));
  } catch(e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
