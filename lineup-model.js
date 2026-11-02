(function(root){
const A=typeof Apex!=='undefined'?Apex:require('./engine'),L=typeof Legends!=='undefined'?Legends:require('./legends-model'),D=typeof LegendsData!=='undefined'?LegendsData:require('./legends-data'),M=typeof Championship!=='undefined'?Championship:require('./championship-model');
function cars(s){const ids=[...new Set([...A.ownedCars(s),...(s.heritage?.owned||[])])];return ids.map(id=>L.get(id)).filter(Boolean)}
function drivers(s){const c=M.init(s);return M.roster.filter(d=>d.role==='driver'&&c.roster[d.id])}
function current(s){const c=M.init(s);return{car:A.equippedCar(s).id,driver:c.driver}}
function paused(){return true}
function owns(s,car,driver){return cars(s).some(v=>v.id===car)&&drivers(s).some(v=>v.id===driver)}
function preview(s,car,driver){if(!owns(s,car,driver))return null;const draft=JSON.parse(JSON.stringify(s));L.init(draft);M.init(draft);const historical=D.cars.some(c=>c.id===car);draft.heritage.equipped=historical?car:'';if(!historical)draft.equippedCar=car;draft.championship.car=historical?car:'';draft.championship.driver=driver;const G=typeof GarageState!=='undefined'?GarageState:require('./garage-state');G.init(draft);G.equip(draft,car);return{duration:A.duration(draft),reward:A.reward(draft),affinity:L.affinity(car,driver),car:L.get(car),driver:M.roster.find(d=>d.id===driver)}}
function apply(s,car,driver){if(!paused(s)||!owns(s,car,driver))return false;const draft=JSON.parse(JSON.stringify(s));L.init(draft);M.init(draft);const historical=D.cars.some(c=>c.id===car),equipped=historical?L.equip(draft,car):A.equipCar(draft,car);if(!equipped||!M.equip(draft,driver))return false;Object.assign(s,draft);return true}
const api={cars,drivers,current,paused,owns,preview,apply};root.Lineup=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

