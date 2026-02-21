export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { trackName, artistName, genres, titleKeywords, artistContext, tempoClass } = req.body;
  if (!trackName || !artistName) return res.status(400).json({ error: 'Missing fields' });
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'API key not configured' });

  const prompt = `You are the world's most creative music visualizer director. You design IMMERSIVE, CINEMATIC visual worlds — not abstract shapes, but real environments people feel transported INTO.

═══ SONG INFO ═══
Track: "${trackName}"
Artist: ${artistName}
Genres: ${(genres || []).join(', ') || 'unknown'}
Title keywords: ${(titleKeywords || []).join(', ') || 'none extracted'}
Artist visual identity: ${artistContext || 'unknown artist — infer from genre/era'}
Tempo class: ${tempoClass || 'medium'}

═══ YOUR JOB ═══
Design a complete visual world for this specific song. Be AGGRESSIVELY specific. Use the title keywords, artist identity, and genre to make choices that feel made FOR THIS SONG.

Examples of great specificity:
- "Too Close to the Sun" → massive burning sun centerpiece, desert heat shimmer, Icarus silhouette, scorched color palette
- "Stayin Alive" by Bee Gees → spinning disco ball centerpiece, 70s dance floor, crowd silhouettes, warm amber/gold palette
- "Marshmello - Alone" → marshmallow face centerpiece (white round face, black X eyes), EDM festival crowd, laser beams
- "Space Oddity" by Bowie → Earth from orbit, astronaut silhouette, deep space, satellite dish object  
- "Hotel California" → desert highway driving forward at night, headlights piercing dark, hotel sign in distance
- "Under the Sea" → underwater swim-through with coral, fish parallax layers, caustic light
- "Thunderstruck" by AC/DC → lightning storm, no centerpiece (raw power), electric bolts, crowd hands
- "Blinding Lights" by Weeknd → neon city driving at night, speed blur, 80s retro pink/purple
- "Yellow" by Coldplay → vast open sky, sun centerpiece, yellow particles like dandelions

═══ RETURN ONLY RAW JSON ═══
{
  "label": "ALL CAPS 3-5 word evocative scene title",
  "splashDesc": "12-18 word cinematic description of the world you're creating",
  "palette": ["#hex1","#hex2","#hex3","#hex4"],
  "bgColor": "#very dark hex",

  "journeyMode": one of: "fly_space","drive_city","swim_underwater","fly_storm","drift_blossom","static_scene","strobe_assault","tunnel_zoom","silhouette_sky","particle_storm",

  "parallaxLayers": integer 2-5 (depth layers for journey feel),
  "journeySpeed": 0.3-3.0,
  "journeyTilt": 0.0-0.4 (how much the path curves/steers),
  "cameraShakeOnBeat": true/false,

  "centerpiece": one of null, "sun","moon","planet","disco_ball","marshmello","fireball","prism","black_hole","earth","skull","diamond","eye_of_god","vinyl_record","microphone","crown","hourglass","crystal","lotus","compass","lightning_orb","portal","yin_yang","atom","speaker",
  "centerpieceScale": 0.0-1.0 (0=absent, 0.3=subtle, 0.7=prominent, 1.0=fills screen),
  "centerpieceBehavior": one of: "rotate","pulse_beat","orbit_slow","breathe","strobe","fixed","rise_set","spin_fast",

  "silhouetteObject": one of null, "icarus","astronaut","dancer","guitarist","surfer","diver","runner","figure_horizon","city_skyline","mountain","palm_tree","lighthouse",
  "silhouettePosition": "left"/"center"/"right"/"horizon",

  "environmentLayers": [
    array of 2-4 objects: {"type": string, "depth": 0.1-1.0, "density": 0.1-1.0, "speed": 0.1-3.0}
    types: "stars","city_buildings","trees","coral","bubbles","rain","snow","embers","petals","clouds","desert_dunes","highway_lines","crowd","lasers","northern_lights","asteroids","fish","jellyfish","fireflies"
  ],

  "beatEffect": one of: "world_flash","speed_burst","lightning_crack","bass_ripple","color_explosion","strobe_cut","crowd_surge","depth_slam","sun_flare",

  "surpriseMode": one of null, "lyrics_dissolve","strobe_assault","silhouette_moment","tunnel_zoom","particle_storm",
  "surpriseModeChance": 0.0-1.0,

  "titleWordEffects": array of up to 3 strings extracted from track title to display as dissolving text,

  "colorShiftOnBeat": true/false,
  "progressionStyle": one of: "build_intensity","storm_arrival","sunrise","journey_forward","pulse_steady",

  "energy": 0.0-1.0,
  "chaos": 0.0-1.0,
  "speed": 0.3-2.0
}

RULES:
- centerpiece null = no object (valid for raw/powerful songs like metal, classical)
- journeyMode "static_scene" = no forward movement (for ballads, ambient)
- Be SPECIFIC to this artist and title — if title has a concrete noun, use it
- Surprise modes should only activate for truly unique songs (surpriseModeChance 0.6-0.9 for wild songs, 0.0 for ballads)
- palette must match the EMOTIONAL CORE of the song, not just genre defaults`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1100, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const clean = text.replace(/```json[\s\S]*?```/g, m => m.slice(7, -3)).replace(/```/g, '').trim();
    // Extract JSON object
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found');
    const theme = JSON.parse(match[0]);
    return res.status(200).json(theme);
  } catch (e) {
    console.error('Theme error:', e);
    return res.status(500).json({ error: 'Theme generation failed', detail: e.message });
  }
}
