/* Route / hotel card links and audited display values. */
(function(){
  'use strict';
  const HOME='https://www.tutu.ru/';
  const OFFERS='https://www.tutu.ru/juicy-offers/';
  const RUB_TO_INR=1.13917;
  const lang=document.documentElement.lang==='hi'?'hi':document.documentElement.lang==='en'?'en':'ru';
  const routeData={
    r1:{price:29870,h:6,m:30},
    r2:{price:16539,h:6,m:10},
    r3:{price:25528,h:8,m:50},
    r4:{price:10611,h:8,m:25},
    r5:{price:6650,h:6,m:55},
    r6:{price:1197,h:4,m:0},
    r7:{price:1694,h:12,m:46},
    r8:{price:2087,h:14,m:10},
    r9:{price:1681,h:14,m:27},
    r10:{price:2693,h:3,m:30}
  };
  const verifiedRouteUrls={
    r1:'https://avia.tutu.ru/f/Deli/Moskva/',
    r2:'https://avia.tutu.ru/f/Moskva/Deli/',
    r3:'https://avia.tutu.ru/f/Deli/Ekaterinburg/',
    r4:'https://avia.tutu.ru/f/Goa/Moskva/',
    r5:'https://avia.tutu.ru/f/Goa/Ekaterinburg/',
    r6:'https://www.tutu.ru/poezda/Moskva/Sankt-Peterburg/',
    r7:'https://www.tutu.ru/poezda/Ekaterinburg/Kazan/',
    r8:'https://www.tutu.ru/poezda/Ekaterinburg/Ufa/',
    r9:'https://www.tutu.ru/poezda/Moskva/Yoshkar-Ola/',
    r10:'https://avia.tutu.ru/f/Moskva/Sochi/'
  };
  const hotels={
    h1:{name:{ru:'Хостел Автор Павелецкая',en:'Autor Paveletskaya Hostel',hi:'Autor Paveletskaya हॉस्टल'},city:{ru:'Москва',en:'Moscow',hi:'मॉस्को'},top:{ru:'Москва · 2,6 км от центра',en:'Moscow · 2.6 km from the centre',hi:'मॉस्को · केंद्र से 2.6 किमी'},meta:{ru:'Хостел · 269 отзывов',en:'Hostel · 269 reviews',hi:'हॉस्टल · 269 समीक्षाएँ'},rating:8.5,price:2060,url:'https://hotel.tutu.ru/h_meblirovannye_komnaty_kruassan_i_kofeynya/'},
    h2:{name:{ru:'Хостел Roof Capsules',en:'Roof Capsules Hostel',hi:'Roof Capsules हॉस्टल'},city:{ru:'Санкт-Петербург',en:'Saint Petersburg',hi:'सेंट पीटर्सबर्ग'},top:{ru:'Санкт-Петербург · 1,1 км от центра',en:'Saint Petersburg · 1.1 km from the centre',hi:'सेंट पीटर्सबर्ग · केंद्र से 1.1 किमी'},meta:{ru:'Хостел · 277 отзывов',en:'Hostel · 277 reviews',hi:'हॉस्टल · 277 समीक्षाएँ'},rating:8.2,price:1441,url:'https://hotel.tutu.ru/h_khostel_roof_capsules/'},
    h3:{name:{ru:'Хостел Stereo',en:'Stereo Hostel',hi:'Stereo हॉस्टल'},city:{ru:'Казань',en:'Kazan',hi:'कज़ान'},top:{ru:'Казань · 1,8 км от центра',en:'Kazan · 1.8 km from the centre',hi:'कज़ान · केंद्र से 1.8 किमी'},meta:{ru:'Хостел · 61 отзыв',en:'Hostel · 61 reviews',hi:'हॉस्टल · 61 समीक्षाएँ'},rating:8.5,price:1949,url:'https://hotel.tutu.ru/h_zhilye_pomeshcheniya_stereo/'},
    h4:{name:{ru:'Хостел СВ',en:'SV Hostel',hi:'SV हॉस्टल'},city:{ru:'Тверь',en:'Tver',hi:'त्वेर'},top:{ru:'Тверь · 1,5 км от центра',en:'Tver · 1.5 km from the centre',hi:'त्वेर · केंद्र से 1.5 किमी'},meta:{ru:'Хостел · 24 отзыва',en:'Hostel · 24 reviews',hi:'हॉस्टल · 24 समीक्षाएँ'},rating:8.6,price:2321,url:'https://hotel.tutu.ru/h_khostel_sv/'},
    h5:{name:{ru:'Хостел Комфорт',en:'Comfort Hostel',hi:'Comfort हॉस्टल'},city:{ru:'Йошкар-Ола',en:'Yoshkar-Ola',hi:'योश्कर-ओला'},top:{ru:'Йошкар-Ола · 2,1 км от центра',en:'Yoshkar-Ola · 2.1 km from the centre',hi:'योश्कर-ओला · केंद्र से 2.1 किमी'},meta:{ru:'Хостел · 43 отзыва',en:'Hostel · 43 reviews',hi:'हॉस्टल · 43 समीक्षाएँ'},rating:8.0,price:1512,url:'https://hotel.tutu.ru/h_khostel_komfort_yoshkarola/'},
    h6:{name:{ru:'Хостел HIDE',en:'HIDE Hostel',hi:'HIDE हॉस्टल'},city:{ru:'Ростов-на-Дону',en:'Rostov-on-Don',hi:'रोस्तोव-ऑन-डॉन'},top:{ru:'Ростов-на-Дону · 3,1 км от центра',en:'Rostov-on-Don · 3.1 km from the centre',hi:'रोस्तोव-ऑन-डॉन · केंद्र से 3.1 किमी'},meta:{ru:'Хостел · 41 отзыв',en:'Hostel · 41 reviews',hi:'हॉस्टल · 41 समीक्षाएँ'},rating:8.1,price:1664,url:'https://hotel.tutu.ru/h_khostel_hide/'},
    h7:{name:{ru:'Hotel Amax Inn',en:'Hotel Amax Inn',hi:'Hotel Amax Inn'},city:{ru:'Нью-Дели',en:'New Delhi',hi:'नई दिल्ली'},top:{ru:'Нью-Дели · 3 км от центра',en:'New Delhi · 3 km from the centre',hi:'नई दिल्ली · केंद्र से 3 किमी'},meta:{ru:'Отель · 2 отзыва',en:'Hotel · 2 reviews',hi:'होटल · 2 समीक्षाएँ'},rating:9.4,price:1403,url:'https://hotel.tutu.ru/h_hotel_amax_inn/'}
  };

  const nf=n=>String(Math.trunc(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g,'\u202F');
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
  function resolvePlace(text){
    if(!window.TUTU_PLACES)return null;
    return TUTU_PLACES.resolveExact(text);
  }

  /* A built link carries tomorrow's date; the audited plain URL is the fallback. */
  function routeUrl(card,fallback){
    const plain=fallback||HOME;
    const name=card.querySelector('.route-name');if(!name)return plain;
    const parts=name.textContent.split('–').map(x=>x.trim());if(parts.length!==2)return plain;
    const from=resolvePlace(parts[0]),to=resolvePlace(parts[1]);if(!from||!to||!window.TUTU_LINKS)return plain;
    try{return TUTU_LINKS.build(card.dataset.transport,{from,to,date:tomorrow(),adults:1,children:0,childAges:[],cabin:'economy'})}catch(_){return plain}
  }

  const routes=document.getElementById('routes');
  if(routes){
    const see=routes.querySelector('.see-all');if(see)see.href=OFFERS;
    const cta=routes.querySelector('.card--cta');if(cta)cta.href=OFFERS;
    routes.querySelectorAll('.card[data-transport]').forEach(card=>{
      const id=(card.dataset.cta||'').replace(/^route_/,'').replace(/_combined$/,'');
      const d=routeData[id];
      if(d){
        const price=card.querySelector('.price');if(price)price.textContent=lang==='en'?'from '+nf(d.price)+' ₽':lang==='hi'?nf(d.price)+' ₽ से':'от '+nf(d.price)+' ₽';
        const alt=card.querySelector('.price-alt');if(alt)alt.textContent='≈ ₹'+nf(Math.round(d.price*RUB_TO_INR));
        const meta=card.querySelector('.card-meta');if(meta)meta.textContent=duration(d.h,d.m);
      }
      activate(card,routeUrl(card,verifiedRouteUrls[id]));
    });
  }

  const hotelSection=document.getElementById('hotels')||document.querySelector('#hotels-row')?.closest('section');
  if(hotelSection){const see=hotelSection.querySelector('.see-all');if(see)see.href=hotelAllUrl()}
  const hotelRow=document.getElementById('hotels-row');
  if(hotelRow){
    ['h8'].forEach(id=>{const x=hotelRow.querySelector('[data-cta="hotel_'+id+'"]');if(x)x.remove()});
    Object.entries(hotels).forEach(([id,d])=>{
      const card=hotelRow.querySelector('[data-cta="hotel_'+id+'"]');if(!card)return;
      const top=card.querySelector('.hotel-top');if(top)top.textContent=d.top[lang];
      const name=card.querySelector('.hotel-name');if(name)name.textContent=d.name[lang];
      const meta=card.querySelector('.hotel-meta');if(meta)meta.textContent=d.meta[lang];
      const rating=card.querySelector('.rating');if(rating){if(d.rating)rating.textContent=lang==='ru'?String(d.rating).replace('.',','):String(d.rating);else rating.remove()}
      const price=card.querySelector('.hotel-price-row');if(price){const lead=lang==='ru'?'от ':lang==='en'?'from ':'';const tail=lang==='hi'?' से':'';price.innerHTML='<span class="price">'+lead+nf(d.price)+' ₽'+tail+' <span class="hotel-night">'+(lang==='ru'?'за ночь':lang==='hi'?'प्रति रात':'per night')+'</span></span><span class="price-alt">≈ ₹'+nf(Math.round(d.price*RUB_TO_INR))+'</span>'};
      activate(card,d.url);
    });
    const cta=hotelRow.querySelector('.card--cta');if(cta)cta.href=hotelAllUrl();
  }
})();
