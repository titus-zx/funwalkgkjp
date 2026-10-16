const {REGIONS, validProof} = require('../lib/validation');
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({error: 'Gunakan metode POST.'});
  }
  let form;
  try { form = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({error: 'Data pendaftaran tidak valid.'}); }
  const familyName = typeof form?.familyName === 'string' ? form.familyName.trim().replace(/\s+/g, ' ') : '';
  const phone = typeof form?.phone === 'string' ? form.phone.replace(/[\s().-]/g, '') : '';
  const participants = form?.participants;
  const region = form?.region;
  const paymentProof = form?.paymentProof ?? null;
  if (!REGIONS.includes(region) || !validProof(paymentProof) || familyName.length < 3 || familyName.length > 80 ||
      !/^(?:\+62|62|0)8\d{7,11}$/.test(phone) ||
      !Number.isInteger(participants) || participants < 1 || participants > 30) {
    return res.status(400).json({error: 'Periksa data, wilayah pelayanan, dan bukti bayar (JPG, PNG, atau WebP, maksimal 2 MB).'});
  }
  const url = process.env.APPS_SCRIPT_URL;
  if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url)) {
    return res.status(503).json({error: 'Pendaftaran belum dibuka. Hubungi panitia.'});
  }
  try {
    const upstream = await fetch(url, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({familyName, phone, participants, region, paymentProof}),
      signal: AbortSignal.timeout(20000), redirect: 'follow'
    });
    if (!upstream.ok) throw new Error('Upstream failed');
    const result = await upstream.json();
    if (!result.ok) return res.status(502).json({error: 'Pendaftaran gagal. Periksa data atau hubungi panitia sebelum mencoba lagi.'});
    const data = result.data;
    if (typeof data?.id !== 'string' || data.familyName !== familyName ||
        data.region !== region || data.participants !== participants || data.total !== participants * 10000) throw new Error('Invalid upstream response');
    return res.status(200).json({id: data.id, familyName: data.familyName, participants: data.participants, total: data.total});
  } catch {
    return res.status(502).json({error: 'Belum dapat memastikan pendaftaran tersimpan. Hubungi panitia sebelum mencoba lagi.'});
  }
};
