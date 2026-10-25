// Fast, asset-free protection checks for the save module. Runs under npm test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(resolve(root,'src/js/18a-save-system.js'),'utf8');
const makeState=()=>({pid:'common',ver:5,sv:1,year:100,age:14,t:14,mode:'q',q:0,
  stats:[500,500,500,500],npc:[{name:'母',off:26,stats:[500,500,500,500]}],log:[],chron:[],pending:[],decision:null});
const make=()=>{
  const db=new Map(),messages=[],steps=[];
  const storage={getItem:k=>db.has(k)?db.get(k):null,setItem:(k,v)=>db.set(k,String(v))};
  const ctx=vm.createContext({
    window:{addEventListener:()=>{}},document:{addEventListener:()=>{}},
    localStorage:storage,KEY:'kyoto-kurashi-mihon-v4',S:makeState(),PERSONAS:{common:{}},
    setTimeout:(fn,ms)=>{steps.push(fn);return steps.length},clearTimeout:()=>{},
    toast:m=>messages.push(m),$:(id)=>null,migrate:s=>{s.sv=1;return s},
    stop:()=>{},setBar:()=>{},bthEnd:()=>{},evHide:()=>{},go:()=>{},centerScene:()=>{},
    BIRTH_MAX:Number(readFileSync(new URL('../src/js/01-core-personas.js',import.meta.url),'utf8').match(/const BIRTH_MAX=(\d+);/)[1]),   // 本番の定義をそのまま使う
    confirm:()=>true,remaining:0,resume:false,sceneX:0,
    Date,Math,console,
  });
  vm.runInContext(source,ctx,{filename:'18a-save-system.js'});
  const run=(code)=>vm.runInContext(code,ctx);
  return {ctx,db,messages,steps,run};
};
test('autosaving is disarmed until a life starts; manual slot stays separate',()=>{
  const x=make(),key='kyoto-kurashi-mihon-v4';
  x.db.set(key,'original-manual');
  assert.equal(x.run('saveAutoNow()'),false);
  assert.equal(x.db.has(key+'-autosave'),false);
  x.run('saveNewLife()');
  assert.ok(x.db.has(key+'-autosave'));
  assert.equal(x.db.get(key),'original-manual');
});
test('autosave keeps a previous checkpoint, without overwriting manual data',()=>{
  const x=make(),key='kyoto-kurashi-mihon-v4';
  x.db.set(key,'manual-snapshot');
  x.run('saveNewLife()');
  const original=x.db.get(key+'-autosave');
  x.run('S.age=15;saveAutoNow()');
  assert.equal(x.db.get(key+'-autosave-previous'),original);
  assert.equal(JSON.parse(x.db.get(key+'-autosave')).age,15);
  assert.equal(x.db.get(key),'manual-snapshot');
});
test('invalid, future and malformed saves are rejected without changing current play',()=>{
  const x=make();
  const prev=x.run('JSON.stringify(S)');
  assert.equal(x.run("saveRestore({pid:'evil',stats:[1,2,3,4],npc:[]},'test')"),false);
  assert.equal(x.run("saveRestore({format:'other',version:1,state:{}},'test')"),false);
  const tooNew=makeState();tooNew.sv=99;
  x.ctx.sample=tooNew;
  assert.equal(x.run("saveRestore(sample,'test')"),false);
  const invalid=makeState();invalid.stats[0]=1e30;x.ctx.sample=invalid;
  assert.equal(x.run("saveRestore(sample,'test')"),false);
  assert.equal(x.run('JSON.stringify(S)'),prev);
});
test('restore preserves the prior current life independently from manual saves',()=>{
  const x=make(),key='kyoto-kurashi-mihon-v4';
  x.db.set(key,JSON.stringify({...makeState(),age:30,t:30,year:116}));
  x.run('saveNewLife()');
  const previous=x.run('JSON.stringify(S)');
  const other=makeState();Object.assign(other,{age:50,t:50,year:150});
  x.ctx.sample=other;
  assert.equal(x.run("saveRestore(sample,'JSONファイル')"),true);
  assert.equal(x.run('S.age'),50);
  assert.equal(x.db.get(key+'-before-replace'),previous);
  assert.equal(JSON.parse(x.db.get(key)).age,30);
});
test('legacy raw state is preserved before migration and new exported wrapper is accepted',()=>{
  const x=make(),key='kyoto-kurashi-mihon-v4';
  const legacy=makeState();delete legacy.sv;
  x.ctx.legacy=legacy;
  assert.equal(x.run("saveRestore(legacy,'旧セーブ')"),true);
  const idx=JSON.parse(x.db.get(key+'-premigrate-index'));            // 原本は内容の指紋つきのキーに退避され、索引から辿れる
  assert.equal(idx.length,1);
  assert.equal(JSON.parse(x.db.get(idx[0].key)).sv,undefined);
  const firstCopy=x.db.get(idx[0].key);
  assert.equal(x.run("saveRestore(legacy,'旧セーブ')"),true);          // 同じ原本を何度読み込んでも、上書きも増殖もしない
  assert.equal(JSON.parse(x.db.get(key+'-premigrate-index')).length,1);
  assert.equal(x.db.get(idx[0].key),firstCopy);
  const other=makeState();delete other.sv;Object.assign(other,{age:30,t:30,year:116});x.ctx.other=other;   // 別の原本は別のキーで残す
  assert.equal(x.run("saveRestore(other,'別の旧セーブ')"),true);
  assert.equal(JSON.parse(x.db.get(key+'-premigrate-index')).length,2);
  assert.equal(x.db.get(idx[0].key),firstCopy);
  const wrapped={format:'earth2000-kyoto-save',version:1,state:makeState()};
  x.ctx.wrapped=wrapped;
  assert.equal(x.run('savePrepare(wrapped).age'),14);
});
