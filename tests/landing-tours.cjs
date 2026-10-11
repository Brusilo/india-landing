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
// Match a real Tutu -> Travelata reference: SPB to Egypt, 1 adult,
// 2 children aged 5 and 8. Verify both independently parsed URL sections.
const family=catalogue.build({
  ...state,departure:'spb',destination:'egypt',
  adults:1,children:2,childAges:[5,8]
});
eq(family.filtered,true,'two-child country link is supported');
const familyUrl=new URL(family.url);
const fq=familyUrl.searchParams,fh=new URLSearchParams(familyUrl.hash.slice(2));
eq(fq.get('departure'),'1','SPB departure for family');
eq(fq.get('arrival_id'),'29','Egypt country for family');
eq(fq.get('adults'),'1','1 adult still passed');
eq(fq.get('children'),'2','2 children in query');
eq(fq.get('ages[0]'),'5','first indexed age in query');
eq(fq.get('ages[1]'),'8','second indexed age in query');
eq(fh.get('fromCity'),'1','SPB in hash');
eq(fh.get('toCountry'),'29','Egypt in hash');
eq(fh.get('adults'),'1','adult in hash');
eq(fh.get('kids'),'2','children count in hash');
eq(fh.getAll('ages[]').join(','),'5,8','repeatable ages in hash in order');
eq(familyUrl.hash.includes('ages[]=5&ages[]=8'),true,'hash keeps native bracket syntax');
eq(fq.get('date_begin'),partnerDate,'family date retained');
eq(fh.get('nightFrom'),'7','family nights minimum retained');
eq(fh.get('nightTo'),'14','family nights maximum retained');

const resortFamily=catalogue.build({
  ...state,departure:'moscow',destination:'baikal',
  children:3,childAges:[0,5,17]
});
const rfu=new URL(resortFamily.url);
eq(resortFamily.filtered,true,'resort with three children supported');
eq(rfu.searchParams.get('resorts[]'),'3997','resort ID with children');
eq(rfu.searchParams.get('ages[0]'),'0','infant age 0');
eq(rfu.searchParams.get('ages[2]'),'17','maximum tour child age 17');
eq(new URLSearchParams(rfu.hash.slice(2)).getAll('ages[]').join(','),'0,5,17',
  'three child ages repeated in hash');
const childless=new URL(catalogue.build({...state,children:0,childAges:[]}).url);
eq(childless.searchParams.has('children'),false,'omit children query when none');
eq(childless.searchParams.has('ages[0]'),false,'omit age query when none');
eq(new URLSearchParams(childless.hash.slice(2)).has('kids'),false,
  'omit kids from hash when none');
const badChildren=[
  {children:1,childAges:[]},
  {children:2,childAges:[5]},
  {children:1,childAges:[18]},
  {children:1,childAges:[-1]},
  {children:1,childAges:[4.5]},
  {children:1,childAges:[null]},
  {children:4,childAges:[5,5,5,5]},
];
for(const invalid of badChildren){
  assert.throws(()=>catalogue.build({...state,...invalid}),
    /Invalid tour search/,'reject mismatched or invalid child age input');
  assertions++;
}
eq(catalogue.build({...state,departure:'rostov-on-don'}).url,null,'unverified departure must not be silently changed');
console.log('Tours URL regression assertions passed:',assertions);
