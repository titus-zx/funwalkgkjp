const CONFIG = { SHEET_NAME: 'Pendaftaran', FEE: 10000, MAX: 30, HEADERS: ['Waktu Daftar','ID Pendaftaran','Nama Keluarga','No HP','Jumlah Peserta','Biaya Pendaftaran (Rp)'] };

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Pendaftaran Fun Walk GKJ Pamulang 2026')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function setupSheet() {
  const sheet = getSheet_();
  sheet.setFrozenRows(1);
  sheet.getRange(1,1,1,CONFIG.HEADERS.length).setBackground('#145c40').setFontColor('#ffffff').setFontWeight('bold');
  sheet.getRange('D:D').setNumberFormat('@');
  sheet.getRange('F:F').setNumberFormat('"Rp" #,##0');
  return sheet.getParent().getUrl();
}

function register(form) {
  const name = String(form && form.familyName || '').trim().replace(/\s+/g,' ').slice(0,80);
  const phone = String(form && form.phone || '').trim().replace(/[\s().-]/g,'');
  const count = Number(form && form.participants);
  if (name.length < 3) throw new Error('Nama keluarga minimal 3 karakter.');
  if (!/^(?:\+62|62|0)8\d{7,11}$/.test(phone)) throw new Error('Nomor HP tidak valid.');
  if (!Number.isInteger(count) || count < 1 || count > CONFIG.MAX) throw new Error('Jumlah peserta harus 1–30 orang.');
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Pendaftaran sedang ramai, coba lagi.');
  try {
    const fee = count * CONFIG.FEE;
    const id = 'FW26-' + Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyMMdd-HHmmss') + '-' + Utilities.getUuid().slice(0,4).toUpperCase();
    getSheet_().appendRow([new Date(),id,escapeCell_(name),"'" + phone,count,fee]);
    return {id, familyName:name, participants:count, total:fee};
  } finally { lock.releaseLock(); }
}

function getSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('SPREADSHEET_ID belum disetel panitia.');
  const ss = SpreadsheetApp.openById(id);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  if (!sheet.getLastRow()) sheet.appendRow(CONFIG.HEADERS);
  return sheet;
}
function escapeCell_(value) { return /^[=+\-@\t\r]/.test(value) ? "'" + value : value; }
