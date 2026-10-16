const REGIONS = ['PP1', 'PP2', 'Reni Jaya', 'Bukit Indah', 'Serpong'];
const MAX_PROOF_BYTES = 2 * 1024 * 1024;
function validProof(proof) {
  if (proof == null) return true;
  if (!proof || !['image/jpeg', 'image/png', 'image/webp'].includes(proof.mimeType) ||
      typeof proof.base64 !== 'string' || !proof.base64.length ||
      proof.base64.length > Math.ceil(MAX_PROOF_BYTES / 3) * 4 ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(proof.base64)) return false;
  const bytes = Buffer.from(proof.base64, 'base64');
  if (bytes.length > MAX_PROOF_BYTES) return false;
  return (proof.mimeType === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) ||
    (proof.mimeType === 'image/png' && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) ||
    (proof.mimeType === 'image/webp' && bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP');
}
module.exports = {REGIONS, validProof};
