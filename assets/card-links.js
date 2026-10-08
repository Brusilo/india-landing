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
    h1:{name:{ru:'Отель Золотой Колос',en:'Zolotoy Kolos Hotel',hi:'Zolotoy Kolos Hotel'},city:{ru:'Москва',en:'Moscow',hi:'मॉस्को'},top:{ru:'Москва · 7,4 км от центра',en:'Moscow · 7.4 km from centre',hi:'मॉस्को · केंद्र से 7.4 किमी'},meta:{ru:'Отель · 923 отзыва',en:'Hotel · 923 reviews',hi:'होटल · 923 समीक्षाएँ'},rating:8.5,price:3616,url:'https://hotel.tutu.ru/h_meblirovannye_komnaty_zolotoy_kolos/'},
    h2:{name:{ru:'Меблированные комнаты Симфония Уюта',en:'Simfoniya Uyuta Furnished Rooms',hi:'Simfoniya Uyuta Furnished Rooms'},city:{ru:'Санкт-Петербург',en:'Saint Petersburg',hi:'सेंट पीटर्सबर्ग'},top:{ru:'Санкт-Петербург · 2 км от центра',en:'Saint Petersburg · 2 km from centre',hi:'सेंट पीटर्सबर्ग · केंद्र से 2 किमी'},meta:{ru:'Отель · 78 отзывов',en:'Hotel · 78 reviews',hi:'होटल · 78 समीक्षाएँ'},rating:9.3,price:1348,url:'https://hotel.tutu.ru/h_gostevoy_dom_simfoniya_uyuta/'},
    h3:{name:{ru:'Мини-отель Стерео',en:'Stereo Mini-Hotel',hi:'Stereo Mini-Hotel'},city:{ru:'Казань',en:'Kazan',hi:'कज़ान'},top:{ru:'Казань · 1,5 км от центра',en:'Kazan · 1.5 km from centre',hi:'कज़ान · केंद्र से 1.5 किमी'},meta:{ru:'Мини-отель · 158 отзывов',en:'Mini-hotel · 158 reviews',hi:'मिनी-होटल · 158 समीक्षाएँ'},rating:8.4,price:2080,url:'https://hotel.tutu.ru/h_miniotel_stereo_na_karla_marksa_47/'},
    h4:{name:{ru:'Номера в Твери',en:'Nomera v Tveri',hi:'Nomera v Tveri'},city:{ru:'Тверь',en:'Tver',hi:'त्वेर'},top:{ru:'Тверь · 2,4 км от центра',en:'Tver · 2.4 km from centre',hi:'त्वेर · केंद्र से 2.4 किमी'},meta:{ru:'Отель · 127 отзывов',en:'Hotel · 127 reviews',hi:'होटल · 127 समीक्षाएँ'},rating:9.0,price:2799,url:'https://hotel.tutu.ru/h_otel_sweet_home_tver/'},
    h5:{name:{ru:'АМАКС Сити-отель Йошкар-Ола',en:'AMAKS City Hotel Yoshkar-Ola',hi:'AMAKS City Hotel Yoshkar-Ola'},city:{ru:'Йошкар-Ола',en:'Yoshkar-Ola',hi:'योश्कर-ओला'},top:{ru:'Йошкар-Ола · 1 км от центра',en:'Yoshkar-Ola · 1 km from centre',hi:'योश्कर-ओला · केंद्र से 1 किमी'},meta:{ru:'Отель · 752 отзыва',en:'Hotel · 752 reviews',hi:'होटल · 752 समीक्षाएँ'},rating:8.1,price:2995,url:'https://hotel.tutu.ru/h_amaks_siti_otel_yoshkarola/'},
    h6:{name:{ru:'Дача Хаус',en:'Dacha House',hi:'Dacha House'},city:{ru:'Ростов-на-Дону',en:'Rostov-on-Don',hi:'रोस्तोव-ऑन-डॉन'},top:{ru:'Ростов-на-Дону · 3,4 км от центра',en:'Rostov-on-Don · 3.4 km from centre',hi:'रोस्तोव-ऑन-डॉन · केंद्र से 3.4 किमी'},meta:{ru:'Отель · 46 отзывов',en:'Hotel · 46 reviews',hi:'होटल · 46 समीक्षाएँ'},rating:7.8,price:2400,url:'https://hotel.tutu.ru/h_apartotel_dacha_khaus/'},
    h7:{name:{ru:'Hotel Amax Inn',en:'Hotel Amax Inn',hi:'Hotel Amax Inn'},city:{ru:'Нью-Дели',en:'New Delhi',hi:'नई दिल्ली'},top:{ru:'Нью-Дели · 3 км от центра',en:'New Delhi · 3 km from centre',hi:'नई दिल्ली · केंद्र से 3 किमी'},meta:{ru:'Отель',en:'Hotel',hi:'होटल'},rating:null,price:1293,url:'https://hotel.tutu.ru/h_hotel_amax_inn/'}
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
    ['h8'].forEach(id=>{const x=hotelRow.querySelector('[data-cta="hotel_'+id+'"]');if(x)x.remove()});
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
