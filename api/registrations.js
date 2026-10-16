module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {res.setHeader('Allow','GET');return res.status(405).json({error:'Gunakan metode GET.'});}
  const url = process.env.APPS_SCRIPT_URL;
  if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url)) return res.status(503).json({error:'Daftar pendaftaran belum tersedia.'});
  try {
    const upstream = await fetch(url + '?action=registrations', {signal:AbortSignal.timeout(20000)});
    if (!upstream.ok) throw Error('Upstream failed');
    const result = await upstream.json();
    if (!result.ok || !Array.isArray(result.data)) throw Error('Invalid response');
    const families = result.data.map(row => {
      if (typeof row.familyName !== 'string' || row.familyName.length > 80 || !Number.isInteger(row.participants) || row.participants < 1 || row.participants > 30) throw Error('Invalid row');
      return {familyName:row.familyName,participants:row.participants};
    });
    return res.status(200).json({families});
  } catch {return res.status(502).json({error:'Daftar pendaftaran belum dapat dimuat. Coba lagi nanti.'});}
};
