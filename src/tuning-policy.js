(function(root){
'use strict';
// Faixas por chave: tuning remoto não pode dobrar recompensas silenciosamente.
function validate(data,base){
  function check(v,b,path){
    if(typeof b==='number'){
      const key=path.split('.').at(-1),reward=/^(r0|rg|prizeK|rate|genRateMul|perLevel|msMult)$/.test(key)||path.startsWith('pts.');
      if(!Number.isFinite(v)||v<b*.5||v>b*(reward?1.25:2))throw Error('Tuning fora da faixa: '+path);
      if((Number.isInteger(b)&&/^(laps|dgBreak|overhead)$/.test(key)||/^(pts|ms|genUnlock)\./.test(path))&&!Number.isInteger(v))throw Error('Tuning exige inteiro: '+path);
      if(path==='laps'&&v!==b)throw Error('Número de voltas protegido');
      if(/^(ms|genUnlock)\./.test(path)&&v!==b)throw Error('Marco de progressão protegido: '+path);
      return;
    }
    if(typeof b==='string'){if(v!==b)throw Error('Identificador de tuning inválido: '+path);return}
    if(!v||typeof v!=='object'||Array.isArray(v)!==Array.isArray(b)||Object.keys(v).length!==Object.keys(b).length)throw Error('Esquema de tuning inválido: '+path);
    for(const k of Object.keys(b))check(v[k],b[k],path?path+'.'+k:k);
  }
  if(!Number.isInteger(data?.version)||data.version<1)throw Error('Versão de tuning inválida');
  check(data.values,base,'');
  const v=data.values;
  if(v.g<1.05||v.g>1.3||v.repB<1||v.repB>3||v.lapMin<14||v.lapMax>30||v.lapMin>v.lapMax||v.d0<1||v.d0>3||v.rg<1||v.rg>2)throw Error('Configuração de balanceamento inválida');
  return data;
}
root.ApexTuningPolicy={validate};if(typeof module!=='undefined')module.exports=root.ApexTuningPolicy;
})(typeof window!=='undefined'?window:globalThis);
