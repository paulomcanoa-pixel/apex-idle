import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),L=require('./loot-model.js'),Tx=require('./loot-transaction.js');
function environment(calm=true){
  const html=[],events={};let raf=0;
  class Node {
    constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.style={setProperty(){}};this.className='';this.isConnected=true;this.clientWidth=390;this.clientHeight=800;this.offsetParent={};this.listeners={};this.classList={add(){},remove(){}}}
    append(...nodes){this.children.push(...nodes)}prepend(n){this.children.unshift(n)}replaceChildren(...n){this.children=n}setAttribute(k,v){this[k]=v}focus(){doc.activeElement=this}remove(){this.isConnected=false}
    addEventListener(k,fn){this.listeners[k]=fn}getBoundingClientRect(){return{left:0,top:0,width:100,height:100}}
    getContext(){return{setTransform(){},clearRect(){}}}querySelectorAll(){return[]}
    set innerHTML(value){html.push(value)}
  }
  const doc={body:new Node('body'),createElement:t=>new Node(t),createDocumentFragment:()=>new Node('fragment'),createTextNode:text=>({textContent:text}),addEventListener:(k,f)=>events[k]=f,removeEventListener:k=>delete events[k]};
  const root={document:doc,ApexLootArt:{box:()=>'<svg>box</svg>',card:()=>'<svg>card</svg>'},matchMedia:()=>({matches:calm}),addEventListener(){},removeEventListener(){},requestAnimationFrame(){raf++;return raf},cancelAnimationFrame(){},performance:{now:()=>0}};
  const context={window:root,console,setTimeout,clearTimeout};vm.runInNewContext(fs.readFileSync(new URL('./loot-cinema.js',import.meta.url),'utf8'),context);
  const walk=n=>[n,...n.children?.flatMap(walk)||[]];return{root,doc,html,events,walk,get raf(){return raf}};
}
const result={kind:'online',tier:'bronze',credits:100,fragments:0,cards:[{rarity:'lendario',name:'<img onerror="x">',art:'motor'},{rarity:'comum',name:'Primeiro',art:'pneu'}]};
test('cinema valida cards antes de acessar DOM',()=>{assert.throws(()=>require('./loot-cinema.js').play({}),/result.cards/)});
test('cinema ordena cartas, texto externo nunca vira HTML e movimento reduzido dispensa ritual',async()=>{const e=environment(),c=e.root.ApexLootCinema.play({result}),nodes=e.walk(e.doc.body);assert.deepEqual(nodes.filter(n=>n.className==='lc-name').map(n=>n.textContent),['Primeiro','<img onerror="x">']);assert(e.html.every(x=>x.startsWith('<svg>')));assert.equal(e.raf,0);assert.equal(nodes.find(n=>n.className==='lc-overlay').dataset.phase,'summary');c.close();await c.promise;assert(!e.root.ApexLootCinema.isOpen())});
test('Esc pula e fecha; fechar durante espera não deixa ritual pendurado',async()=>{const e=environment(false),api=e.root.ApexLootCinema,c=api.play({result});e.events.keydown({key:'Escape',preventDefault(){}});assert.equal(e.walk(e.doc.body).find(n=>n.className==='lc-overlay').dataset.phase,'summary');e.events.keydown({key:'Escape',preventDefault(){}});await c.promise;const other=api.play({result});other.close();await other.promise;assert(!api.isOpen())});
test('falha de persistência restaura caixa, dinheiro e contadores',()=>{const s={money:100,idle:{totalEarned:50,cycleEarned:40},meta:{}};L.init(s);L.onMission(s,'weekly');const before=JSON.stringify(s);assert.throws(()=>Tx.open(s,'online',{income:2,rng:()=>.01,persist:()=>false}),/salvar/);assert.equal(JSON.stringify(s),before)});
test('templates da V2 criam texto seguro sem entregar texto importado a innerHTML',()=>{const e=environment();vm.runInNewContext(fs.readFileSync(new URL('../safe-dom.js',import.meta.url),'utf8'),{window:e.root});const target=e.doc.createElement('div');e.root.ApexSafeDOM.render(target,'<p>&lt;img onerror=&quot;x&quot;&gt;</p><img src="x" onerror="x"><button onclick="x">Abrir</button>');const nodes=e.walk(target);assert(nodes.some(n=>n.textContent==='<img onerror="x">'));assert(!nodes.some(n=>n.tagName==='IMG'||n.onclick));assert.equal(e.html.length,0)});
