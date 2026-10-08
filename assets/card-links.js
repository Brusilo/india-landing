/* Route / hotel card links and audited display values. */
(function(){
  'use strict';
  const HOME='https://www.tutu.ru/';
  const OFFERS='https://www.tutu.ru/juicy-offers/';
  const RUB_TO_INR=1.12888;
  const lang=document.documentElement.lang==='hi'?'hi':document.documentElement.lang==='en'?'en':'ru';
  const routeData={
    r1:{price:831},
    r2:{price:19668},
    r3:{price:801},
    r4:{price:2048},
    r5:{price:1188},
    r6:{price:1916},
    r7:{price:1550},
    r8:{price:2717},
    r9:{price:525},
    r10:{price:4553},
    r11:{price:1681},
    r12:{price:1662},
    r13:{price:1188},
    r14:{price:2013}
  };
  const verifiedRouteUrls={
    r1:'https://www.tutu.ru/poezda/Sankt-Peterburg/Moskva/',
    r2:'https://avia.tutu.ru/f/Moskva/Deli/',
    r3:'https://www.tutu.ru/poezda/Moskva/Sankt-Peterburg/',
    r4:'https://www.tutu.ru/poezda/Novgorod/Sankt-Peterburg/',
    r5:'https://www.tutu.ru/poezda/Cheboksary/Moskva/',
    r6:'https://www.tutu.ru/poezda/Rostov-Na-Donu/Moskva/',
    r7:'https://www.tutu.ru/poezda/Moskva/Ulyanovsk/',
    r8:'https://www.tutu.ru/poezda/Ufa/Moskva/',
    r9:'https://www.tutu.ru/poezda/Moskva/Orel/',
    r10:'https://www.tutu.ru/poezda/Stavropol/Moskva/',
    r11:'https://www.tutu.ru/poezda/Moskva/Yoshkar-Ola/',
    r12:'https://www.tutu.ru/poezda/Sankt-Peterburg/Novgorod/',
    r13:'https://www.tutu.ru/poezda/Moskva/Cheboksary/',
    r14:'https://www.tutu.ru/poezda/Moskva/Rostov-Na-Donu/'
  };
  const hotels={
    h1:{name:{ru:'Альфа Измайлово',en:'Alfa Izmailovo',hi:'Alfa Izmailovo'},city:{ru:'Москва',en:'Moscow',hi:'मॉस्को'},top:{ru:'Москва · 9,1 км от центра',en:'Moscow · 9.1 km from centre',hi:'मॉस्को · केंद्र से 9.1 किमी'},meta:{ru:'Отель · 1332 отзыва',en:'Hotel · 1,332 reviews',hi:'होटल · 1,332 समीक्षाएँ'},rating:8.8,price:5931,url:'https://hotel.tutu.ru/h_otel_izmaylovo_alfa/'},
    h2:{name:{ru:'Номера на Садовой',en:'Nomera na Sadovoy',hi:'Nomera na Sadovoy'},city:{ru:'Санкт-Петербург',en:'Saint Petersburg',hi:'सेंट पीटर्सबर्ग'},top:{ru:'Санкт-Петербург · 1,3 км от центра',en:'Saint Petersburg · 1.3 km from centre',hi:'सेंट पीटर्सबर्ग · केंद्र से 1.3 किमी'},meta:{ru:'Отель · 1187 отзывов',en:'Hotel · 1,187 reviews',hi:'होटल · 1,187 समीक्षाएँ'},rating:8.8,price:3800,url:'https://hotel.tutu.ru/h_otel_nomera_na_sadovoy/'},
    h3:{name:{ru:'Грейс Горизонт',en:'Grace Gorizont',hi:'Grace Gorizont'},city:{ru:'Сочи',en:'Sochi',hi:'सोची'},top:{ru:'Сочи · 3,9 км от центра',en:'Sochi · 3.9 km from centre',hi:'सोची · केंद्र से 3.9 किमी'},meta:{ru:'Отель · 304 отзыва',en:'Hotel · 304 reviews',hi:'होटल · 304 समीक्षाएँ'},rating:9.4,price:2588,url:'https://hotel.tutu.ru/h_otel_greys_gorizont/'},
    h4:{name:{ru:'Venera',en:'Venera',hi:'Venera'},city:{ru:'Казань',en:'Kazan',hi:'कज़ान'},top:{ru:'Казань · 843 м от центра',en:'Kazan · 843 m from centre',hi:'कज़ान · केंद्र से 843 मी'},meta:{ru:'Отель · 1359 отзывов',en:'Hotel · 1,359 reviews',hi:'होटल · 1,359 समीक्षाएँ'},rating:8.9,price:8370,url:'https://hotel.tutu.ru/h_otel_imereti/'},
    h5:{name:{ru:'Pana Москва',en:'Pana Moscow',hi:'Pana Moscow'},city:{ru:'Москва',en:'Moscow',hi:'मॉस्को'},top:{ru:'Москва · 4,7 км от центра',en:'Moscow · 4.7 km from centre',hi:'मॉस्को · केंद्र से 4.7 किमी'},meta:{ru:'Отель · 357 отзывов',en:'Hotel · 357 reviews',hi:'होटल · 357 समीक्षाएँ'},rating:9.1,price:5913,url:'https://hotel.tutu.ru/h_pana_white_moscow_hotel_ex_holiday_inn_express_moscow_baumanskaya/'},
    h6:{name:{ru:'Астерия',en:'Asteria',hi:'Asteria'},city:{ru:'Санкт-Петербург',en:'Saint Petersburg',hi:'सेंट पीटर्सबर्ग'},top:{ru:'Санкт-Петербург · 1,6 км от центра',en:'Saint Petersburg · 1.6 km from centre',hi:'सेंट पीटर्सबर्ग · केंद्र से 1.6 किमी'},meta:{ru:'Отель · 1039 отзывов',en:'Hotel · 1,039 reviews',hi:'होटल · 1,039 समीक्षाएँ'},rating:8.7,price:5400,url:'https://hotel.tutu.ru/h_asteriya_191023_sanktpeterburg_nab_reki_fontanki_d_71/'},
    h7:{name:{ru:'Садко',en:'Sadko',hi:'Sadko'},city:{ru:'Великий Новгород',en:'Veliky Novgorod',hi:'वेलिकी नोवगोरोद'},top:{ru:'Великий Новгород · 970 м от центра',en:'Veliky Novgorod · 970 m from centre',hi:'वेलिकी नोवगोरोद · केंद्र से 970 मी'},meta:{ru:'Отель · 383 отзыва',en:'Hotel · 383 reviews',hi:'होटल · 383 समीक्षाएँ'},rating:8.9,price:6256,url:'https://hotel.tutu.ru/h_sadko_rossiya_173000_novgorodskaya_oblast_veliky_novgorod_ul_fyodorovsky_ruchey_d_16/'},
    h8:{name:{ru:'Cascade Resort',en:'Cascade Resort',hi:'Cascade Resort'},city:{ru:'Адлер',en:'Adler',hi:'एडलर'},top:{ru:'Адлер · 768 м от центра',en:'Adler · 768 m from centre',hi:'एडलर · केंद्र से 768 मी'},meta:{ru:'Отель · 120 отзывов',en:'Hotel · 120 reviews',hi:'होटल · 120 समीक्षाएँ'},rating:8.9,price:4342,url:'https://hotel.tutu.ru/h_otel_kaskad_sochi/'},
    h9:{name:{ru:'Весна',en:'Vesna',hi:'Vesna'},city:{ru:'Нижний Новгород',en:'Nizhny Novgorod',hi:'निझ्नी नोवगोरोद'},top:{ru:'Нижний Новгород · 3,2 км от центра',en:'Nizhny Novgorod · 3.2 km from centre',hi:'निझ्नी नोवगोरोद · केंद्र से 3.2 किमी'},meta:{ru:'Отель · 386 отзывов',en:'Hotel · 386 reviews',hi:'होटल · 386 समीक्षाएँ'},rating:8.9,price:3800,url:'https://hotel.tutu.ru/h_vesna_rossiya_nizhny_novgorod_manufakturnaya_ulitsa_18/'},
    h10:{name:{ru:'Cosmos Москва Павелецкая',en:'Cosmos Moscow Paveletskaya',hi:'Cosmos Moscow Paveletskaya'},city:{ru:'Москва',en:'Moscow',hi:'मॉस्को'},top:{ru:'Москва · 3,4 км от центра',en:'Moscow · 3.4 km from centre',hi:'मॉस्को · केंद्र से 3.4 किमी'},meta:{ru:'Отель · 263 отзыва',en:'Hotel · 263 reviews',hi:'होटल · 263 समीक्षाएँ'},rating:9.1,price:8190,url:'https://hotel.tutu.ru/h_kortyard_marriott_moskva_paveletskaya/'},
    h11:{name:{ru:'Сити Роуз',en:'City Rose',hi:'City Rose'},city:{ru:'Ростов-на-Дону',en:'Rostov-on-Don',hi:'रोस्तोव-ऑन-डॉन'},top:{ru:'Ростов-на-Дону · 284 м от центра',en:'Rostov-on-Don · 284 m from centre',hi:'रोस्तोव-ऑन-डॉन · केंद्र से 284 मी'},meta:{ru:'Отель · 285 отзывов',en:'Hotel · 285 reviews',hi:'होटल · 285 समीक्षाएँ'},rating:8.9,price:3192,url:'https://hotel.tutu.ru/h_siti_rouz_rossiya_rostovnadonu_ul_shaumyana_d90/'},
    h12:{name:{ru:'Novotel Шереметьево',en:'Novotel Sheremetyevo',hi:'Novotel Sheremetyevo'},city:{ru:'Химки',en:'Khimki',hi:'खिमकी'},top:{ru:'Химки · 8,2 км от центра',en:'Khimki · 8.2 km from centre',hi:'खिमकी · केंद्र से 8.2 किमी'},meta:{ru:'Отель · 332 отзыва',en:'Hotel · 332 reviews',hi:'होटल · 332 समीक्षाएँ'},rating:8.6,price:9531,url:'https://hotel.tutu.ru/h_otel_novotel_moskva_aeroport_sheremetyevo/'},
    h13:{name:{ru:'Hotel Amax Inn',en:'Hotel Amax Inn',hi:'Hotel Amax Inn'},city:{ru:'Нью-Дели',en:'New Delhi',hi:'नई दिल्ली'},top:{ru:'Нью-Дели · 3 км от центра',en:'New Delhi · 3 km from centre',hi:'नई दिल्ली · केंद्र से 3 किमी'},meta:{ru:'Отель',en:'Hotel',hi:'होटल'},rating:null,price:1293,url:'https://hotel.tutu.ru/h_hotel_amax_inn/'}
  };

  const nf=n=>lang==='ru'?String(Math.trunc(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g,'\u202F'):new Intl.NumberFormat('en-IN',{maximumFractionDigits:0}).format(Math.trunc(Number(n)));
  const duration=(h,m)=>lang==='ru'?(h+' ч'+(m?' '+m+' мин':'')):lang==='hi'?(h+' घं.'+(m?' '+m+' मि.':'')):(h+' h'+(m?' '+m+' min':''));
  const tomorrow=()=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+1);return d};
  const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
  const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const hotelAllUrl=()=>{
    const a=tomorrow(),b=addDays(a,1),p=new URLSearchParams({check_in:iso(a),check_out:iso(b),details_params:'',geo_id:'2657260',geo_name:'Москва',geo_type:'locality',resultId:'','room[0]':'3',search_id:'',sorting:'relevanceDesc'});
    return 'https://hotel.tutu.ru/c_russia/moscow/?'+p.toString();
  };
  function activate(card,url){
    card.tabIndex=0;card.setAttribute('role','link');card.style.cursor='pointer';card.dataset.href=url;
    card.addEventListener('click',e=>{if(e.target.closest('a,button'))return;window.location.assign(url)});
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();window.location.assign(url)}});
  }

  /* Each card opens Tutu's search results for tomorrow straight away, not the
     route's landing page. The cities come from fixed ids rather than the card
     title, which differs by language; the audited plain URL is the fallback. */
  const routeEnds={
    r1:['ru-saint-petersburg','ru-moscow'],
    r2:['ru-moscow','in-delhi'],
    r3:['ru-moscow','ru-saint-petersburg'],
    r4:['ru-veliky-novgorod','ru-saint-petersburg'],
    r5:['ru-cheboksary','ru-moscow'],
    r6:['ru-rostov-on-don','ru-moscow'],
    r7:['ru-moscow','ru-ulyanovsk'],
    r8:['ru-ufa','ru-moscow'],
    r9:['ru-moscow','ru-oryol'],
    r10:['ru-stavropol','ru-moscow'],
    r11:['ru-moscow','ru-yoshkar-ola'],
    r12:['ru-saint-petersburg','ru-veliky-novgorod'],
    r13:['ru-moscow','ru-cheboksary'],
    r14:['ru-moscow','ru-rostov-on-don']
  };
  const placeById=id=>window.TUTU_PLACES&&TUTU_PLACES.places.find(p=>p.id===id);
  function routeUrl(card,id,fallback){
    const plain=fallback||HOME,ends=routeEnds[id];
    if(!ends||!window.TUTU_LINKS)return plain;
    const from=placeById(ends[0]),to=placeById(ends[1]);if(!from||!to)return plain;
    try{
      const url=TUTU_LINKS.build(card.dataset.transport,{from,to,date:tomorrow(),adults:1,children:0,childAges:[],cabin:'economy'});
      return url&&url!==HOME?url:plain;
    }catch(_){return plain}
  }
  /* Hotel cards open the hotel with tomorrow's one-night stay for one guest. */
  function hotelUrl(url){
    const a=tomorrow();
    return url+'?'+new URLSearchParams({check_in:iso(a),check_out:iso(addDays(a,1)),'room[0]':'1'}).toString();
  }

  const routes=document.getElementById('routes');
  if(routes){
    const see=routes.querySelector('.see-all');if(see)see.href=OFFERS;
    const cta=routes.querySelector('.card--cta');if(cta)cta.href=OFFERS;
    routes.querySelectorAll('.card[data-transport]').forEach(card=>{
      const id=(card.dataset.cta||'').replace(/^route_/,'').replace(/_combined$/,'');
      const d=routeData[id];
      if(d){
        const price=card.querySelector('.price');if(price)price.innerHTML=lang==='en'?'<span class="price-from">from</span> '+nf(d.price)+'&nbsp;₽':lang==='hi'?nf(d.price)+'&nbsp;₽ <span class="price-from">से</span>':'<span class="price-from">от</span> '+nf(d.price)+'&nbsp;₽';
        const alt=card.querySelector('.price-alt');if(alt)alt.textContent='≈ ₹'+nf(Math.round(d.price*RUB_TO_INR));
        const meta=card.querySelector('.card-meta');if(meta)meta.textContent=duration(d.h,d.m);
      }
      activate(card,routeUrl(card,id,verifiedRouteUrls[id]));
    });
  }

  const hotelSection=document.getElementById('hotels')||document.querySelector('#hotels-row')?.closest('section');
  if(hotelSection){const see=hotelSection.querySelector('.see-all');if(see)see.href=hotelAllUrl()}
  const hotelRow=document.getElementById('hotels-row');
  if(hotelRow){
    Object.entries(hotels).forEach(([id,d])=>{
      const card=hotelRow.querySelector('[data-cta="hotel_'+id+'"]');if(!card)return;
      const top=card.querySelector('.hotel-top');if(top)top.textContent=d.top[lang];
      const name=card.querySelector('.hotel-name');if(name)name.textContent=d.name[lang];
      const meta=card.querySelector('.hotel-meta');if(meta)meta.textContent=d.meta[lang];
      const rating=card.querySelector('.rating');if(rating){if(d.rating)rating.textContent=lang==='ru'?String(d.rating).replace('.',','):String(d.rating);else rating.remove()}
      const price=card.querySelector('.hotel-price-row');
      if(price){
        const inr=Math.round(d.price*RUB_TO_INR);
        const night=lang==='ru'?'за ночь':lang==='hi'?'प्रति रात':'per night';
        if(lang==='ru')price.innerHTML='<span class="price">'+nf(d.price)+' ₽ <span class="hotel-night">'+night+'</span></span><span class="price-alt">≈ ₹'+nf(inr)+'</span>';
        else if(lang==='hi')price.innerHTML='<span class="price">'+nf(d.price)+' ₽ <span class="hotel-night">'+night+'</span></span><span class="price-alt">≈ ₹'+nf(inr)+'</span>';
        else price.innerHTML='<span class="price">'+nf(d.price)+' ₽ <span class="hotel-night">'+night+'</span></span><span class="price-alt">≈ ₹'+nf(inr)+'</span>';
      }
      activate(card,hotelUrl(d.url));
    });
    const cta=hotelRow.querySelector('.card--cta');if(cta)cta.href=hotelAllUrl();
  }
})();

// pages-deploy-nonce: 20260924-2059
