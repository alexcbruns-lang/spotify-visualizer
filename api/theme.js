export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { trackName, artistName, genres } = req.body;
  if (!trackName || !artistName) return res.status(400).json({ error: 'Missing fields' });

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'API key not configured' });

  const prompt = `You are a cutting-edge VJ (video jockey) AI for a music visualizer. Your job is to design a completely unique, song-specific visual experience. Be wildly creative and specific — no two songs should ever feel the same.

Song: "${trackName}" by ${artistName}
Genres: ${(genres || []).join(', ') || 'unknown'}

Return ONLY a raw JSON object with these exact fields:

{
  "label": "2-3 word ALL CAPS vibe label that captures this specific song's essence",
  "splashDesc": "8-12 word poetic description of the visual world you're creating for this song",
  "palette": ["#hex1","#hex2","#hex3","#hex4"],
  "bgColor": "#very dark hex matching song soul",

  "backgroundMode": one of: "starfield", "tunnel", "glitch", "cityscape", "aurora", "void", "matrix", "fractal",
  "backgroundIntensity": number 0.3-1.0,

  "particleMode": one of: "trails", "fireflies", "rain", "confetti", "sparks", "snow", "bubbles", "shards", "DNA", "meteors",
  "particleCount": integer 60-250,
  "particleSpeed": number 0.3-3.0,

  "geometryMode": one of: "polygons", "tunnel_rings", "dna_helix", "fractal_tree", "grid_pulse", "orbit_system", "waveform_bars", "kaleidoscope",
  "geometryComplexity": number 0.3-1.0,

  "cameraEffects": array of 0-3 items from: "zoom_pulse", "screen_shake", "rotation_drift", "zoom_breathe", "strobe", "barrel_distort",

  "beatEffect": one of: "explosion", "ripple", "flash", "shockwave", "nova", "glitch_burst", "color_shift", "earthquake",

  "symbols": array of 0-4 from: "heart","star","diamond","lightning","note","infinity","flower","spiral","crown","flame","snowflake","moon","skull","peace","arrow","eye",

  "symbolSpawnRate": number 0.05-0.4,

  "waveAmp": number 0.3-2.5,
  "beatFlash": number 0.03-0.4,
  "orbIntensity": number 0.03-0.2,
  "gridColor": "rgba(...) subtle",

  "energy": number 0.0-1.0,
  "chaos": number 0.0-1.0
}

CRITICAL: Be extremely song-specific. Think about:
- The emotional journey of THIS song
- The artist's visual identity
- The genre's visual language
- Use surprising, unexpected combinations

Examples:
- "Scary Monsters" Skrillex: glitch background, shards particles, kaleidoscope geometry, skull+lightning symbols, chaos:0.9
- "Clair de Lune" Debussy: aurora background, bubbles particles, fractal_tree geometry, moon+infinity symbols, chaos:0.1
- "Lose Yourself" Eminem: cityscape background, sparks particles, waveform_bars geometry, crown+flame symbols, earthquake beat
- "Blue (Da Ba Dee)" Eiffel 65: starfield background, DNA particles, orbit_system geometry, high energy, zoom_pulse camera
- A Marshmello track: void background, confetti particles, kaleidoscope geometry, star+flower symbols, nova beat effect`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 800, messages: [{ role: 'user', content: prompt }] })
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
