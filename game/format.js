(function(root){
const suffixes=['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc'];
function suffix(tier){if(tier<suffixes.length)return suffixes[tier];const n=tier-suffixes.length;return String.fromCharCode(97+Math.floor(n/26))+String.fromCharCode(97+n%26)}
let warned=false;
function format(n,mode='short'){if(!Number.isFinite(n)){if(!warned){warned=true;console.warn('Valor numérico inválido na interface.')}return '—'}const a=Math.abs(n);if(a<1000)return new Intl.NumberFormat('pt-BR',{maximumFractionDigits:a<10?2:0}).format(n);if(mode==='scientific'){const [v,e]=n.toExponential(2).split('e');return v.replace('.',',')+'e'+Number(e)}let tier=Math.floor(Math.log10(a)/3),scaled=n/10**(tier*3);if(Math.abs(scaled)>=999.995){tier++;scaled=n/10**(tier*3)}return scaled.toFixed(2).replace('.',',')+suffix(tier)}
const api={format,suffix};root.GameFormat=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
