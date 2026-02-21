export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { trackName, artistName, genres, titleKeywords, artistContext, tempoClass, forbiddenScenes } = req.body;
  if (!trackName || !artistName) return res.status(400).json({ error: 'Missing fields' });
  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) return res.status(500).json({ error: 'No API key' });

  const forbidden = (forbiddenScenes || []).join(', ');

  const prompt = `You are the world's most creative concert VJ director, responsible for designing TOTALLY IMMERSIVE festival stage visuals. Think Daft Punk pyramid, deadmau5 cube, Eric Prydz holographics — complete cinematic worlds, not abstract shapes.

SONG: "${trackName}" by ${artistName}
GENRES: ${(genres||[]).join(', ')||'unknown'}
TITLE KEYWORDS: ${(titleKeywords||[]).join(', ')||'none'}
ARTIST CONTEXT: ${artistContext||'unknown — infer from genres'}
TEMPO: ${tempoClass||'medium'}
⛔ FORBIDDEN SCENES (already used recently — DO NOT pick these): ${forbidden||'none'}

═══════════════════════════════════════
AVAILABLE SCENE TYPES — pick the ONE that fits this song best:
═══════════════════════════════════════
• WARP_SPEED — cockpit shooting through hyperspace, star streaks, speed tunnel
• LAVA_WORLD — erupting volcano POV, rivers of molten fire, embers raining, heat shimmer
• CYBER_GRID — Tron neon wireframe city, flying at ground level through canyons of light
• DEEP_SEA — pitch black ocean, bioluminescent creatures approaching from darkness
• STORM_CHASER — inside a tornado, lightning everywhere, debris flying past camera
• JUNGLE_RAVE — prehistoric jungle, massive glowing creatures, tribal neon energy
• DISCO_DIMENSION — infinite mirrored dance floor, spinning chandeliers, light beams
• ACID_TRIP — melting fractals, impossible geometry, reality warping
• SPACE_STATION — orbiting Earth, floating debris, solar flares, spacewalk
• NEON_CATHEDRAL — enormous gothic arches of light, stained glass windows, godlike scale
• CLASSIC_ARCADE — retro pixel world, pac-man mazes, sprite characters, 8-bit reality

═══════════════════════════════════════
SONG-SPECIFIC CENTERPIECE — the dominant visual object (or null):
═══════════════════════════════════════
null, "sun", "moon", "planet", "disco_ball", "marshmello_helmet", "fireball", "black_hole", "earth_orbit", "vinyl_record", "microphone", "skull", "diamond", "eye", "volcano_peak", "robot_head", "crystal_ball", "wormhole", "neon_cross", "pixel_character", "dinosaur_head", "chandelier", "trident", "lotus"

═══════════════════════════════════════
CRITICAL RULES:
═══════════════════════════════════════
1. NO floating circles. NO generic orbs. NO abstract shapes pulsing.
2. The scene must feel like you are INSIDE IT and MOVING THROUGH IT.
3. Use title keywords literally — "fire" → lava world, "ocean" → deep sea, "sun" → sun centerpiece
4. Artist signatures matter — Marshmello = marshmello_helmet, disco songs = disco_ball, etc.
5. Be cinematically committed — describe a world so specific a film director could shoot it.
6. The centerpiece should feel earned and specific, not decorative.

Return ONLY raw JSON:
{
  "scene": one of the scene types above,
  "label": "ALL CAPS 4-6 word cinematic title",
  "splashDesc": "15-20 word vivid description — what does it FEEL like to be inside this world?",
  "palette": ["#hex1","#hex2","#hex3","#hex4"],
  "bgColor": "#very dark base hex",
  "centerpiece": string or null,
  "centerpieceScale": 0.0-1.0,
  "centerpieceBehavior": one of "rotate","spin_fast","pulse_beat","breathe","orbit_slow","rise_set","fixed","strobe",
  "sceneSpeed": 0.3-3.0,
  "sceneIntensity": 0.3-1.0,
  "beatReaction": one of "speed_burst","shockwave","color_invert","creature_surge","world_crack","bass_slam","strobe_cut",
  "colorShift": true/false,
  "energy": 0.0-1.0,
  "chaos": 0.0-1.0
}`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 900,
        messages: [{ role: 'user', content: prompt }] })
    });
    const data = await r.json();
    const text = data.content?.[0]?.text || '';
    const match = text.replace(/```json|```/g, '').match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON');
    return res.status(200).json(JSON.parse(match[0]));
  } catch(e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
