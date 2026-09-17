/* Tutu public search URL builder for India Landing. */
(function(){
  'use strict';

  const countrySlug={
    RU:'russia',IN:'india',KZ:'kazakhstan',UZ:'uzbekistan',KG:'kirgizstan',TJ:'tadjikistan',
    AM:'armeniya',AZ:'azerbaydjan',BY:'belarus',MD:'moldova',TM:'turkmenistan',GE:'georgia',
    CN:'china',AE:'uae',QA:'qatar',TR:'turkey'
  };

  // Numeric IDs are added only when verified from current public Tutu URLs/examples.
  // The route path remains a working fallback for cities without a verified numeric ID.
  const aviaId={
    'ru-moscow':491,
    'ru-saint-petersburg':75,
    'ru-sochi':78,
    'ru-kazan':33,
    'ru-yekaterinburg':29,
    'in-delhi':216
  };

  const busId={
    'ru-moscow':1447874,
    'ru-gelendzhik':1447979,
    'ru-loo':2082727
  };

  const hotelGeoId={
    'ru-moscow':2657260,
    'in-delhi':2657045
  };

  const transportSlugOverride={
    'ru-moscow':'Moskva',
    'ru-saint-petersburg':'Sankt-Peterburg',
    'ru-yekaterinburg':'Ekaterinburg',
    'ru-nizhny-novgorod':'Nijniy_novgorod',
    'ru-mineralnye-vody':'Mineralnye_vody',
    'ru-yoshkar-ola':'Yoshkar-Ola',
    'ru-gorno-altaysk':'Gorno-Altaysk',
    'ru-ulan-ude':'Ulan-Ude',
    'ru-petropavlovsk-kamchatsky':'Petropavlovsk-Kamchatskiy',
    'ru-yuzhno-sakhalinsk':'Yuzhno-Sakhalinsk',
    'in-delhi':'Deli',
    'in-bengaluru':'Bangalore',
    'in-kolkata':'Kolkata',
    'in-thiruvananthapuram':'Trivandrum',
    'in-kozhikode':'Kozhikode'
  };

  const hotelSlugOverride={
    'ru-moscow':'moscow',
    'ru-saint-petersburg':'saint_petersburg',
    'in-delhi':'delhi',
    'in-mumbai':'mumbai',
    'in-bengaluru':'bangalore'
  };

  function asciiWords(value){
    return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,' ').trim().split(/\s+/).filter(Boolean);
  }
  function transportSlug(place){
    if(!place)return '';
    if(transportSlugOverride[place.id])return transportSlugOverride[place.id];
    return asciiWords(place.canonical).join('-');
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
  function params(obj){
    const p=new URLSearchParams();
    Object.entries(obj).forEach(([k,v])=>{if(v!==undefined&&v!==null)p.set(k,String(v))});
    return p.toString();
  }

  function buildHotel(s){
    requireValue(s.destination,'destination');requireValue(s.start,'hotelDates');requireValue(s.end,'hotelDates');
    const place=s.destination,country=countrySlug[place.country];requireValue(country,'unsupported');
    const q={check_in:iso(s.start),check_out:iso(s.end),details_params:''};
    if(hotelGeoId[place.id])q.geo_id=hotelGeoId[place.id];
    q.geo_name=(place.name&&place.name.ru)||place.canonical;
    q.geo_type='locality';q.resultId='';q['room[0]']=total(s);
    return 'https://hotel.tutu.ru/c_'+country+'/'+hotelSlug(place)+'/?'+params(q);
  }

  function buildAvia(s){
    requireValue(s.from,'from');requireValue(s.to,'to');requireValue(s.date,'date');
    const from=transportSlug(s.from),to=transportSlug(s.to);requireValue(from&&to,'unsupported');
    const q={class:s.cabin==='business'?'C':'Y',travelers:travelerToken(s)};
    if(aviaId[s.from.id]&&aviaId[s.to.id])q['route[0]']=aviaId[s.from.id]+'-'+compact(s.date)+'-'+aviaId[s.to.id];
    q.search_extension='avia';
    return 'https://avia.tutu.ru/f/'+encodeURIComponent(from)+'/'+encodeURIComponent(to)+'/?'+params(q);
  }

  function buildTrain(s){
    requireValue(s.from,'from');requireValue(s.to,'to');requireValue(s.date,'date');
    const q={date:dotted(s.date),travelers:travelerToken(s),search_extension:'train'};
    if(hotelGeoId[s.to.id])q.hotel_geo_id=hotelGeoId[s.to.id];
    return 'https://www.tutu.ru/poezda/'+encodeURIComponent(transportSlug(s.from))+'/'+encodeURIComponent(transportSlug(s.to))+'/?'+params(q);
  }

  function buildBus(s){
    requireValue(s.from,'from');requireValue(s.to,'to');requireValue(s.date,'date');
    const q={};
    if(busId[s.from.id])q.from=busId[s.from.id];
    if(busId[s.to.id])q.to=busId[s.to.id];
    q.date=dotted(s.date);q.travelers=travelerToken(s);q.amount=total(s);
    return 'https://bus.tutu.ru/raspisanie/gorod_'+encodeURIComponent(transportSlug(s.from))+'/gorod_'+encodeURIComponent(transportSlug(s.to))+'/?'+params(q);
  }

  function build(mode,state){
    if(mode==='hotel')return buildHotel(state);
    if(mode==='flight')return buildAvia(state);
    if(mode==='train')return buildTrain(state);
    if(mode==='bus')return buildBus(state);
    const e=new Error('unsupported');e.code='unsupported';throw e;
  }

  const messages={
    ru:{from:'Выберите город отправления из подсказок.',to:'Выберите город назначения из подсказок.',destination:'Выберите город из подсказок.',date:'Выберите дату поездки.',hotelDates:'Выберите даты заезда и выезда.',unsupported:'Для этого города пока не удалось собрать ссылку Туту.'},
    en:{from:'Select the departure city from the suggestions.',to:'Select the destination city from the suggestions.',destination:'Select a city from the suggestions.',date:'Select a travel date.',hotelDates:'Select check-in and check-out dates.',unsupported:'A Tutu link is not available for this city yet.'},
    hi:{from:'सुझावों में से प्रस्थान शहर चुनें।',to:'सुझावों में से गंतव्य शहर चुनें।',destination:'सुझावों में से शहर चुनें।',date:'यात्रा की तारीख चुनें।',hotelDates:'चेक-इन और चेक-आउट की तारीखें चुनें।',unsupported:'इस शहर के लिए Tutu लिंक अभी उपलब्ध नहीं है।'}
  };
  function message(code,lang){const l=messages[lang]||messages.ru;return l[code]||l.unsupported}

  window.TUTU_LINKS={build,message,transportSlug,hotelSlug,travelerToken,aviaId,busId,hotelGeoId};
})();
