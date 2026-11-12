(function(root){
'use strict';
// Templates internos viram nós; texto importado nunca passa por um parser HTML do navegador.
const tags=new Set('nav button small strong p span h2 h3 article div canvas label select option ol li br b progress details summary pre input a'.split(' '));
const decode=text=>text.replace(/&(amp|lt|gt|quot|#39|nbsp);/g,(_,key)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'",nbsp:'\u00a0'}[key]));
function render(target,markup){
  const doc=target.ownerDocument||root.document,fragment=doc.createDocumentFragment(),stack=[fragment];
  for(const token of String(markup).match(/<[^>]*>|[^<]+|</g)||[]){
    if(token[0]!=='<'){stack.at(-1).append(doc.createTextNode(decode(token)));continue}
    const closing=token.match(/^<\/([a-z0-9]+)\s*>$/i);
    if(closing){if(stack.length>1&&stack.at(-1).tagName.toLowerCase()===closing[1].toLowerCase())stack.pop();continue}
    const opening=token.match(/^<([a-z0-9]+)\b([^>]*)>$/i);
    if(!opening||!tags.has(opening[1].toLowerCase()))continue;
    const tag=opening[1].toLowerCase(),node=doc.createElement(tag);
    for(const m of opening[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)){
      const key=m[1].toLowerCase(),value=decode(m[2]||'');
      if(['id','class','width','height','role','type','value','disabled','checked','max'].includes(key)||/^(data|aria)-[\w-]+$/.test(key))node.setAttribute(key,value);
      if(tag==='a'&&key==='href'&&['/termos.html','/privacidade.html'].includes(value))node.setAttribute(key,value);
      if(tag==='a'&&key==='target'&&value==='_blank'){node.setAttribute(key,value);node.setAttribute('rel','noopener')}
    }
    stack.at(-1).append(node);if(!['input','br'].includes(tag))stack.push(node);
  }
  target.replaceChildren(fragment);
}
root.ApexSafeDOM={render};if(typeof module!=='undefined')module.exports=root.ApexSafeDOM;
})(typeof window!=='undefined'?window:globalThis);
