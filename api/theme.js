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
YOU MUST PICK FROM THIS SHORTLIST ONLY:
${(sceneShortlist||[]).slice(0,12).join(', ')}

These are the scenes not recently used. Pick the best THEMATIC FIT from this list. Do not pick anything outside this list.
══════════════════════════════════════

⛔ FORBIDDEN CENTERPIECES: ${(forbiddenCenterpieces||[]).join(', ')||'none'}

═══ AVAILABLE CENTERPIECES ═══
null, sun, moon, planet, disco_ball, marshmello_helmet, fireball, black_hole, earth_orbit, vinyl_record, microphone, skull, wormhole, dinosaur_head, chandelier, crystal_ball, robot_head, pixel_character, volcano_peak, neon_cross, lotus, eye, trident, comet, supernova, grim_reaper, angel_wings, alien_head, sugar_skull, zeus_face, dragon_head, roulette_wheel, hourglass, treasure_chest, clock_face, crown, flaming_skull, dna_helix, mandala, tesseract, ankh

═══ CENTERPIECE RULES — BE BOLD ═══
- null is VALID and encouraged (use for ~20% of songs — heavy, atmospheric, instrumental)
- centerpieceScale: 0.0 (none) to 1.5 (nearly fills screen). Go BIG or tiny — avoid always picking 0.4-0.6
- centerpieceX / centerpieceY: 0.0-1.0 screen fraction. CENTER IS BORING — use 0.3, 0.7, 0.15, 0.8 etc
- centerpieceBehavior: rotate | spin_fast | pulse_beat | breathe | orbit_slow | rise_set | fixed | strobe | bounce | drift | watermark
  • bounce = careens around screen hitting edges
  • drift = slow dreamy floating figure-8
  • watermark = huge faint ghost behind everything (use with large scale)
  • rise_set = rises from bottom, sets below horizon
- Match artist: Marshmello → marshmello_helmet | Daft Punk → robot_head | dark rap → skull/grim_reaper

═══ BEAT REACTIONS — PICK 3-4 ═══
Random variety each beat from your pool:
speed_burst, shockwave, color_invert, world_crack, bass_slam, strobe_cut, creature_surge, cannon_fire, lightning_strike, gravity_wave, petal_burst, pixel_explode, skull_surge, coin_shower, tentacle_surge

═══ PALETTE RULES ═══
Be bold and specific. Ugly/clashing palettes are fine if they fit the song.
Examples: industrial metal → [#ff4400, #333333, #ff8800, #111111]
dreamy pop → [#ff99cc, #cc99ff, #99ccff, #ffff99]
dark hip-hop → [#8b0000, #1a1a1a, #c8a000, #2d0030]
bgColor should be VERY dark, matching the mood.

Return ONLY raw JSON (no markdown):
{
  "scene": string (MUST be from shortlist above),
  "label": "ALL CAPS 4-6 word cinematic title",
  "splashDesc": "15-20 word vivid description of what it feels like inside this world",
  "palette": ["#hex1","#hex2","#hex3","#hex4"],
  "bgColor": "#very dark hex",
  "centerpiece": string or null,
  "centerpieceScale": 0.0-1.5,
  "centerpieceX": 0.0-1.0,
  "centerpieceY": 0.0-1.0,
  "centerpieceBehavior": string,
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
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 800,
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
