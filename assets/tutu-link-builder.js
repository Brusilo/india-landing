/* Tutu public search URL builder for India Landing. */
(function(){
  'use strict';

  const countrySlug={
    RU:'russia',IN:'india',KZ:'kazakhstan',UZ:'uzbekistan',KG:'kirgizstan',TJ:'tadjikistan',
    AM:'armenia',AZ:'azerbaijan',BY:'belarus',MD:'moldova',TM:'turkmenistan',GE:'georgia',
    CN:'china',AE:'united_arab_emirates',QA:'qatar',TR:'turkey'
  };

  const aviaId={
    'ru-moscow':491,
    'ru-saint-petersburg':75,
    'ru-sochi':78,
    'ru-kazan':33,
    'ru-yekaterinburg':29,
    'ru-novosibirsk':58,
    'ru-irkutsk':31,
    'ru-anapa':10,
    'ru-chelyabinsk':98,
    'ru-krasnodar':39,
    'in-delhi':216,
    'ae-dubai':230,
    'tr-istanbul':419,
    'am-yerevan':236,
    'az-baku':136,
    'qa-doha':227,
    'kg-osh':358
  };

  const hotelGeoId={
    'ru-moscow':2657260,
    'in-delhi':2657045,
    'az-baku':2656975,
    'qa-doha':2657053
  };

  const aviaSlugOverride={
    'ru-moscow':'Moskva',
    'ru-saint-petersburg':'Sankt-peterburg',
    'ru-yekaterinburg':'Ekaterinburg',
    'ru-mineralnye-vody':'Mineralnie_vodi',
    'ru-yoshkar-ola':'Yoshkar-ola',
    'ru-gorno-altaysk':'Gorno-altaysk',
    'ru-ulan-ude':'Ulan-ude',
    'ru-petropavlovsk-kamchatsky':'Petropavlovsk-Kamchatskiy',
    'ru-yuzhno-sakhalinsk':'Yuzhno-Sakhalinsk',
    'in-delhi':'Deli',
    'in-bengaluru':'Bangalore',
    'in-kolkata':'Kolkata',
    'in-thiruvananthapuram':'Trivandrum',
    'in-kozhikode':'Kozhikode',
    'ae-dubai':'Dubay',
    'tr-istanbul':'Stambul',
    'am-yerevan':'Erevan'
  };

  const railSlugOverride={
    'ru-moscow':'Moskva',
    'ru-saint-petersburg':'Sankt-Peterburg',
    'ru-yekaterinburg':'Ekaterinburg',
    'ru-mineralnye-vody':'Mineralnie_vodi',
    'ru-yoshkar-ola':'Yoshkar-Ola',
    'ru-gorno-altaysk':'Gorno-Altaysk',
    'ru-ulan-ude':'Ulan-Ude',
    'ru-petropavlovsk-kamchatsky':'Petropavlovsk-Kamchatskiy',
    'ru-yuzhno-sakhalinsk':'Yuzhno-Sakhalinsk'
  };

  const hotelSlugOverride={
    'ru-moscow':'moscow',
    'ru-saint-petersburg':'saint_petersburg',
    'in-delhi':'delhi',
    'in-mumbai':'mumbai',
    'in-bengaluru':'bangalore'
  };

  const railCountries=new Set(['RU','BY','KZ','UZ','KG','TJ','AM','AZ','MD','GE']);

  function asciiWords(value){
    return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,' ').trim().split(/\s+/).filter(Boolean);
  }
  function fallbackSlug(place,separator='-'){
    return asciiWords(place&&place.canonical).join(separator);
  }
  function aviaSlug(place){
    if(!place)return '';
    return aviaSlugOverride[place.id]||fallbackSlug(place,'-');
  }
  function railSlug(place){
    if(!place)return '';
    return railSlugOverride[place.id]||fallbackSlug(place,'-');
  }
  function hotelSlug(place){
    if(!place)return '';
    if(hotelSlugOverride[place.id])return hotelSlugOverride[place.id];
    return asciiWords(place.canonical).map(x=>x.toLowerCase()).join('_');
  }

  function pad(n){return String(n).padStart(2,'0')}
  function iso(d){return d?d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()):''}
  function dotted(d){return d?pad(d.getDate())+'.'+pad(d.getMonth()+1)+'.'+d.getFullYear():''}
  function compact(d){return d?pad(d.getDate())+pad(d.getMonth()+1)+d.getFullYear():''}
  function total(s){return Math.max(1,Number(s.adults||0)+Number(s.children||0))}
  function travelerToken(s){
    const adults=Math.max(1,Number(s.adults||1));
    const count=Math.max(0,Number(s.children||0));
    const ages=(s.childAges||[]).slice(0,count).map(x=>Math.max(0,Math.min(17,Number(x))));
    while(ages.length<count)ages.push(5);
    return [adults].concat(ages).join('.');
  }
  function requireValue(value,code){if(!value){const e=new Error(code);e.code=code;throw e}}
  function unsupported(){const e=new Error('unsupported');e.code='unsupported';throw e}
  function params(obj){
    const p=new URLSearchParams();
    Object.entries(obj).forEach(([k,v])=>{if(v!==undefined&&v!==null)p.set(k,String(v))});
    return p.toString();
  }

  function supports(mode,place){
    if(!place)return false;
    if(mode==='flight')return !!aviaSlug(place);
    if(mode==='hotel')return !!countrySlug[place.country]&&!!hotelSlug(place);
    if(mode==='train'||mode==='bus')return railCountries.has(place.country)&&!!railSlug(place);
    return false;
  }

  function buildHotel(s){
    requireValue(s.destination,'destination');
    requireValue(s.start,'hotelDates');
    requireValue(s.end,'hotelDates');
    const place=s.destination;
    if(!supports('hotel',place))unsupported();
    const q={check_in:iso(s.start),check_out:iso(s.end),details_params:''};
    if(hotelGeoId[place.id])q.geo_id=hotelGeoId[place.id];
    q.geo_name=(place.name&&place.name.ru)||place.canonical;
    q.geo_type='locality';
    q.resultId='';
    q['room[0]']=total(s);
    return 'https://hotel.tutu.ru/c_'+countrySlug[place.country]+'/'+hotelSlug(place)+'/?'+params(q);
  }

  function buildAvia(s){
    requireValue(s.from,'from');
    requireValue(s.to,'to');
    requireValue(s.date,'date');
    if(!supports('flight',s.from)||!supports('flight',s.to))unsupported();
    const q={class:s.cabin==='business'?'C':'Y',travelers:travelerToken(s)};
    const fromId=aviaId[s.from.id],toId=aviaId[s.to.id];
    if(fromId&&toId){
      q['route[0]']=fromId+'-'+compact(s.date)+'-'+toId;
      q.search_extension='avia';
    }
    return 'https://avia.tutu.ru/f/'+encodeURIComponent(aviaSlug(s.from))+'/'+encodeURIComponent(aviaSlug(s.to))+'/?'+params(q);
  }

  function buildRailLike(s){
    requireValue(s.from,'from');
    requireValue(s.to,'to');
    requireValue(s.date,'date');
    if(!supports('train',s.from)||!supports('train',s.to))unsupported();
    const q={date:dotted(s.date),travelers:travelerToken(s)};
    return 'https://www.tutu.ru/poezda/'+encodeURIComponent(railSlug(s.from))+'/'+encodeURIComponent(railSlug(s.to))+'/?'+params(q);
  }

  function buildTrain(s){return buildRailLike(s)}
  function buildBus(s){return buildRailLike(s)}

  function build(mode,state){
    if(mode==='hotel')return buildHotel(state);
    if(mode==='flight')return buildAvia(state);
    if(mode==='train')return buildTrain(state);
    if(mode==='bus')return buildBus(state);
    unsupported();
  }

  function isExact(mode,state){
    if(mode==='flight')return !!(state&&state.from&&state.to&&aviaId[state.from.id]&&aviaId[state.to.id]);
    return true;
  }

  const messages={
    ru:{from:'Выберите город отправления из подсказок.',to:'Выберите город назначения из подсказок.',destination:'Выберите город из подсказок.',date:'Выберите дату поездки.',hotelDates:'Выберите даты заезда и выезда.',unsupported:'Для этого вида транспорта выбранный город пока не поддерживается.'},
    en:{from:'Select the departure city from the suggestions.',to:'Select the destination city from the suggestions.',destination:'Select a city from the suggestions.',date:'Select a travel date.',hotelDates:'Select check-in and check-out dates.',unsupported:'This city is not supported for the selected transport yet.'},
    hi:{from:'सुझावों में से प्रस्थान शहर चुनें।',to:'सुझावों में से गंतव्य शहर चुनें।',destination:'सुझावों में से शहर चुनें।',date:'यात्रा की तारीख चुनें।',hotelDates:'चेक-इन और चेक-आउट की तारीखें चुनें।',unsupported:'चुने गए परिवहन के लिए यह शहर अभी समर्थित नहीं है।'}
  };
  function message(code,lang){const l=messages[lang]||messages.ru;return l[code]||l.unsupported}

  window.TUTU_LINKS={build,message,supports,isExact,aviaSlug,railSlug,hotelSlug,travelerToken,aviaId,hotelGeoId,countrySlug};
})();
