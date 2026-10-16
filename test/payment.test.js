const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {validProof} = require('../lib/validation');
const registrations = require('../api/registrations');
test('proof validation enforces types, signatures, and size', () => {
  assert.equal(validProof(null),true);
  assert.equal(validProof({mimeType:'image/png',base64:Buffer.from([137,80,78,71,13,10,26,10]).toString('base64')}),true);
  assert.equal(validProof({mimeType:'image/jpeg',base64:'aGVsbG8='}),false);
  assert.equal(validProof({mimeType:'image/svg+xml',base64:'PHN2Zz4='}),false);
  assert.equal(validProof({mimeType:'image/jpeg',base64:Buffer.alloc(2097153,255).toString('base64')}),false);
});
test('registrations endpoint returns only public fields and handles upstream errors', async () => {
  const previousFetch=global.fetch, previousUrl=process.env.APPS_SCRIPT_URL;
  const call=async(method)=>{const res={setHeader(){},status(code){this.code=code;return this},json(data){this.data=data;return this}};await registrations({method},res);return res};
  try {
    assert.equal((await call('POST')).code,405);
    delete process.env.APPS_SCRIPT_URL;assert.equal((await call('GET')).code,503);
    process.env.APPS_SCRIPT_URL='https://script.google.com/macros/s/example/exec';
    global.fetch=async(url)=>{assert.ok(url.endsWith('?action=registrations'));return {ok:true,json:async()=>({ok:true,data:[{familyName:'Budi',participants:3,phone:'private',proof:'private'}]})}};
    const response=await call('GET');assert.equal(response.code,200);assert.deepEqual(response.data,{families:[{familyName:'Budi',participants:3}]});
    global.fetch=async()=>({ok:true,json:async()=>({ok:true,data:[{familyName:'Budi',participants:100}]})});
    assert.equal((await call('GET')).code,502);
    global.fetch=async()=>{throw Error('timeout')};assert.equal((await call('GET')).code,502);
  } finally {global.fetch=previousFetch;if(previousUrl===undefined)delete process.env.APPS_SCRIPT_URL;else process.env.APPS_SCRIPT_URL=previousUrl}
});
test('Apps Script migrates headers, validates uploads, and lists all registrations regardless of payment status', () => {
  const rows=[['date','id','Budi','phone',2,20000,'PP1','secret','Menunggu verifikasi'],['date','id','Sari','phone',3,30000,'PP2','secret','Lunas'],['date','id','Tono','phone',1,10000]];
  let headers;
  const sheet={getLastRow:()=>4,getRange:(row,col,count,width)=> row===1 ? {setValues(value){headers=value[0]}} : {getValues:()=>rows}};
  const context={PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'sheet-id'})},SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet})},Utilities:{base64Decode:value=>Array.from(Buffer.from(value,'base64'))}};
  vm.createContext(context);vm.runInContext(fs.readFileSync('Code.gs','utf8'),context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.getRegisteredFamilies())),[{familyName:'Budi',participants:2},{familyName:'Sari',participants:3},{familyName:'Tono',participants:1}]);
  assert.equal(headers.length,9);assert.equal(rows[0][2],'Budi');
  assert.equal(context.validateProof_(null),null);
  assert.throws(()=>context.validateProof_({mimeType:'image/jpeg',base64:'aGVsbG8='}));
});
test('Apps Script stores region and optional private proof without treating an upload as paid', () => {
  const stored=[];let files=0,trashed=0,failAppend=false;
  const sheet={getRange:()=>({setValues(){}}),appendRow(row){if(failAppend)throw Error('write failed');stored.push(row)}};
  const file={getUrl:()=> 'https://drive.google.com/private-proof',setTrashed(){trashed++}};
  const context={
    PropertiesService:{getScriptProperties:()=>({getProperty:key=>key==='SPREADSHEET_ID'?'sheet':'folder'})},
    SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet})},
    DriveApp:{getFolderById:()=>({createFile(){files++;return file}})},
    LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},
    Session:{getScriptTimeZone:()=> 'Asia/Jakarta'},
    Utilities:{formatDate:()=> 'date',getUuid:()=> 'abcd',newBlob:()=>({}),base64Decode:value=>Array.from(Buffer.from(value,'base64'))}
  };
  vm.createContext(context);vm.runInContext(fs.readFileSync('Code.gs','utf8'),context);
  const form={familyName:'Budi',phone:'081234567890',participants:2,region:'PP1'};
  const result=context.register(form);assert.equal(result.region,'PP1');assert.equal(files,0);assert.deepEqual(Array.from(stored[0]).slice(6),['PP1','','Belum bayar']);
  const withProof={...form,paymentProof:{mimeType:'image/jpeg',base64:'/9j/AA=='}};
  context.register(withProof);assert.equal(files,1);assert.deepEqual(Array.from(stored[1]).slice(6),['PP1','https://drive.google.com/private-proof','Menunggu verifikasi']);
  failAppend=true;assert.throws(()=>context.register(withProof));assert.equal(trashed,1);
  assert.throws(()=>context.register({...form,region:'Other'}));
});
