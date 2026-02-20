export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { trackName, artistName, genres } = req.body;
  if (!trackName || !artistName) return res.status(400).json({ error: 'Missing fields' });
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'API key not configured' });

  const prompt = `You are a world-class VJ (video jockey) and immersive experience designer. You create living, breathing visual WORLDS that people feel like they are INSIDE — not watching abstract shapes flash.

Song: "${trackName}" by ${artistName}
Genres: ${(genres || []).join(', ') || 'unknown'}

Design a complete immersive environment for this song. Think cinematically — what WORLD does this song live in? What does it feel like to be INSIDE this song?

Return ONLY raw JSON (no markdown):

{
  "label": "3-4 word evocative ALL CAPS scene title (e.g. MIDNIGHT RAINSTORM, DEEP SPACE DRIFT, NEON CITY PULSE)",
  "splashDesc": "10-15 word cinematic description of the world (e.g. 'rain-soaked streets reflect neon as thunder shakes the city')",
  "palette": ["#hex1","#hex2","#hex3","#hex4"],
  "bgColor": "#very dark hex",

  "world": one of: "warp_tunnel","rainstorm","neon_city","underwater","lightning_storm","aurora","deep_space","desert_heat","snowstorm","volcanic","cherry_blossom","foggy_forest",

  "worldIntensity": 0.3-1.0,

  "ambientObjects": array of 0-3 large ambient scene objects from: "disco_ball","moon","planet_rings","sun","comet","city_skyline","mountain_silhouette","jellyfish","whale","creature","crowd_silhouette","clock_tower","lighthouse",

  "floatingObjects": array of 0-4 thematic floating objects from: "disco_ball","moon","planets","stars","raindrops","snowflakes","lightning_bolts","bubbles","fireflies","petals","embers","leaves","jellyfish","fish","crowd_hands","guitar_silhouette","piano_keys","neon_signs","clouds","birds",

  "beatReaction": one of: "wind_gust","thunder_flash","speed_burst","depth_pulse","color_wave","lightning_strike","crowd_surge","rain_burst",

  "progressionStyle": one of: "intensity_build","color_shift","depth_increase","storm_build","emergence",

  "cameraMode": one of: "forward_travel","gentle_drift","orbit","stationary_immersive","slow_zoom",

  "waveStyle": one of: "horizon_line","rain_streaks","aurora_bands","ripple_surface","none",

  "energy": 0.0-1.0,
  "chaos": 0.0-1.0,
  "speed": 0.3-2.0,
  "depth": 0.3-1.0
}

CRITICAL RULES:
- NO central circles or shapes pulsing in the middle of the screen
- Beat reactions must feel like the WORLD reacting (thunder, wind, speedup) NOT a shape appearing
- Objects float naturally in the environment, not flash
- Think: what world does this song LIVE IN?

Song-specific examples:
- "Singing in the Rain": rainstorm world, raindrops floating, moon ambient, thunder_flash beat, rain_burst progression
- "Stayin Alive": neon_city world, disco_ball + crowd_hands floating, city_skyline ambient, crowd_surge beat
- "Clair de Lune": aurora world, moon + jellyfish floating, gentle_drift camera, none waveStyle
- "Thunderstruck": lightning_storm world, lightning_bolts floating, thunder_flash beat, storm_build progression
- "Space Oddity": deep_space world, planet_rings + comet ambient, forward_travel camera, speed_burst beat
- "Under the Sea": underwater world, jellyfish + fish + bubbles floating, gentle_drift camera
- "Hotel California": desert_heat world, city_skyline + moon ambient, slow_zoom camera`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 900, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const theme = JSON.parse(clean);
    return res.status(200).json(theme);
  } catch (e) {
    console.error('Theme error:', e);
    return res.status(500).json({ error: 'Theme generation failed' });
  }
}
