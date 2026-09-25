/* Tutu public search URL builder for India Landing. */
(function(){
  'use strict';

  const countrySlug={
    RU:'russia',IN:'india',KZ:'kazakhstan',UZ:'uzbekistan',KG:'kirgizstan',TJ:'tadjikistan',
    AM:'armenia',AZ:'azerbaijan',BY:'belarus',MD:'moldova',TM:'turkmenistan',GE:'georgia',
    CN:'china',AE:'united_arab_emirates',QA:'qatar',TR:'turkey'
  };

  const HOME='https://www.tutu.ru/';
  // No unverified spelling is ever emitted as a destination URL.
  const destinations=window.TUTU_DESTINATIONS||{flight:{},train:{},bus:{},hotel:{}};
  const aviaId=Object.fromEntries(Object.entries(destinations.flight).map(([id,d])=>[id,d[1]]));
  const hotelGeoId=Object.fromEntries(Object.entries(destinations.hotel).filter(([,d])=>d[2]).map(([id,d])=>[id,d[2]]));

  const railCountries=new Set(['RU','BY','KZ','UZ','KG','TJ','AM','AZ','MD','GE']);

  /*
   * Curated mixed-mode entry points discovered on Tutu's public bus search.
   * These are deliberately allowlisted, not inferred: all 20 Delhi <-> university-city
   * pairs were live-checked in both directions on 2026-09-24.
   */
  const COMPOSITE_HUB='in-delhi';
  const compositeCities={
    'in-delhi':{slug:'Deli_2098491',geo:2098491},
    'ru-tver':{slug:'Tver',geo:1369087},
    'ru-ryazan':{slug:'Ryazan',geo:1312827},
    'ru-smolensk':{slug:'Smolensk',geo:1403603},
    'ru-tula':{slug:'Tula',geo:1422403},
    'ru-oryol':{slug:'Oryol',geo:1407808},
    'ru-belgorod':{slug:'Belgorod',geo:1414841},
    'ru-kursk':{slug:'Kursk',geo:1416451},
    'ru-voronezh':{slug:'Voronezh',geo:1381189},
    'ru-rostov-on-don':{slug:'Rostov-na-Donu',geo:1391657},
    'ru-yoshkar-ola':{slug:'Joshkar-Ola',geo:1356140},
    'ru-cheboksary':{slug:'Cheboksary',geo:1352828},
    'ru-saransk':{slug:'Saransk',geo:1432621},
    'ru-penza':{slug:'Penza',geo:1393941},
    'ru-pskov':{slug:'Pskov',geo:1360894},
    'ru-yaroslavl':{slug:'Yaroslavl',geo:1397799},
    'ru-ivanovo':{slug:'Ivanovo',geo:1444796},
    'ru-tambov':{slug:'Tambov',geo:1382947},
    'ru-ulyanovsk':{slug:'Ulyanovsk',geo:1351868},
    'ru-arkhangelsk':{slug:'Arhangelsk',geo:1339817},
    'ru-saratov':{slug:'Saratov',geo:1433947}
  };


  function asciiWords(value){
    return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,' ').trim().split(/\s+/).filter(Boolean);
  }
  function fallbackSlug(place,separator='-'){
    return asciiWords(place&&place.canonical).join(separator);
  }
  function aviaSlug(place){return place?(destinations.flight[place.id]?.[0]||fallbackSlug(place,'-')):''}
  function railSlug(place){return place?(destinations.train[place.id]||fallbackSlug(place,'-')):''}
  function hotelSlug(place){return place?(destinations.hotel[place.id]?.[1]||fallbackSlug(place,'_').toLowerCase()):''}

  function pad(n){return String(n).padStart(2,'0')}
  function iso(d){return d?d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()):''}
  function dotted(d){return d?pad(d.getDate())+'.'+pad(d.getMonth()+1)+'.'+d.getFullYear():''}
  function compact(d){return d?pad(d.getDate())+pad(d.getMonth()+1)+d.getFullYear():''}
  function passengerData(s){
    const adults=Number(s.adults??1),children=Number(s.children??0);
    if(!Number.isInteger(adults)||adults<1||!Number.isInteger(children)||children<0||adults+children>9)fail('passengers');
    const ages=(s.childAges||[]).slice(0,children).map(Number);
    if(ages.length!==children||ages.some(age=>!Number.isInteger(age)||age<0||age>17))fail('passengers');
    return {adults,children,ages};
  }
  function total(s){const p=passengerData(s);return p.adults+p.children}
  function travelerToken(s){const p=passengerData(s);return [p.adults,...p.ages].join('.')}
  function requireDate(value,code){
    if(!value||typeof value.getTime!=='function'||!Number.isFinite(value.getTime()))fail(code);
    const today=new Date();today.setHours(0,0,0,0);
    if(value<today)fail(code);
  }
  function requireValue(value,code){if(!value){const e=new Error(code);e.code=code;throw e}}
  function fail(code){const e=new Error(code);e.code=code;throw e}
  function unsupported(){fail('unsupported')}
  function samePlace(a,b){return !!(a&&b&&a.id&&b.id&&a.id===b.id)}
  function params(obj){
    const p=new URLSearchParams();
    Object.entries(obj).forEach(([k,v])=>{if(v!==undefined&&v!==null)p.set(k,String(v))});
    return p.toString();
  }

  function supports(mode,place){
    if(!place)return false;
    if(mode==='flight')return !!aviaSlug(place)&&Array.isArray(place.iata)&&place.iata.length>0;
    if(mode==='hotel')return !!countrySlug[place.country]&&!!hotelSlug(place);
    if(mode==='train'||mode==='bus')return railCountries.has(place.country)&&!!railSlug(place);
    return false;
  }

  function supportsCompositeEndpoint(place){
    return !!(place&&compositeCities[place.id]);
  }
  function supportsCompositePair(a,b){
    if(!a||!b||samePlace(a,b))return false;
    return (a.id===COMPOSITE_HUB&&!!compositeCities[b.id])||(b.id===COMPOSITE_HUB&&!!compositeCities[a.id]);
  }
  function supportsDirectPair(mode,a,b){
    if(!a||!b)return false;
    if(mode==='flight')return !!(destinations.flight[a.id]&&destinations.flight[b.id]);
    if(mode==='train')return !!(destinations.train[a.id]&&destinations.train[b.id]);
    if(mode==='bus'){
      return !!(destinations.bus[a.id]&&destinations.bus[b.id])||
        !!(destinations.train[a.id]&&destinations.train[b.id]);
    }
    return false;
  }
  function canRoute(mode,a,b){
    return supportsDirectPair(mode,a,b)||supportsCompositePair(a,b);
  }

  function buildHotel(s){
    requireValue(s.destination,'destination');
    requireDate(s.start,'hotelDates');requireDate(s.end,'hotelDates');
    if(s.end<=s.start)fail('hotelDates');
    const token=travelerToken(s),place=s.destination,d=destinations.hotel[place.id];
    if(!supports('hotel',place)||!d)return HOME;
    const q={check_in:iso(s.start),check_out:iso(s.end),details_params:''};
    if(d[2])q.geo_id=d[2];
    q.geo_name=(place.name&&place.name.ru)||place.canonical;
    q.geo_type='locality';q.resultId='';q['room[0]']=token;
    return 'https://hotel.tutu.ru/c_'+d[0]+'/'+d[1]+'/?'+params(q);
  }

  function routeState(s,mode){
    requireValue(s.from,'from');requireValue(s.to,'to');requireDate(s.date,'date');
    if(samePlace(s.from,s.to))fail('sameCity');
    const token=travelerToken(s);
    return supports(mode,s.from)&&supports(mode,s.to)?token:null;
  }
  function buildAvia(s){
    const token=routeState(s,'flight'),from=destinations.flight[s.from.id],to=destinations.flight[s.to.id];
    if(!token||!from||!to)return HOME;
    const q={class:s.cabin==='business'?'C':'Y',travelers:token};
    // No search_extension: it promises a hotels tab that only Tutu's own search opens.
    q['route[0]']=from[1]+'-'+compact(s.date)+'-'+to[1];
    // A return date turns the search into a round trip; Tutu reads it as the second leg.
    if(s.returnDate){
      requireDate(s.returnDate,'date');
      if(s.returnDate<s.date)fail('date');
      q['route[1]']=to[1]+'-'+compact(s.returnDate)+'-'+from[1];
    }
    return 'https://avia.tutu.ru/f/'+encodeURIComponent(from[0])+'/'+encodeURIComponent(to[0])+'/?'+params(q);
  }
  function buildTrain(s){
    const token=routeState(s,'train'),from=destinations.train[s.from.id],to=destinations.train[s.to.id];
    if(!token||!from||!to)return HOME;
    return 'https://www.tutu.ru/poezda/'+encodeURIComponent(from)+'/'+encodeURIComponent(to)+'/?'+params({date:dotted(s.date),travelers:token});
  }
  function buildBus(s){
    const token=routeState(s,'bus'),from=destinations.bus[s.from.id],to=destinations.bus[s.to.id];
    if(!token)return HOME;
    if(!from||!to){
      // The previously agreed rail fallback keeps the date and passenger ages.
      // If neither mapping is known, buildTrain safely returns the official home.
      return buildTrain(s);
    }
    return 'https://bus.tutu.ru/raspisanie/gorod_'+encodeURIComponent(from[0])+'/gorod_'+encodeURIComponent(to[0])+'/?'+params({from:from[1],to:to[1],date:dotted(s.date),travelers:token,amount:total(s)});
  }

  function buildComposite(s){
    requireValue(s.from,'from');requireValue(s.to,'to');requireDate(s.date,'date');
    if(samePlace(s.from,s.to))fail('sameCity');
    if(!supportsCompositePair(s.from,s.to))return HOME;
    const token=travelerToken(s),from=compositeCities[s.from.id],to=compositeCities[s.to.id];
    return 'https://bus.tutu.ru/raspisanie/gorod_'+encodeURIComponent(from.slug)+'/gorod_'+encodeURIComponent(to.slug)+'/?'+
      params({from:from.geo,to:to.geo,date:dotted(s.date),travelers:token,amount:total(s)});
  }

  function build(mode,state){
    if(mode==='hotel')return buildHotel(state);
    let direct;
    if(mode==='flight')direct=buildAvia(state);
    else if(mode==='train')direct=buildTrain(state);
    else if(mode==='bus')direct=buildBus(state);
    else unsupported();
    if(direct!==HOME)return direct;
    return buildComposite(state);
  }

  function isExact(mode,state){
    if(!state)return false;
    if(mode==='hotel')return !!(state.destination&&destinations.hotel[state.destination.id]);
    const table=destinations[mode];
    return !!(table&&state.from&&state.to&&table[state.from.id]&&table[state.to.id]);
  }

  const messages={
    ru:{passengers:'Проверьте число пассажиров и возраст детей.',from:'Выберите город отправления из подсказок.',to:'Выберите город назначения из подсказок.',destination:'Выберите город из подсказок.',date:'Выберите дату поездки.',hotelDates:'Выберите корректные даты заезда и выезда.',sameCity:'Города отправления и назначения должны отличаться.',unsupported:'Для этого вида транспорта выбранный город пока не поддерживается.'},
    en:{passengers:'Check the number of travellers and the ages of children.',from:'Select the departure city from the suggestions.',to:'Select the destination city from the suggestions.',destination:'Select a city from the suggestions.',date:'Select a travel date.',hotelDates:'Select valid check-in and check-out dates.',sameCity:'Departure and destination cities must be different.',unsupported:'This city is not available for the selected transport yet.'},
    hi:{passengers:'यात्रियों की संख्या और बच्चों की उम्र जाँचें।',from:'सुझावों में से प्रस्थान शहर चुनें।',to:'सुझावों में से गंतव्य शहर चुनें।',destination:'सुझावों में से शहर चुनें।',date:'यात्रा की तारीख़ चुनें।',hotelDates:'चेक-इन और चेक-आउट की सही तारीखें चुनें।',sameCity:'प्रस्थान और गंतव्य शहर अलग होने चाहिए।',unsupported:'चुने गए यात्रा साधन के लिए यह शहर अभी उपलब्ध नहीं है।'}
  };
  function message(code,lang){const l=messages[lang]||messages.ru;return l[code]||l.unsupported}

  window.TUTU_LINKS={build,buildComposite,message,supports,supportsCompositeEndpoint,supportsCompositePair,supportsDirectPair,canRoute,isExact,aviaSlug,railSlug,hotelSlug,travelerToken,aviaId,hotelGeoId,countrySlug,destinations,compositeCities};
})();
