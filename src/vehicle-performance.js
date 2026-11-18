(function(root){
'use strict';
const D=root.LegendsData||require('../legends-data'),V=root.ProgressionV2||require('./progression-v2');
const labels={potencia:'Retas e aceleração',curvas:'Curvas e precisão',aderencia:'Pneus e aderência'};
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n)),staffCap=.40;
function effectiveStaffBonus(driverBonus,engineerBonus,affinityBonus,wetBonus,specialist){
  return clamp(driverBonus+engineerBonus+affinityBonus+wetBonus+specialist,0,staffCap);
}
// Relative strengths preserve each era's identity without claiming cross-era lap realism.
function characteristics(id){
  const car=D.cars.find(c=>c.id===id)||D.legacy.find(c=>c.id===id)||D.cars[0],a=car.stats;
  const stats={straight:a.power,corners:Math.round(a.aero*.65+a.traction*.35),tyres:Math.round(a.tyres*.7+a.efficiency*.3)};
  const values=[stats.straight,stats.corners,stats.tyres],mean=values.reduce((sum,n)=>sum+n,0)/3;
  const profile=['potencia','curvas','aderencia'][values.indexOf(Math.max(...values))];
  return{car,stats,mean,profile,label:labels[profile],base:[.03,.06,.10,.15,.22][car.rarity]||0};
}
function performance(s,id,options={}){
  const Shop=root.ApexShop||require('./shop'),info=characteristics(id||Shop.init(s).selectedCar||s.garage?.equipped||'lotus49');
  const profile=labels[options.trackProfile]?options.trackProfile:V.B.trackProfile(V.index(s));
  const value=info.stats[{potencia:'straight',curvas:'corners',aderencia:'tyres'}[profile]];
  const trackBonus=clamp((value-info.mean)*.004,-.06,.06);
  const roster=Shop.teamRoster(s),driver=roster.find(x=>x.role==='driver'&&x.selected)||null,engineer=roster.find(x=>x.role==='engineer'&&x.selected)||null,historical=driver?.cars.includes(info.car.id)||false;
  const synergy=historical||driver?.profile===info.profile,affinityBonus=synergy?.03:0;
  const wetBonus=options.wet&&driver?clamp(((driver.skills?.wet||75)-75)/1000,0,.025):0;
  const specialist=driver?.profile===profile?0.012:0;
  const staffBonus=effectiveStaffBonus(driver?.bonus||0,engineer?.bonus||0,affinityBonus,wetBonus,specialist);
  const effectiveAffinityBonus=clamp(staffCap-effectiveStaffBonus(driver?.bonus||0,engineer?.bonus||0,0,wetBonus,specialist),0,affinityBonus);
  const windowMult=clamp(1+(info.stats.tyres-info.mean)*.014+(driver?.profile==='aderencia'?.08:0)+(engineer?.profile==='aderencia'?.04:0),.86,1.28);
  const affinityOrigin=historical?'Combinação de piloto e carro do catálogo':synergy?'Estilo do piloto combina com o ponto forte do carro':'';
  return{...info,base:info.base,bonus:Math.max(0,info.base+trackBonus),trackBonus,trackProfile:profile,trackLabel:labels[profile],windowMult,synergy,synergyLabel:historical?'Dupla de afinidade':synergy?'Estilos compatíveis':'Sem afinidade ativa',affinityOrigin,affinityBonus,effectiveAffinityBonus,driver,engineer,staffBonus,wetBonus,specialist,training:driver?.training||null};
}
const api={characteristics,performance,labels,staffCap,effectiveStaffBonus};root.ApexVehicle=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
