export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { trackName, artistName, genres, titleKeywords, artistContext, forbiddenScenes, forbiddenCenterpieces, sessionStreak, isExplicit, songDurationSecs } = req.body;
  if (!trackName || !artistName) return res.status(400).json({ error: 'Missing fields' });
  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) return res.status(500).json({ error: 'No API key' });

  const streakDesc = sessionStreak < 3 ? 'early in session — normal intensity' :
    sessionStreak < 8 ? 'mid session — getting warmer, more adventurous' :
    sessionStreak < 15 ? 'long session — go wilder, darker, more maximalist' :
    'deep session — full maximalist chaos, most extreme worlds and centerpieces';

  const prompt = `You are the world's most creative concert VJ director. Design TOTALLY IMMERSIVE festival stage visuals — complete cinematic worlds people feel transported INTO.

SONG: "${trackName}" by ${artistName}
GENRES: ${(genres||[]).join(', ')||'unknown'}
TITLE KEYWORDS: ${(titleKeywords||[]).join(', ')||'none'}
ARTIST CONTEXT: ${artistContext||'unknown'}
EXPLICIT: ${isExplicit?'YES — darker worlds/centerpieces unlocked':'NO — keep it clean'}
DURATION: ${songDurationSecs||180}s
SESSION STREAK: ${sessionStreak||0} songs — ${streakDesc}

⛔ FORBIDDEN SCENES (do not pick these): ${(forbiddenScenes||[]).join(', ')||'none'}
⛔ FORBIDDEN CENTERPIECES (do not pick these): ${(forbiddenCenterpieces||[]).join(', ')||'none'}

═══ AVAILABLE WORLDS ═══
WARP_SPEED, LAVA_WORLD, CYBER_GRID, DEEP_SEA, STORM_CHASER, JUNGLE_RAVE, DISCO_DIMENSION, ACID_TRIP, SPACE_STATION, NEON_CATHEDRAL, CLASSIC_ARCADE, ELECTRIC_FOREST, OMNIA_NIGHTCLUB, PIRATE_SHIP, JUNKYARD, SUPERHERO, DAY_OF_DEAD, CHINESE_DRAGON, MOUNT_OLYMPUS, SUPER_MARIO, ATLANTIS, CARNIVAL, EGYPTIAN_TOMB

═══ AVAILABLE CENTERPIECES ═══
null, sun, moon, planet, disco_ball, marshmello_helmet, fireball, black_hole, earth_orbit, vinyl_record, microphone, skull, wormhole, dinosaur_head, chandelier, crystal_ball, robot_head, pixel_character, volcano_peak, neon_cross, lotus, eye, trident, comet, supernova, grim_reaper, angel_wings, alien_head, sugar_skull, zeus_face, dragon_head, roulette_wheel, hourglass, treasure_chest, clock_face, crown, flaming_skull, dna_helix, mandala, tesseract, ankh

═══ WORLD SELECTION GUIDE ═══
Match the world to the song SPECIFICALLY. Title keywords are literal clues:
- "fire/burn/heat" → LAVA_WORLD, "ocean/sea/water" → DEEP_SEA or ATLANTIS
- "thunder/storm/lightning" → STORM_CHASER or MOUNT_OLYMPUS
- "space/stars/galaxy" → WARP_SPEED or SPACE_STATION  
- "jungle/wild/forest" → JUNGLE_RAVE or ELECTRIC_FOREST
- "party/dance/disco" → DISCO_DIMENSION or OMNIA_NIGHTCLUB
- "pirate/sail/ship" → PIRATE_SHIP, "Egypt/pharaoh/tomb" → EGYPTIAN_TOMB
- "dragon/serpent" → CHINESE_DRAGON, "god/zeus/olympus" → MOUNT_OLYMPUS
- "dead/skull/ghost/halloween" → DAY_OF_DEAD, "hero/power/save" → SUPERHERO
- "mario/game/arcade/pixel" → SUPER_MARIO or CLASSIC_ARCADE
- "carnival/circus/clown" → CARNIVAL, "junk/metal/industrial" → JUNKYARD
- Marshmello songs → OMNIA_NIGHTCLUB or DISCO_DIMENSION + marshmello_helmet
- High session streak → prefer wilder worlds: ACID_TRIP, CHINESE_DRAGON, MOUNT_OLYMPUS, CARNIVAL

═══ CENTERPIECE SELECTION GUIDE ═══
Be SPECIFIC and CREATIVE. Match artist/title:
- Explicit + dark → skull, grim_reaper, flaming_skull, black_hole
- Love songs → angel_wings, lotus, mandala
- Power/epic → zeus_face, crown, supernova, tesseract
- Mystery → wormhole, ankh, tesseract, crystal_ball
- Party → disco_ball, roulette_wheel, chandelier
- Nature → comet, moon, sun, planet
- null = pure world, no object (use for atmospheric/instrumental/metal)

═══ BEAT REACTIONS ═══
Pick 2-3 that fit this world/song energy. They will ALTERNATE throughout the song and ESCALATE in intensity:
speed_burst, shockwave, color_invert, world_crack, bass_slam, strobe_cut, creature_surge, cannon_fire, lightning_strike, gravity_wave, pixel_explode, petal_burst, skull_surge, coin_shower, tentacle_surge

Return ONLY raw JSON:
{
  "scene": string,
  "label": "ALL CAPS 4-6 word cinematic title",
  "splashDesc": "15-20 word vivid description of what it feels like inside this world",
  "palette": ["#hex1","#hex2","#hex3","#hex4"],
  "bgColor": "#very dark hex",
  "centerpiece": string or null,
  "centerpieceScale": 0.0-1.0,
  "centerpieceBehavior": "rotate"|"spin_fast"|"pulse_beat"|"breathe"|"orbit_slow"|"rise_set"|"fixed"|"strobe",
  "beatReactions": ["reaction1","reaction2","reaction3"],
  "sceneSpeed": 0.3-3.0,
  "sceneIntensity": 0.3-1.0,
  "energy": 0.0-1.0,
  "chaos": 0.0-1.0
}`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1000,
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
