/* Offline regression: exchange-rate overrides, tomorrow-only supplier prices,
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

function load(daily,DateImpl=Date){
 const context={window:{TUTU_DAILY_PRICES:daily},Date:DateImpl,Intl};
 vm.runInNewContext(engine,context,{filename:'assets/pricing.js'});
 return context.window.TUTU_PRICING;
}
const sample=load({});
const currentMsk=sample.moscowDate(),tomorrow=sample.nextDate(currentMsk);
assert.match(currentMsk,/^\d{4}-\d{2}-\d{2}$/);
assert.equal(sample.rubToInr(),1.12888);
assert.equal(sample.basePrice('hotels','h1','5 931'),5931);
assert.equal(sample.discountRub('hotel',4000),600);
assert.equal(sample.discountRub('hotel',30000),3000);
assert.equal(sample.discountRub('flight',19668),1000);
assert.equal(sample.discountRub('train',19668),0);

const quotes={
 fx:{rubToInr:1.13792052,rateDate:'2026-10-10'},
 quotes:{for:tomorrow,currency:'RUB',hotels:{h1:9000},routes:{r2:19000}}
};
const live=load(quotes);
assert.equal(live.rubToInr(),1.13792052);
assert.equal(live.basePrice('hotels','h1',5931),9000);
assert.equal(live.reducedRub('hotel',9000),7650);
assert.equal(live.basePrice('routes','r2',19668),19000);
assert.equal(live.reducedRub('flight',19000),18000);
assert.equal(live.basePrice('routes','r1',831),831,'no unrelated price changes');

const stale=load({...quotes,quotes:{...quotes.quotes,for:currentMsk}});
assert.equal(stale.basePrice('hotels','h1',5931),5931,'never quote prices for a mismatched date');
const unsupported=load({fx:{rubToInr:-20},quotes:{...quotes.quotes,currency:'USD'}});
assert.equal(unsupported.rubToInr(),1.12888);
assert.equal(unsupported.basePrice('hotels','h1',5931),5931);

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
 assert.match(html,/assets\/tour-form\.js\?v=[\w-]+/);
 const start=html.indexOf('const CONFIG = ');
 assert.ok(start!==-1,'CONFIG exists for '+page);
 const scriptEnd=html.indexOf('</script>',start);
 assert.ok(scriptEnd>start);
 new vm.Script(html.slice(start,scriptEnd),{filename:page});
}
// The bot must not be blocked by an outdated static asset cache version.
const workflow=fs.readFileSync(path.join(root,'.github/workflows/update-market-data.yml'),'utf8');
assert.match(workflow,/- cron: '0 \*\/3 \* \* \*'/,
  'market-data workflow should run every 3 hours (UTC and Moscow intervals match)');
assert.match(workflow,/python scripts\/scrape-public-prices\.py --out/,
  'scheduled job must still perform the 27 public booking searches');
const tourJs=fs.readFileSync(path.join(root,'assets/tour-form.js'),'utf8');
assert.match(tourJs,/function departureCountryName\(d\)/);
assert.match(tourJs,/data-tour-date/);
assert.match(tourJs,/esc\(departureCountryName\(d\)\)/);
console.log('Daily market-data and tour UI checks: OK');
