const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('Index.html','utf8');
const browserScript=html.match(/<script>([\s\S]*?)<\/script>/)[1];
test('short IDs retry collisions and preserve existing IDs',()=>{
  let sequence=['00000000','01010101'];
  const context={Utilities:{getUuid:()=>sequence.shift()}};vm.createContext(context);vm.runInContext(fs.readFileSync('Code.gs','utf8'),context);
  const sheet={getLastRow:()=>3,getRange:()=>({getValues:()=>[['AAAA'],['FW26-older-id']]})};
  assert.equal(context.generateRegistrationId_(sheet),'BBBB');
  context.Utilities.getUuid=()=> '00000000';assert.throws(()=>context.generateRegistrationId_(sheet),/ID unik/);
});
test('registration search spans all pages and resets bounds after filtering',()=>{
  const start=browserScript.indexOf('const PAGE_SIZE=10;'),end=browserScript.indexOf('function renderRegistrations()');
  const context={};vm.createContext(context);vm.runInContext(browserScript.slice(start,end),context);
  const families=Array.from({length:23},(_,i)=>({familyName:'Keluarga '+i,region:i===22?'Serpong':'PP1',participants:1}));
  let result=context.registrationView(families,'',3);assert.equal(result.rows.length,3);assert.equal(result.pages,3);
  result=context.registrationView(families,' SERPONG ',3);assert.equal(result.total,1);assert.equal(result.page,1);assert.equal(result.rows[0].familyName,'Keluarga 22');
  assert.equal(context.registrationView(families,'keluarga 22',1).total,1);
  assert.equal(context.registrationView(families,'not found',1).total,0);
});
test('camera photos larger than upload limit are resized and encoded as JPEG',async()=>{
  const start=browserScript.indexOf('async function prepareProof('),end=browserScript.indexOf('async function selectProof(');
  let canvas,revoked=0,drawn=0;
  const context={
    URL:{createObjectURL:()=> 'blob:photo',revokeObjectURL(){revoked++}},
    Image:class {naturalWidth=4000;naturalHeight=3000;set src(value){this.onload()}},
    FileReader:class {readAsDataURL(blob){this.result='data:image/jpeg;base64,/9j/AA==';this.onload()}},
    document:{createElement(){canvas={getContext:()=>({fillRect(){},drawImage(){drawn++}}),toBlob(callback,type,quality){assert.equal(type,'image/jpeg');callback({size:quality>.7?2000000:500000})}};return canvas}}
  };vm.createContext(context);vm.runInContext(browserScript.slice(start,end),context);
  const result=await context.prepareProof({size:8000000,type:''});
  assert.equal(canvas.width,1600);assert.equal(canvas.height,1200);assert.equal(result.proof.mimeType,'image/jpeg');assert.equal(result.blob.size,500000);assert.equal(drawn,1);assert.equal(revoked,1);
  await assert.rejects(()=>context.prepareProof({size:21000000}),/20 MB/);
  assert.ok(html.includes('capture="environment"'));assert.ok(html.includes('Mulai 06:30'));assert.ok(!html.includes('Start Fun Walk 07.00'));
});
