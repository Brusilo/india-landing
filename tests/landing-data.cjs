/* Run: node tests/landing-data.cjs [site-root] [report.json] */
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const ctx={window:{},document:{documentElement:{lang:'ru'}},URLSearchParams,console};vm.createContext(ctx);
for(const f of ['search-places.js','tutu-destinations.js','tutu-link-builder.js'])vm.runInContext(fs.readFileSync(path.join(root,'assets',f),'utf8'),ctx,{filename:f});
const {TUTU_PLACES:P,TUTU_LINKS:L}=ctx.window;
let assertions=0;const ok=(x,m)=>{assert.ok(x,m);assertions++};
const eq=(a,b,m)=>{assert.equal(a,b,m);assertions++};
const today=new Date();today.setHours(0,0,0,0);const tomorrow=new Date(today);tomorrow.setDate(today.getDate()+1);const end=new Date(tomorrow);end.setDate(end.getDate()+1);
const moscow=P.byId.get('ru-moscow'),delhi=P.byId.get('in-delhi');
const state=p=>({from:p,to:p.id===moscow.id?delhi:moscow,destination:p,date:tomorrow,start:tomorrow,end,adults:3,children:1,childAges:[6],cabin:'business'});
eq(P.places.length,P.byId.size,'unique stable city IDs');
let names=0,links=0;const coverage={},resolved={},fallbacks={};
for(const p of P.places){
 for(const lang of ['ru','en','hi']){
  ok(p.name[lang]?.trim(),p.id+' '+lang+' label');
  for(const q of [p.name[lang],p.name[lang].toLowerCase(),p.name[lang].toUpperCase()]){
   eq(P.search(q)[0]?.id,p.id,'top result '+q);eq(P.resolveExact('  '+q+'  ')?.id,p.id,'exact resolve '+q);names++;
  }
  ok(/\p{Script=Cyrillic}/u.test(p.name.ru),p.id+' RU script');
  ok(/\p{Script=Devanagari}/u.test(p.name.hi),p.id+' HI script');
 }
 for(const mode of ['flight','train','bus','hotel']){
  if(!L.supports(mode,p))continue;
  const s=state(p);if((mode==='train'||mode==='bus')&&p.id===moscow.id)s.to=P.byId.get('ru-kazan');
  const url=L.build(mode,s),u=new URL(url);
  ok(['avia.tutu.ru','www.tutu.ru','bus.tutu.ru','hotel.tutu.ru'].includes(u.hostname),'official destination');
  ok(!/undefined|null|NaN|<|>|\s/.test(url),'well-formed URL '+p.id);
  ok(!/[^\x00-\x7F]/.test(u.pathname),'route uses canonical ASCII slug');
  for(const lang of ['ru','en','hi']){
   eq(L.build(mode,{...s,from:P.resolveExact(s.from.name[lang]),to:P.resolveExact(s.to.name[lang]),destination:P.resolveExact(p.name[lang])}),url,'locale-invariant URL '+p.id);links++;
  }
  coverage[mode]=(coverage[mode]||0)+1;const counts=L.isExact(mode,s)?resolved:fallbacks;counts[mode]=(counts[mode]||0)+1;
  if(mode==='flight'&&L.isExact(mode,s))ok(u.searchParams.get('route[0]'),'verified flight must carry date');
  if(mode==='bus'&&L.isExact(mode,s)){eq(u.searchParams.get('travelers'),'3.6','bus age');eq(u.searchParams.get('amount'),'4','bus total');ok(u.searchParams.get('date'),'bus date')}
  if(mode==='hotel'&&L.isExact(mode,s))eq(u.searchParams.get('room[0]'),'3.6','hotel adult/child ages');
 }
}
const aliases={'St Petersburg':'ru-saint-petersburg','New Delhi':'in-delhi','Nizhniy Novgorod':'ru-nizhny-novgorod','Mineral Waters':'ru-mineralnye-vody','Bangalore':'in-bengaluru','Adler':'ru-adler','Deli':'in-delhi','Kalkutta':'in-kolkata','\u043c\u043e\u0441\u043a\u0432\u0430':'ru-moscow','\u043e\u0440\u0435\u043b':'ru-oryol'};
for(const [q,id] of Object.entries(aliases)){eq(P.resolveExact(q)?.id,id,'alias '+q);eq(P.search(q)[0]?.id,id,'alias ranking '+q)}
eq(P.resolveExact('Adler',p=>L.supports('flight',p))?.id,'ru-sochi','Adler airport alias only for flights');
eq(P.resolveExact('A completely unknown city'),null,'unknown exact city');
eq(P.search('x'.repeat(10000)).length,0,'long paste is bounded');
eq(P.search('<script>alert(1)</script>').length,0,'HTML input is not a city');
eq(P.search('Goa').length,1,'short query does not offer unrelated fuzzy matches');
const bad=[null,new Date(NaN),'2026-09-20',new Date(2020,0,1)];
for(const d of bad)for(const mode of ['flight','train','bus','hotel']){
 assert.throws(()=>L.build(mode,{...state(delhi),date:d,start:d}),e=>['date','hotelDates'].includes(e.code));assertions++;
}
for(const mode of ['flight','train','bus']){assert.throws(()=>L.build(mode,{...state(moscow),to:moscow}),e=>e.code==='sameCity');assertions++;}
for(const s of [{adults:0},{adults:1.2},{adults:10},{children:-1},{children:2,childAges:[3]},{childAges:[NaN]},{childAges:[18]}]){assert.throws(()=>L.travelerToken({...state(moscow),...s}),e=>e.code==='passengers');assertions++;}
eq(L.travelerToken({adults:3,children:2,childAges:[0,6]}),'3.0.6','infant and child ages retained');
const avia=new URL(L.build('flight',{...state(P.byId.get('ru-sochi')),to:moscow}));eq(avia.searchParams.get('class'),'C','business cabin');eq(avia.searchParams.get('travelers'),'3.6','flight travellers');ok(/^78-\d{8}-491$/.test(avia.searchParams.get('route[0]')),'flight route IDs and date');
const report={assertions,cityCount:P.places.length,nameVariants:names,localeInvariantLinks:links,coverage,resolved,fallbacks,verifiedAviaIds:Object.keys(L.aviaId).length,allPassed:true,externalAvailabilityTested:false};
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
