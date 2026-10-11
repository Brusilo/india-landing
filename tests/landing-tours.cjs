/* Regression tests for Tours deep links.
 * Run: node tests/landing-tours.cjs [repository-root]
 * Checks generated URL parameters; does not query the partner service.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const ctx={window:{},Date,URLSearchParams};
vm.createContext(ctx);
for(const filename of ['tour-public-options.js','tour-catalog.js']){
  vm.runInContext(fs.readFileSync(path.join(root,'assets',filename),'utf8'),ctx,{filename});
}
const catalogue=ctx.window.TUTU_TOURS;
const day=new Date();day.setDate(day.getDate()+2);
const date=[day.getFullYear(),String(day.getMonth()+1).padStart(2,'0'),String(day.getDate()).padStart(2,'0')].join('-');
const partnerDate=[date.slice(8),date.slice(5,7),date.slice(0,4)].join('.');
const state={departure:'moscow',destination:'baikal',date,nightsMin:7,nightsMax:14,adults:1,children:0,childAges:[]};
let assertions=0;
function eq(actual,expected,message){assert.equal(actual,expected,message);assertions++;}
function deepLink(destination,origin='moscow'){
  const result=catalogue.build({...state,departure:origin,destination});
  eq(result.filtered,true,destination+' uses filtered search');
  assert.ok(result.url.startsWith('https://web.tutu.travelata.ru/search/?'),destination+' must use Tutu Travelata search');assertions++;
  const u=new URL(result.url),q=u.searchParams,h=new URLSearchParams(u.hash.slice(2));
  eq(q.get('departure'),h.get('fromCity'),destination+' origin consistent');
  eq(q.get('arrival_id'),h.get('toCountry'),destination+' country consistent');
  eq(q.get('arrival_type'),'country',destination+' arrival_type');
  eq(q.get('date_begin'),partnerDate,destination+' dates');
  eq(q.get('date_end'),partnerDate,destination+' fixed date range');
  eq(h.get('dateFrom'),partnerDate,destination+' hash start date');
  eq(h.get('dateTo'),partnerDate,destination+' hash end date');
  eq(q.get('nights_min'),'7',destination+' minimum nights');
  eq(q.get('nights_max'),'14',destination+' maximum nights');
  eq(h.get('nightFrom'),'7',destination+' hash minimum nights');
  eq(h.get('nightTo'),'14',destination+' hash maximum nights');
  eq(q.get('adults'),'1',destination+' adults in query');
  eq(h.get('adults'),'1',destination+' adults in hash');
  eq(q.get('utm_source'),'tutu_main',destination+' attribution');
  eq(q.get('utm_content'),'tours_search_form',destination+' placement');
  assert.ok(!q.has('sid')&&!h.has('sid'),'Do not copy a sample session ID');assertions++;
  return {q,h};
}
for(const [key,id,country] of [
  ['baikal','3997','76'],['kaliningrad','1651','76'],
  ['karelia','3981','76'],['sheregesh','1615','76'],
  ['murmansk','1726','76'],['arkhyz','1660','76'],
  ['rosa-khutor','3158','76'],['antalya','2161','92'],
  ['goa','3280','33']
]){
  const {q,h}=deepLink(key);
  eq(q.get('resorts[]'),id,key+' resort query ID');
  eq(h.get('toCity'),id,key+' resort hash ID');
  eq(q.get('arrival_id'),country,key+' country');
}
const turkey=deepLink('turkey','spb');
eq(turkey.q.get('departure'),'1','Petersburg departure ID');
eq(turkey.q.get('arrival_id'),'92','Turkey country ID');
eq(turkey.q.get('resorts[]'),null,'country search does not filter a resort');
eq(turkey.h.get('toCity'),null,'country hash has no resort');
eq(deepLink('uzbekistan').q.get('arrival_id'),'94','country ID recovered from public directory');
for(const place of catalogue.destinations.filter(d=>d.kind==='place')){
  const {q,h}=deepLink(place.key);
  eq(q.get('resorts[]'),String(place.providerId),place.key+' exact public resort ID');
  eq(h.get('toCity'),String(place.providerId),place.key+' same ID in hash');
  eq(q.get('arrival_id'),String(catalogue.byKey.get(place.parent).id),place.key+' parent country');
}
for(const dest of ['teriberka','golden-ring','hurghada','sharm-el-sheikh','phuket','bali','dubai']){
  const result=catalogue.build({...state,destination:dest});
  eq(result.filtered,false,dest+' is not silently misdirected');
  eq(result.url,null,dest+' has no fabricated search URL');
}
eq(catalogue.build({...state,children:1,childAges:[7]}).url,null,'child ages must not be silently omitted');
eq(catalogue.build({...state,departure:'rostov-on-don'}).url,null,'unverified departure must not be silently changed');
console.log('Tours URL regression assertions passed:',assertions);
