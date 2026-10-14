/* Offline regression: exchange-rate overrides, date-matched supplier prices,
 * price caps and promo expiration, plus all three language entrypoints.
 * Run: node tests/landing-pricing.cjs
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const engine=fs.readFileSync(path.join(root,'assets/pricing.js'),'utf8');

function load(daily,DateImpl=Date,extra={}){
 const context={window:{TUTU_DAILY_PRICES:daily,...extra},Date:DateImpl,Intl};
 vm.runInNewContext(engine,context,{filename:'assets/pricing.js'});
 return context.window.TUTU_PRICING;
}
function memoryStorage(seed){
 const data={...seed};
 return {getItem:k=>k in data?data[k]:null,setItem:(k,v)=>{data[k]=String(v)},data};
}
const sample=load({});
const currentMsk=sample.moscowDate(),tomorrow=sample.nextDate(currentMsk);
assert.match(currentMsk,/^\d{4}-\d{2}-\d{2}$/);
assert.equal(sample.rubToInr(),1.12888);
assert.equal(sample.basePrice('hotels','h1','5 931'),null,'never show illustrative old hotel prices');
assert.equal(sample.discountRub('hotel',4000),600);
assert.equal(sample.discountRub('hotel',30000),3000);
assert.equal(sample.discountRub('flight',19668),1000);
assert.equal(sample.discountRub('train',19668),0);

const near=sample.nextDate(sample.nextDate(sample.nextDate(tomorrow)));
const quotes={
 fx:{rubToInr:1.13792052,rateDate:'2026-10-10'},
 quotes:{for:tomorrow,currency:'RUB',hotels:{h1:9000},routes:{r2:19000},
   dates:{hotels:{h1:tomorrow},routes:{}}}
};
const live=load(quotes);
assert.equal(live.rubToInr(),1.13792052);
assert.equal(live.basePrice('hotels','h1',5931),9000);
assert.equal(live.reducedRub('hotel',9000),7650);
assert.equal(live.basePrice('routes','r2',19668),19000);
assert.equal(live.reducedRub('flight',19000),18000);
assert.equal(live.basePrice('routes','r1',831),null,'never fall back to invented sample');
assert.equal(live.quoteDate('hotels','h1'),tomorrow);
assert.equal(live.quoteDate('routes','r2'),tomorrow);
assert.equal(live.dateLabel('hotels','h1','ru'),'');
assert.equal(live.dateLabel('hotels','h1','en'),'');
assert.equal(live.dateLabel('hotels','h1','hi'),'');
assert.equal(live.dateLabel('routes','r2','ru'),'');
const nearby=load({...quotes,quotes:{...quotes.quotes,
  dates:{hotels:{h1:near},routes:{r2:near}}}});
assert.equal(nearby.basePrice('hotels','h1',5931),9000,'allow verified nearest-day prices');
assert.equal(nearby.basePrice('routes','r2',19668),19000,'allow verified nearby route fare');
assert.equal(nearby.quoteDate('hotels','h1'),near);
assert.equal(nearby.quoteDate('routes','r2'),near);
for(const locale of ['ru','en','hi']){
  assert.equal(nearby.dateLabel('hotels','h1',locale),'','never show date badges');
  assert.equal(nearby.dateLabel('routes','r2',locale),'','never show date badges');
}
const tooFar=Array.from({length:8}).reduce(d=>sample.nextDate(d),tomorrow);
const outside=load({...quotes,quotes:{...quotes.quotes,dates:{hotels:{h1:tooFar}}}});
assert.equal(outside.basePrice('hotels','h1',5931),null,'refuse dates beyond the week');
const yesterday=load({...quotes,quotes:{...quotes.quotes,dates:{hotels:{h1:currentMsk}}}});
assert.equal(yesterday.basePrice('hotels','h1',5931),null,'refuse dates before tomorrow');
const invalid=load({...quotes,quotes:{...quotes.quotes,dates:{hotels:{h1:'2031-01-01'}}}});
assert.equal(invalid.basePrice('hotels','h1',5931),null,'refuse mismatched future dates');

const stale=load({...quotes,quotes:{...quotes.quotes,for:currentMsk}});
assert.equal(stale.basePrice('hotels','h1',5931),null,'never reuse stale booking prices as current');
const unsupported=load({fx:{rubToInr:-20},quotes:{...quotes.quotes,currency:'USD'}});
assert.equal(unsupported.rubToInr(),1.12888);
assert.equal(unsupported.basePrice('hotels','h1',5931),null);

class FutureDate extends Date{
 constructor(...args){super(...(args.length?args:['2027-01-01T12:00:00+03:00']))}
 static now(){return Date.parse('2027-01-01T12:00:00+03:00')}
}
const expired=load(quotes,FutureDate);
assert.equal(expired.discountRub('hotel',9000),0,'expired hotel promo hidden');
assert.equal(expired.discountRub('flight',19000),0,'expired flight promo hidden');
for(const page of ['index-ru.html','index.html','index-hi.html']){
 const html=fs.readFileSync(path.join(root,page),'utf8');
 assert.match(html,/assets\/daily-prices\.js/);
 assert.match(html,/assets\/pricing\.js/);
 assert.match(html,/rubToInr: window\.TUTU_PRICING\.rubToInr\(\)/);
 assert.match(html,/window\.TUTU_PRICING\.basePrice\('routes'/);
 assert.match(html,/window\.TUTU_PRICING\.basePrice\('hotels'/);
 assert.match(html,/window\.TUTU_PRICING\.discountRub\('hotel'/);
 assert.doesNotMatch(html,/discountRub\('flight'/,'route cards must show the Tutu fare, not a promo price: '+page);
 assert.match(html,/const rub = hasQuote \? baseRub : null;/,'route card price is the undiscounted fare: '+page);
 assert.match(html,/assets\/tour-form\.js\?v=[\w-]+/);
 const start=html.indexOf('const CONFIG = ');
 assert.ok(start!==-1,'CONFIG exists for '+page);
 const scriptEnd=html.indexOf('</script>',start);
 assert.ok(scriptEnd>start);
 new vm.Script(html.slice(start,scriptEnd),{filename:page});
}
const cardLinks=fs.readFileSync(path.join(root,'assets/card-links.js'),'utf8');
assert.match(cardLinks,/date:quotedBookingDate\('routes',id\)/,
  'route links must use the date of their verified price');
assert.match(cardLinks,/const a=quotedBookingDate\('hotels',id\)/,
  'hotel links must use the date of their verified price');
// The bot must not be blocked by an outdated static asset cache version.
const workflow=fs.readFileSync(path.join(root,'.github/workflows/update-market-data.yml'),'utf8');
assert.match(workflow,/- cron: '17 \* \* \* \*'/,
  'market-data workflow should run hourly, off the top of the hour');
assert.match(workflow,/python scripts\/scrape-public-prices\.py --out/,
  'scheduled job must still perform the 27 public booking searches');
const tourJs=fs.readFileSync(path.join(root,'assets/tour-form.js'),'utf8');
assert.match(tourJs,/function departureCountryName\(d\)/);
assert.match(tourJs,/data-tour-date/);
assert.match(tourJs,/esc\(departureCountryName\(d\)\)/);

// INR rate from the CBR mirror, cached in the browser; the bot's rate is the fallback.
(async()=>{
 const KEY='tutu-inr-rate-v1';
 const botDaily={fx:{rubToInr:1.1,rateDate:'2026-10-13'}};
 const today=new Date().toISOString().slice(0,10);
 const mirror={Date:today+'T11:30:00+03:00',Valute:{INR:{Nominal:100,Value:88}}};
 const settle=()=>new Promise(r=>setTimeout(r,0));
 // A fresh cache with a later CBR date wins at once and is not re-fetched.
 let calls=0;
 const fetchStub=body=>()=>{calls++;return Promise.resolve({ok:true,json:()=>Promise.resolve(body)})};
 const freshCache=memoryStorage({[KEY]:JSON.stringify({rate:1.2,date:'2026-10-14',checkedAt:Date.now()})});
 const cached=load(botDaily,Date,{localStorage:freshCache,fetch:fetchStub(mirror)});
 assert.equal(cached.rubToInr(),1.2,'cached newer CBR rate wins over the bot');
 await settle();
 assert.equal(calls,0,'no API request while the cache is fresh');
 // An old cache date never beats a newer bot date.
 const oldCache=memoryStorage({[KEY]:JSON.stringify({rate:1.3,date:'2026-10-01',checkedAt:Date.now()})});
 assert.equal(load(botDaily,Date,{localStorage:oldCache}).rubToInr(),1.1,'bot wins with the later CBR date');
 // A stale cache asks the mirror, stores the answer and switches to it.
 const staleCache=memoryStorage({[KEY]:JSON.stringify({rate:1.2,date:'2026-10-13',checkedAt:Date.now()-7*3600e3})});
 calls=0;
 const refreshed=load(botDaily,Date,{localStorage:staleCache,fetch:fetchStub(mirror)});
 await settle();await settle();await settle();
 assert.equal(calls,1,'one API request once the cache is older than 6 hours');
 assert.equal(refreshed.rubToInr(),1.13636364,'mirror rate = Nominal / Value');
 assert.equal(JSON.parse(staleCache.data[KEY]).date,today,'mirror answer cached');
 // A malformed answer changes nothing.
 const broken=load(botDaily,Date,{localStorage:memoryStorage({}),fetch:fetchStub({Valute:{}})});
 await settle();await settle();await settle();
 assert.equal(broken.rubToInr(),1.1,'bad API answer keeps the bot rate');
 console.log('Daily market-data and tour UI checks: OK');
})().catch(e=>{console.error(e);process.exit(1)});
