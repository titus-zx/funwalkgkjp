const CONFIG = { SHEET_NAME: 'Pendaftaran', FEE: 10000, MAX: 30, HEADERS: ['Waktu Daftar','ID Pendaftaran','Nama Keluarga','No HP','Jumlah Peserta','Biaya Pendaftaran (Rp)','Wilayah Pelayanan','Bukti Bayar','Status Pembayaran'] };

function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'registrations') {
    try { return json_({ok:true, data:getRegisteredFamilies()}); }
    catch (err) { return json_({ok:false, error:'Daftar pendaftaran belum tersedia.'}); }
  }
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Pendaftaran Fun Walk GKJ Pamulang 2026')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Jalankan sekali dari Extensions > Apps Script pada spreadsheet tujuan.
function setupSheet() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', active.getId());
  }
  const sheet = getSheet_();
  getPaymentFolder_();
  sheet.setFrozenRows(1);
  sheet.getRange(1,1,1,CONFIG.HEADERS.length).setBackground('#145c40').setFontColor('#ffffff').setFontWeight('bold');
  sheet.getRange('B:B').setNumberFormat('@');
  sheet.getRange('D:D').setNumberFormat('@');
  sheet.getRange('F:F').setNumberFormat('"Rp" #,##0');
  return sheet.getParent().getUrl();
}

function register(form) {
  const name = String(form && form.familyName || '').trim().replace(/\s+/g,' ').slice(0,80);
  const phone = String(form && form.phone || '').trim().replace(/[\s().-]/g,'');
  const count = Number(form && form.participants);
  const region = form && form.region;
  if (['PP1','PP2','Reni Jaya','Bukit Indah','Serpong'].indexOf(region) < 0) throw new Error('Pilih Wilayah Pelayanan.');
  const proof = validateProof_(form && form.paymentProof);
  if (name.length < 3) throw new Error('Nama keluarga minimal 3 karakter.');
  if (!/^(?:\+62|62|0)8\d{7,11}$/.test(phone)) throw new Error('Nomor HP tidak valid.');
  if (!Number.isInteger(count) || count < 1 || count > CONFIG.MAX) throw new Error('Jumlah peserta harus 1–30 orang.');
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Pendaftaran sedang ramai, coba lagi.');
  try {
    const fee = count * CONFIG.FEE;
    const sheet = getSheet_();
    const id = generateRegistrationId_(sheet);
    let file;
    try {
      if (proof) {
        file = getPaymentFolder_().createFile(Utilities.newBlob(proof.bytes, proof.mimeType, id + proof.extension));
      }
      sheet.appendRow([new Date(),"'" + id,escapeCell_(name),"'" + phone,count,fee,region,file ? file.getUrl() : '',file ? 'Menunggu verifikasi' : 'Belum bayar']);
    } catch (err) {
      if (file) file.setTrashed(true);
      throw err;
    }
    return {id, familyName:name, participants:count, total:fee, region:region};
  } finally { lock.releaseLock(); }
}

function getSheet_() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  // Append new column headers without shifting or replacing existing registration rows.
  sheet.getRange(1,1,1,CONFIG.HEADERS.length).setValues([CONFIG.HEADERS]);
  return sheet;
}
function escapeCell_(value) { return /^[=+\-@\t\r]/.test(value) ? "'" + value : value; }

// Endpoint JSON untuk formulir yang di-host di Vercel.
function doPost(e) {
  let result;
  try {
    result = {ok: true, data: register(JSON.parse(e.postData.contents))};
  } catch (err) {
    result = {ok: false, error: 'Pendaftaran gagal. Periksa data atau hubungi panitia sebelum mencoba lagi.'};
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function getPaymentFolder_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('PAYMENT_FOLDER_ID');
  if (id) return DriveApp.getFolderById(id);
  const folder = DriveApp.createFolder('Bukti Bayar Fun Walk GKJ Pamulang 2026');
  props.setProperty('PAYMENT_FOLDER_ID', folder.getId());
  return folder;
}
function validateProof_(proof) {
  if (proof == null) return null;
  const types = {'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp'};
  if (!proof || !types[proof.mimeType] || typeof proof.base64 !== 'string' ||
      !proof.base64.length || proof.base64.length > 2796204 ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(proof.base64)) throw new Error('Bukti bayar tidak valid.');
  const bytes = Utilities.base64Decode(proof.base64);
  const b = bytes.map(function(n) {return (n + 256) % 256;});
  const jpeg = proof.mimeType === 'image/jpeg' && b[0] === 255 && b[1] === 216 && b[2] === 255;
  const png = proof.mimeType === 'image/png' && [137,80,78,71,13,10,26,10].every(function(n,i){return b[i]===n;});
  const webp = proof.mimeType === 'image/webp' && [82,73,70,70].every(function(n,i){return b[i]===n;}) && [87,69,66,80].every(function(n,i){return b[i+8]===n;});
  if (bytes.length > 2097152 || !(jpeg || png || webp)) throw new Error('Bukti bayar harus JPG, PNG, atau WebP, maksimal 2 MB.');
  return {bytes:bytes,mimeType:proof.mimeType,extension:types[proof.mimeType]};
}
function getRegisteredFamilies() {
  const sheet = getSheet_();
  if (sheet.getLastRow() < 2) return [];
  return sheet.getRange(2,1,sheet.getLastRow()-1,CONFIG.HEADERS.length).getValues()
    .filter(function(row){return String(row[2]).trim() && Number.isInteger(Number(row[4])) && Number(row[4]) >= 1 && Number(row[4]) <= CONFIG.MAX;})
    .map(function(row){return {familyName:String(row[2]).replace(/^'(?=[=+@-])/, ''),participants:Number(row[4]),region:String(row[6] || '')};});
}


// Web App tidak selalu memiliki spreadsheet aktif. ID disimpan saat setup
// agar request dari Vercel tetap menggunakan spreadsheet yang sama.
function getSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('Buka spreadsheet tujuan > Extensions > Apps Script, lalu jalankan setupSheet sekali sebelum deploy.');
  props.setProperty('SPREADSHEET_ID', active.getId());
  return active;
}

function generateRegistrationId_(sheet) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const last = sheet.getLastRow();
  const existing = new Set(last > 1 ? sheet.getRange(2,2,last-1,1).getValues().map(function(row){return String(row[0]).replace(/^'/, '').trim().toUpperCase();}) : []);
  for (let attempt=0; attempt<100; attempt++) {
    const hex = Utilities.getUuid().replace(/-/g, '');
    let id = '';
    for (let i=0; i<4; i++) id += alphabet[parseInt(hex.slice(i*2,i*2+2),16) % alphabet.length];
    if (!existing.has(id)) return id;
  }
  throw new Error('Belum dapat membuat ID unik. Coba lagi.');
}

