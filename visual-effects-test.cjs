const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const source=require('node:fs').readFileSync('src/effects.js','utf8');

function setup(){
  let click,setting='high',reduced=false;
  const document={
    addEventListener(name,handler){if(name==='click')click=handler},
    createElement(){return {setAttribute(){},getContext(){return {}}}},
    body:{append(){}}
  };
  const window={document,matchMedia:()=>({matches:reduced}),ApexEffectsState:()=>setting,requestAnimationFrame:()=>1};
  vm.runInNewContext(source,{window});
  const button={disabled:false,dataset:{},closest:()=>null,getBoundingClientRect:()=>({left:10,top:20,width:100,height:40})};
  const trigger=(options={})=>click({isTrusted:true,detail:1,clientX:35,clientY:40,target:{closest:()=>button},...options});
  return {window,button,trigger,setEffects:value=>{setting=value},setReduced:value=>{reduced=value}};
}

test('efeitos seguem cliques reais, teclado e preferências de movimento',()=>{
  const s=setup(),pool=s.window.ApexEffects.pool;
  s.trigger();assert.equal(pool.items.length,1);assert.equal(pool.items[0].kind,'ripple');assert.equal(pool.items[0].x,35);
  pool.step(.4);assert.equal(pool.items.length,0);
  s.trigger({isTrusted:false});assert.equal(pool.items.length,0);
  s.button.disabled=true;s.trigger();assert.equal(pool.items.length,0);s.button.disabled=false;
  s.setEffects('off');s.trigger();assert.equal(pool.items.length,0);s.setEffects('high');
  s.setReduced(true);s.trigger();assert.equal(pool.items.length,0);s.setReduced(false);
  s.trigger({detail:0});assert.equal(pool.items.length,1);assert.equal(pool.items[0].x,60);assert.equal(pool.items[0].y,40);
});

test('compras da oficina mantêm o efeito específico sem duplicar a animação',()=>{
  const s=setup();s.button.dataset.action='buy';s.button.closest=selector=>selector==='.v2-panel'?{}:null;
  s.trigger();assert.equal(s.window.ApexEffects.pool.items.length,0);
});
