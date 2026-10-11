/* Tour destinations for the India Landing.
 * Only country IDs evidenced by the two supplied Tutu/Travelata URLs or
 * Travelata's published partner API example may enter deep-link searches.
 * The other destinations remain browse-only until a partner directory sync.
 * Source: https://support.travelpayouts.com/hc/ru/articles/360022674591-API-%D0%BE%D1%82-Travelata
 */
(function(root){
  'use strict';

  const departures=[
    {key:'moscow',id:2,name:{ru:'Москва',en:'Moscow',hi:'मॉस्को'}},
    {key:'spb',id:1,name:{ru:'Санкт-Петербург',en:'Saint Petersburg',hi:'सेंट पीटर्सबर्ग'}}
  ];
  const destinations=[
    {key:'russia',kind:'country',id:null,name:{ru:'Россия',en:'Russia',hi:'रूस'},ru:'Россия',browse:'https://tours.tutu.ru/',aliases:'rossiya winter snow'},
    {key:'turkey',kind:'country',id:92,name:{ru:'Турция',en:'Turkey',hi:'तुर्किये'},ru:'Турция',browse:'https://tours.tutu.ru/',aliases:'turkiye turkiye türkiye'},
    {key:'egypt',kind:'country',id:29,name:{ru:'Египет',en:'Egypt',hi:'मिस्र'},ru:'Египет',browse:'https://tours.tutu.ru/',aliases:'misr'},
    {key:'uae',kind:'country',id:null,name:{ru:'ОАЭ',en:'UAE',hi:'संयुक्त अरब अमीरात'},ru:'ОАЭ',browse:'https://tours.tutu.ru/',aliases:'emirates dubai дубай दुबई'},
    {key:'thailand',kind:'country',id:null,name:{ru:'Таиланд',en:'Thailand',hi:'थाईलैंड'},ru:'Таиланд',browse:'https://tours.tutu.ru/',aliases:'тайланд'},
    {key:'india',kind:'country',id:null,name:{ru:'Индия',en:'India',hi:'भारत'},ru:'Индия',browse:'https://tours.tutu.ru/',aliases:'bharat'},
    {key:'maldives',kind:'country',id:null,name:{ru:'Мальдивы',en:'Maldives',hi:'मालदीव'},ru:'Мальдивы',browse:'https://tours.tutu.ru/',aliases:'maldivy'},
    {key:'abkhazia',kind:'country',id:null,name:{ru:'Абхазия',en:'Abkhazia',hi:'अब्खाज़िया'},ru:'Абхазия',browse:'https://tours.tutu.ru/',aliases:''},
    {key:'uzbekistan',kind:'country',id:null,name:{ru:'Узбекистан',en:'Uzbekistan',hi:'उज़्बेकिस्तान'},ru:'Узбекистан',browse:'https://tours.tutu.ru/',aliases:''},
    {key:'cuba',kind:'country',id:null,name:{ru:'Куба',en:'Cuba',hi:'क्यूबा'},ru:'Куба',browse:'https://tours.tutu.ru/',aliases:''},
    // Winter interests are explicit browse-only items, NOT unverified resorts.
    {key:'murmansk',kind:'winter',id:null,name:{ru:'Мурманск',en:'Murmansk',hi:'मुर्मांस्क'},ru:'Мурманск',browse:'https://tours.tutu.ru/',aliases:'northern lights aurora северное сияние'},
    {key:'teriberka',kind:'winter',id:null,name:{ru:'Териберка',en:'Teriberka',hi:'तेरिबेरका'},ru:'Териберка',browse:'https://tours.tutu.ru/',aliases:'arctic lights арктика'},
    {key:'baikal',kind:'winter',id:null,name:{ru:'Байкал',en:'Lake Baikal',hi:'बैकाल झील'},ru:'Байкал',browse:'https://tours.tutu.ru/',aliases:'irkutsk иркутск frozen lake'},
    {key:'saint-petersburg',kind:'winter',id:null,name:{ru:'Санкт-Петербург',en:'Saint Petersburg',hi:'सेंट पीटर्सबर्ग'},ru:'Санкт-Петербург',browse:'https://tours.tutu.ru/',aliases:'spb petersburg питер'},
    {key:'moscow',kind:'winter',id:null,name:{ru:'Москва',en:'Moscow',hi:'मॉस्को'},ru:'Москва',browse:'https://tours.tutu.ru/',aliases:'moskva'},
    {key:'karelia',kind:'winter',id:null,name:{ru:'Карелия',en:'Karelia',hi:'कारेलिया'},ru:'Карелия',browse:'https://tours.tutu.ru/',aliases:'petrozavodsk петрозаводск'},
    {key:'kazan',kind:'winter',id:null,name:{ru:'Казань',en:'Kazan',hi:'कज़ान'},ru:'Казань',browse:'https://tours.tutu.ru/',aliases:''},
    {key:'sochi',kind:'winter',id:null,name:{ru:'Сочи',en:'Sochi',hi:'सोची'},ru:'Сочи',browse:'https://tours.tutu.ru/',aliases:'rosa khutor красная поляна ski'},
    {key:'veliky-ustyug',kind:'winter',id:null,name:{ru:'Великий Устюг',en:'Veliky Ustyug',hi:'वेलिकी उस्त्यूग'},ru:'Великий Устюг',browse:'https://tours.tutu.ru/',aliases:'ded moroz дед мороз'}
  ];
  const byKey=new Map(destinations.map(d=>[d.key,d]));
  const departureByKey=new Map(departures.map(d=>[d.key,d]));

  function normalize(value){
    return String(value||'').toLocaleLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
  }
  function find(query,limit){
    const q=normalize(query);
    const filtered=destinations.filter(d=>!q||normalize(Object.values(d.name).join(' ')+' '+d.aliases).includes(q));
    return filtered.slice(0,limit||9);
  }
  function dateParts(isoDate){
    const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate||''));
    if(!m)return null;
    const y=Number(m[1]),mo=Number(m[2]),day=Number(m[3]);
    const dt=new Date(y,mo-1,day);
    if(dt.getFullYear()!==y||dt.getMonth()!==mo-1||dt.getDate()!==day)return null;
    return {iso:m[0],local:m[3]+'.'+m[2]+'.'+m[1]};
  }
  function build(state){
    const dep=departureByKey.get(state.departure),d=byKey.get(state.destination),date=dateParts(state.date);
    const min=Number(state.nightsMin),max=Number(state.nightsMax),adults=Number(state.adults);
    if(!dep||!d||!date||!Number.isInteger(min)||!Number.isInteger(max)||min<1||max>30||min>max||
       !Number.isInteger(adults)||adults<1||adults>9)throw new Error('Invalid tour search');
    // For browse-only locations, returning an unfiltered provider category page
    // is safer than inventing an arrival_id (or silently searching the wrong city).
    if(!Number.isInteger(d.id))return {url:d.browse,filtered:false,destination:d};
    if(d.kind!=='country')throw new Error('Unverified destination type');

    const q=new URLSearchParams();
    q.set('departure',String(dep.id));
    q.set('arrival_id',String(d.id));
    q.set('arrival_type','country');
    q.set('arrival_text',d.ru);
    q.set('date_begin',date.local);
    q.set('date_end',date.local);
    q.set('adults',String(adults));
    q.set('nights_min',String(min));
    q.set('nights_max',String(max));
    q.set('utm_source','tutu_main');
    q.set('utm_medium','internal');
    q.set('utm_content','tours_search_form');

    // sid is a provider-generated session token; never copy one from a sample URL.
    const hash=new URLSearchParams();
    hash.set('fromCity',String(dep.id));
    hash.set('toCountry',String(d.id));
    hash.set('dateFrom',date.local);
    hash.set('dateTo',date.local);
    hash.set('nightFrom',String(min));
    hash.set('nightTo',String(max));
    hash.set('adults',String(adults));
    hash.set('hotelClass','all');
    hash.set('meal','all');
    hash.set('priceFrom','6000');
    hash.set('priceTo','21000000');
    hash.set('sort','recommend');
    return {url:'https://web.tutu.travelata.ru/search/?'+q.toString()+'#?'+hash.toString(),filtered:true,destination:d};
  }
  root.TUTU_TOURS={departures,destinations,byKey,departureByKey,find,build,dateParts};
})(window);
