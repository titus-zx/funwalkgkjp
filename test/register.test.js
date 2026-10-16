const {test} = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/register');
test('registration validates input, handles configuration/upstream failures, and returns confirmed data', async () => {
 const originalFetch=global.fetch, originalUrl=process.env.APPS_SCRIPT_URL;
 const form={familyName:'Keluarga Budi',phone:'081234567890',participants:2};
 const call=async(method,body)=>{const res={headers:{},setHeader(k,v){this.headers[k]=v},status(s){this.code=s;return this},json(data){this.data=data;return this}};await handler({method,body},res);return res};
 try {
  global.fetch=()=>{throw Error('Unexpected network call')};
  assert.equal((await call('GET')).code,405);
  for(const body of ['{',null,{...form,participants:31},{...form,participants:'2'},{...form,phone:'abc'}]) assert.equal((await call('POST',body)).code,400);
  delete process.env.APPS_SCRIPT_URL;
  assert.equal((await call('POST',form)).code,503);
  process.env.APPS_SCRIPT_URL='https://script.google.com/macros/s/example/exec';
  global.fetch=async(url,options)=>{assert.deepEqual(JSON.parse(options.body),form);return {ok:true,json:async()=>({ok:true,data:{id:'FW26-test',...form,total:20000}})}};
  const success=await call('POST',form);
  assert.equal(success.code,200);assert.equal(success.data.total,20000);
  global.fetch=async()=>({ok:true,json:async()=>({ok:false})});
  assert.equal((await call('POST',form)).code,502);
  global.fetch=async()=>({ok:true,json:async()=>{throw Error('HTML login page')}});
  assert.equal((await call('POST',form)).code,502);
  global.fetch=async()=>{throw Error('timeout')};
  assert.equal((await call('POST',form)).code,502);
 } finally {global.fetch=originalFetch;if(originalUrl===undefined)delete process.env.APPS_SCRIPT_URL;else process.env.APPS_SCRIPT_URL=originalUrl}
});
