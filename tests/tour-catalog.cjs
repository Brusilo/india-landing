/* Offline Tutu tours catalog URL and partner-ID safety regression tests.
   Canonical paths matched against the official Tutu directory, 11 Oct 2026.
   Run: node tests/tour-catalog.cjs */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const context={window:{},URLSearchParams,Date,Map,Number,String,Array,Object};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/tour-catalog.js'),'utf8'),context);
const api=context.window.TUTU_TOURS;
assert.ok(api);
const {destinations,departures,build,find}=api;
const types={};
for(const d of destinations){
  types[d.kind]=(types[d.kind]||0)+1;
  assert.deepEqual(Object.keys(d.name).sort(),['en','hi','ru'],d.key+' localized labels');
  assert.equal(d.id===null||Number.isInteger(d.id),true,d.key+' verified partner ID only');
  assert.ok(/^https:\/\/tours\.tutu\.ru\/(strana|rossiya)\//.test(d.browse),d.key+' Tutu URL');
}
assert.equal(types.country,45);
assert.equal(types.winter,27);
assert.equal(types.resort,9);
assert.equal(departures.length,14);
assert.equal(new Set(destinations.map(d=>d.key)).size,81);

const verifiedCountries={
  abkhazia:1,austria:3,andorra:4,armenia:6,belarus:11,bulgaria:13,
  vietnam:22,germany:24,greece:26,georgia:129,'dominican-republic':28,
  israel:32,india:33,indonesia:34,jordan:35,spain:38,italy:39,
  cyprus:43,china:44,cuba:48,maldives:56,malta:57,morocco:59,mexico:60,
  uae:68,portugal:75,russia:76,serbia:81,thailand:87,tunisia:91,
  turkey:92,france:99,croatia:101,montenegro:104,'czech-republic':105,
  srilanka:110,egypt:29
};
const unknownCountries=[
 'uzbekistan','kazakhstan','azerbaijan','kyrgyzstan',
 'japan','southkorea','tanzania','switzerland'
];
assert.equal(Object.keys(verifiedCountries).length,37);
for(const d of destinations.filter(d=>d.kind==='country')){
  const expected=Object.prototype.hasOwnProperty.call(verifiedCountries,d.key)
    ? verifiedCountries[d.key]:null;
  assert.equal(d.id,expected,d.key+' country ID from public Travelata constructor or branded sample');
}
assert.equal(destinations.filter(d=>d.kind==='country'&&d.id===null)
  .map(d=>d.key).sort().join(','),unknownCountries.slice().sort().join(','),
  '8 country IDs still unavailable in public Travelata options');


function pairs(s){return Object.fromEntries(s.trim().split(/\s+/).map(x=>x.split(':')))}
const countries=pairs(
 'russia:rossiya turkey:turkey egypt:egypt uae:united_arab_emirates thailand:thailand india:india maldives:maldives abkhazia:abkhazia uzbekistan:uzbekistan cuba:cuba '+
 'belarus:belarus kazakhstan:kazahstan georgia:georgia armenia:armeniya azerbaijan:azerbaydjan kyrgyzstan:kirgizstan vietnam:vietnam indonesia:indonesia srilanka:sri_lanka '+
 'china:china japan:japan southkorea:south_korea serbia:serbiya austria:austria andorra:andorra bulgaria:bulgaria germany:germany greece:greece '+
 'dominican-republic:dominican_republic israel:israel jordan:jordan spain:spain italy:italy cyprus:cyprus malta:malta morocco:morocco mexico:mexico portugal:portugal '+
 'tanzania:tanzaniya tunisia:tunisia france:france croatia:croatia montenegro:chernogoriya czech-republic:czech_republic switzerland:switzerland');
assert.equal(Object.keys(countries).length,45);
for(const d of destinations.filter(d=>d.kind==='country'))
  assert.equal(d.browse,'https://tours.tutu.ru/strana/'+countries[d.key]+'/',d.key+' canonical country URL');

const russia=pairs(
 'murmansk:murmansk teriberka:murmansk baikal:baikal saint-petersburg:saint_petersburg moscow:moscow karelia:karelia kazan:kazan sochi:sochi '+
 'krasnaya-polyana:krasnaya_polyana sheregesh:sheregesh arkhyz:arkhyz veliky-ustyug:veliky_ustyug altai:altai gorno-altaysk:gorno_altaysk '+
 'irkutsk:irkutsk listvyanka:listvyanka olkhon:olkhon kaliningrad:kaliningrad yakutsk:yakutsk suzdal:suzdal veliky-novgorod:veliky_novgorod '+
 'moscow-oblast:moscow_oblast golden-ring:golden_ring rosa-khutor:rosa_khutor dombay:dombay prielbrusie:prielbrusie kislovodsk:kislovodsk');
assert.equal(Object.keys(russia).length,27);
for(const d of destinations.filter(d=>d.kind==='winter'))
  assert.equal(d.browse,'https://tours.tutu.ru/strana/rossiya/kurort/'+russia[d.key]+'/',d.key+' canonical winter URL');

const resorts=pairs('antalya:turkey/antalya alanya:turkey/alanya istanbul:turkey/stambul hurghada:egypt/hurgada sharm-el-sheikh:egypt/sharm-el-sheyh phuket:thailand/phuket goa:india/goa bali:indonesia/bali dubai:united_arab_emirates/dubai');
assert.equal(Object.keys(resorts).length,9);
for(const d of destinations.filter(d=>d.kind==='resort'))
  assert.equal(d.browse,'https://tours.tutu.ru/strana/'+resorts[d.key].replace('/','/kurort/')+'/',d.key+' canonical resort URL');

assert.equal(find('goa')[0].key,'goa');
assert.equal(find('lake')[0].key,'baikal');
assert.equal(find('Казань')[0].key,'kazan');
assert.equal(find('गोवा')[0].key,'goa');
assert.equal(find('aurora')[0].key,'murmansk');
assert.equal(find('santa claus')[0].key,'veliky-ustyug','winter Santa search');
assert.equal(find('blue ice')[0].key,'baikal','Baikal ice search');
assert.equal(find('snowboarding')[0].key,'krasnaya-polyana','winter ski search');

const date=new Date();date.setDate(date.getDate()+9);
const future=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
const q=(departure,destination,children=0,childAges=[])=>({
 departure,destination,date:future,nightsMin:7,nightsMax:14,adults:2,children,childAges
});
const exact=build(q('moscow','turkey'));
assert.equal(exact.filtered,true);
const url=new URL(exact.url);
assert.equal(url.hostname,'web.tutu.travelata.ru');
assert.equal(url.searchParams.get('departure'),'2');
assert.equal(url.searchParams.get('arrival_id'),'92');
assert.equal(url.searchParams.get('nights_min'),'7');
assert.equal(url.searchParams.get('nights_max'),'14');
assert.equal(url.searchParams.get('sid'),null,'no copied sid');
assert.equal(new URLSearchParams(url.hash.slice(2)).get('toCountry'),'92');
assert.equal(build(q('spb','egypt')).filtered,true);
for(const [country,id] of [['russia',76],['india',33],['maldives',56],
                           ['uae',68],['thailand',87],['greece',26]]){
 const deep=build(q('moscow',country));
 assert.equal(deep.filtered,true,country+' expected to be a branded search');
 assert.equal(new URL(deep.url).searchParams.get('arrival_id'),String(id));
}
assert.equal(build(q('moscow','japan')).filtered,false,
  'unverified country must remain a Tutu browse link');

const kazan=build(q('kazan','murmansk'));
assert.equal(kazan.filtered,false);
assert.equal(kazan.departureApplied,true);
assert.equal(kazan.url,'https://tours.tutu.ru/rossiya/murmansk/iz/33_kazan/');
// Verified 7 winter destinations from each of 4 city origins (28/28 pages).
const winterOrigins={
 moscow:'491_moskva',spb:'75_sankt-peterburg',kazan:'33_kazan',
 ekaterinburg:'29_ekaterinburg'
};
const winterDestinations={
 baikal:'baikal',karelia:'karelia','krasnaya-polyana':'krasnaya_polyana',
 sheregesh:'sheregesh',altai:'altai',sochi:'sochi',
 'veliky-ustyug':'veliky_ustyug'
};
for(const [from,originSlug] of Object.entries(winterOrigins)){
 for(const [to,resortSlug] of Object.entries(winterDestinations)){
  const result=build(q(from,to));
  assert.equal(result.filtered,false,from+' to '+to+' is a public Tutu SEO page');
  assert.equal(result.departureApplied,true,from+' departure is preserved to '+to);
  assert.equal(result.url,
    'https://tours.tutu.ru/rossiya/'+resortSlug+'/iz/'+originSlug+'/',
    from+' to '+to+' uses exact verified Tutu URL');
 }
}
const unverifiedPair=build(q('samara','baikal'));
assert.equal(unverifiedPair.departureApplied,false,
  'Unverified city/resort combination must not fabricate a Tutu SEO route');
assert.equal(unverifiedPair.url,'https://tours.tutu.ru/strana/rossiya/kurort/baikal/');
const publicDepartureIds={
 moscow:2,spb:1,kazan:29,ekaterinburg:25,novosibirsk:53,samara:64,
 'nizhny-novgorod':50,irkutsk:28,perm:61,krasnodar:36,
 ufa:79,cheboksary:83,sochi:67,'rostov-on-don':null
};
for(const item of departures){
 assert.equal(item.id,publicDepartureIds[item.key],item.key+' must match public Travelata fromCity select');
}
assert.equal(Object.keys(publicDepartureIds).length,14);
const knownKazan=build(q('kazan','turkey'));
assert.equal(knownKazan.filtered,true,'Kazan ID comes from public Travelata selector');
assert.equal(new URL(knownKazan.url).searchParams.get('departure'),'29',
 'partner city ID must NOT be Kazan Tutu SEO code 33');
const unknownCity=build(q('rostov-on-don','turkey'));
assert.equal(unknownCity.filtered,false,'Rostov is absent from Travelata public departure list');
assert.equal(unknownCity.url,'https://tours.tutu.ru/strana/turkey/');
const noResort=build(q('moscow','goa'));
assert.equal(noResort.filtered,false);
assert.equal(noResort.url,'https://tours.tutu.ru/strana/india/kurort/goa/');
const family=build(q('moscow','egypt',2,[4,11]));
assert.equal(family.filtered,false);
assert.equal(family.reason,'children');
assert.throws(()=>build(q('moscow','egypt',1,[])));
assert.throws(()=>build({...q('moscow','egypt'),nightsMin:15,nightsMax:7}));
assert.throws(()=>build({...q('moscow','egypt'),nightsMax:30}),'Travelata supports up to 29 nights');
assert.throws(()=>build({...q('moscow','egypt'),adults:7}),'Travelata supports up to 6 adults');
assert.equal(build({...q('moscow','egypt'),nightsMax:29}).filtered,true,'29 nights accepted');
assert.equal(build({...q('moscow','egypt'),adults:6}).filtered,true,'6 adults accepted');
assert.throws(()=>build({...q('moscow','egypt'),date:'2025-09-01'}));
assert.throws(()=>build({...q('moscow','egypt'),departure:'unknown'}));
console.log('PASS Tutu catalog: 45 countries, 27 Russia, 9 resorts, 14 departures; verified paths and safe fallbacks');
