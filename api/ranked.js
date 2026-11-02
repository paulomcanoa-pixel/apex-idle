const M=require('../server/ranked-model.cjs');
const crypto=require('node:crypto');
const PATH='ranked/state-v1.json';
async function transaction(action){
const {get,put}=await import('@vercel/blob');const token=process.env.BLOB_READ_WRITE_TOKEN;
if(!token)throw Object.assign(new Error('Armazenamento ranked indisponível.'),{status:503});
for(let attempt=0;attempt<7;attempt++){
const current=await get(PATH,{access:'private',token,useCache:false});
const db=current?await new Response(current.stream).json():M.initial();const before=JSON.stringify(db);const value=action(db);
if(before===JSON.stringify(db))return value;
try{await put(PATH,JSON.stringify(db),{access:'private',token,addRandomSuffix:false,allowOverwrite:!!current,contentType:'application/json',...(current?{ifMatch:current.blob.etag}:{})});return value}
catch(e){if(!/Precondition|AlreadyExists|Conflict/.test(e.name+' '+e.message))throw e;await new Promise(r=>setTimeout(r,60+attempt*60))}
}
throw Object.assign(new Error('Sala movimentada. Tente novamente.'),{status:409})
}
module.exports=async function(req,res){
res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');
try{
if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Método inválido.'})}
const origin=req.headers.origin;if(req.method==='POST'&&origin&&new URL(origin).host!==req.headers.host)return res.status(403).json({error:'Origem inválida.'});
let body=req.body||{};if(typeof body==='string'){if(body.length>2048)return res.status(413).json({error:'Pedido muito grande.'});body=JSON.parse(body)}
if(JSON.stringify(body).length>2048)return res.status(413).json({error:'Pedido muito grande.'});
const cookie=String(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('apex_pilot='))?.slice(11);
const now=Date.now(),id=crypto.randomUUID(),key=crypto.randomBytes(32).toString('hex');let newSession=false;
const result=await transaction(db=>{
M.settle(db,now);let p=M.authenticate(db,cookie);
if(req.method==='POST'){
if(body.action==='register'){if(!p){p=M.register(db,{id,key,name:body.name,ip:String(req.headers['x-forwarded-for']||'unknown').split(',')[0]},now);newSession=true}}
else{
if(!p)throw Object.assign(new Error('Crie seu perfil de piloto.'),{status:401});
if(now-p.lastAction<1200)throw Object.assign(new Error('Aguarde um instante.'),{status:429});
if(body.action==='join')M.join(db,p,body,now,id);
else if(body.action==='leave')M.leave(db,p);
else throw Object.assign(new Error('Ação inválida.'),{status:400});p.lastAction=now
}}
return M.view(db,p,req.query?.sort||body.sort,now)
});
if(newSession)res.setHeader('Set-Cookie','apex_pilot='+id+'.'+key+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000');
return res.status(200).json(result)
}catch(e){const status=e.status||500;return res.status(status).json({error:status===500?'Não foi possível acessar o ranked. Tente novamente.':e.message})}
};

