// 京都版のセーブ操作をブラウザで確認する。実HTML・背景が必要。
import { open } from './lib.mjs';
import { readFileSync } from 'node:fs';
const {browser,page,errs}=await open();
let ok=false,checks={};
try{
  checks.initial=await page.evaluate(()=>{
    newLife('common',100,false);
    const saved=JSON.parse(localStorage.getItem(SAVE_AUTO_KEY)||'null');
    return !!saved&&saved.pid===S.pid&&saved.age===S.age;
  });
  await page.locator('button[data-go="menu"]').click();
  await page.locator('#save').click();
  checks.manual=await page.evaluate(()=>{
    const manual=JSON.parse(localStorage.getItem(KEY)||'null');
    return !!manual&&manual.age===S.age;
  });
  await page.evaluate(()=>{S.stats[0]=Math.max(0,S.stats[0]-11);saveAutoNow()});
  checks.manualUnchanged=await page.evaluate(()=>JSON.parse(localStorage.getItem(KEY)).stats[0]!==S.stats[0]);
  await page.locator('#load').click();
  checks.restoredManual=await page.evaluate(()=>JSON.parse(localStorage.getItem(KEY)).stats[0]===S.stats[0]);
  await page.locator('button[data-go="menu"]').click();
  const dlPromise=page.waitForEvent('download',{timeout:10000});
  await page.locator('#export-save').click();
  const download=await dlPromise;
  const exported=JSON.parse(readFileSync(await download.path(),'utf8'));
  checks.exported=exported.format==='earth2000-kyoto-save'&&exported.version===1&&exported.state.pid==='common';
  await page.evaluate(()=>{S.stats[0]=Math.max(0,S.stats[0]-13);saveAutoNow()});
  const beforeImport=await page.evaluate(()=>S.stats[0]);
  page.once('dialog',d=>d.accept());
  await page.locator('#import-file').setInputFiles({
    name:'kyoto-life-backup.json',
    mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(exported))
  });
  await page.waitForTimeout(400);
  checks.imported=await page.evaluate(()=>S.stats[0])===exported.state.stats[0];
  checks.protected=await page.evaluate(()=>JSON.parse(localStorage.getItem(SAVE_PROTECT_KEY)||'null')?.stats[0])===beforeImport;
  checks.failedImportKeepsCurrent=await page.evaluate(()=>{
    const prev=JSON.stringify(S);
    return !saveRestore({format:'unknown',version:99,state:{}},'不正ファイル')&&JSON.stringify(S)===prev;
  });
  await page.locator('button[data-go="menu"]').click();
  checks.recoveryVisible=await page.locator('#restore-protected').isVisible();
  page.once('dialog',d=>d.accept());
  await page.locator('#restore-protected').click();
  checks.recovered=await page.evaluate(()=>S.stats[0])===beforeImport;
  checks.errors=errs;
  ok=Object.entries(checks).every(([k,v])=>k==='errors'?v.length===0:v===true);
} catch(e){checks.exception=String(e)}
console.log(ok?'PASS':'FAIL',JSON.stringify(checks));
await browser.close();
process.exit(ok?0:1);
