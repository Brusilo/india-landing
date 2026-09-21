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
    h1:{name:{ru:'Отель Булгар',en:'Otel Bulgar',hi:'Otel Bulgar'},city:{ru:'Казань',en:'Kazan',hi:'कज़ान'},top:{ru:'Казань · 2,9 км от центра',en:'Kazan · 2.9 km from the centre',hi:'कज़ान · केंद्र से 2.9 किमी'},meta:{ru:'Отель · 214 отзывов',en:'Hotel · 214 reviews',hi:'होटल · 214 समीक्षाएँ'},rating:8.3,price:3584,url:'https://hotel.tutu.ru/h_otel_bulgar/'},
    h2:{name:{ru:'Грейс Амалия',en:'Greys Amaliya',hi:'Greys Amaliya'},city:{ru:'Сочи',en:'Sochi',hi:'सोची'},top:{ru:'Сочи · 633 м до пляжа',en:'Sochi · 633 m to the beach',hi:'सोची · समुद्र तट से 633 मी'},meta:{ru:'Гостевой дом · 240 отзывов',en:'Guest house · 240 reviews',hi:'गेस्ट हाउस · 240 समीक्षाएँ'},rating:9.1,price:2300,url:'https://hotel.tutu.ru/h_otel_greys_amaliya/'},
    h3:{name:{ru:'Хостел Автор Таганка',en:'Khostel Avtor Taganka',hi:'Khostel Avtor Taganka'},city:{ru:'Москва',en:'Moscow',hi:'मॉस्को'},top:{ru:'Москва · 3 км от центра',en:'Moscow · 3 km from the centre',hi:'मॉस्को · केंद्र से 3 किमी'},meta:{ru:'Хостел · 336 отзывов',en:'Hostel · 336 reviews',hi:'हॉस्टल · 336 समीक्षाएँ'},rating:8.4,price:4122,url:'https://hotel.tutu.ru/h_khostel_avtor/'},
    h4:{name:{ru:'Номера у Невы',en:'Nomera u Nevy',hi:'Nomera u Nevy'},city:{ru:'Санкт-Петербург',en:'Saint Petersburg',hi:'सेंट पीटर्सबर्ग'},top:{ru:'Санкт-Петербург · 5,2 км от центра',en:'Saint Petersburg · 5.2 km from the centre',hi:'सेंट पीटर्सबर्ग · केंद्र से 5.2 किमी'},meta:{ru:'Отель · 157 отзывов',en:'Hotel · 157 reviews',hi:'होटल · 157 समीक्षाएँ'},rating:7.8,price:2199,url:'https://hotel.tutu.ru/h_otel_art_deko_nevsky/'},
    h5:{name:{ru:'Гостевые комнаты и апартаменты Грифон',en:'Gostevye komnaty i apartamenty Grifon',hi:'Gostevye komnaty i apartamenty Grifon'},city:{ru:'Санкт-Петербург',en:'Saint Petersburg',hi:'सेंट पीटर्सबर्ग'},top:{ru:'Санкт-Петербург · 894 м от центра',en:'Saint Petersburg · 894 m from the centre',hi:'सेंट पीटर्सबर्ग · केंद्र से 894 मी'},meta:{ru:'Апартаменты',en:'Apartments',hi:'अपार्टमेंट'},rating:9.1,price:2400,url:'https://hotel.tutu.ru/h_gostevye_komnaty_i_apartamenty_grifon/'},
    h6:{name:{ru:'Боярин',en:'Boyarin',hi:'Boyarin'},city:{ru:'Геленджик',en:'Gelendzhik',hi:'गेलेंदझिक'},top:{ru:'Геленджик · 483 м до пляжа',en:'Gelendzhik · 483 m to the beach',hi:'गेलेंदझिक · समुद्र तट से 483 मी'},meta:{ru:'Гостевой дом · 33 отзыва',en:'Guest house · 33 reviews',hi:'गेस्ट हाउस · 33 समीक्षाएँ'},rating:9.5,price:2500,url:'https://hotel.tutu.ru/h_gostevoy_dom_boyarin/'}
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

  function routeUrl(card){
    const name=card.querySelector('.route-name');if(!name)return HOME;
    const parts=name.textContent.split('–').map(x=>x.trim());if(parts.length!==2)return HOME;
    const from=resolvePlace(parts[0]),to=resolvePlace(parts[1]);if(!from||!to||!window.TUTU_LINKS)return HOME;
    try{return TUTU_LINKS.build(card.dataset.transport,{from,to,date:tomorrow(),adults:1,children:0,childAges:[],cabin:'economy'})}catch(_){return HOME}
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
      activate(card,verifiedRouteUrls[id]||routeUrl(card));
    });
  }

  const hotelSection=document.getElementById('hotels')||document.querySelector('#hotels-row')?.closest('section');
  if(hotelSection){const see=hotelSection.querySelector('.see-all');if(see)see.href=hotelAllUrl()}
  const hotelRow=document.getElementById('hotels-row');
  if(hotelRow){
    ['h7','h8'].forEach(id=>{const x=hotelRow.querySelector('[data-cta="hotel_'+id+'"]');if(x)x.remove()});
    Object.entries(hotels).forEach(([id,d])=>{
      const card=hotelRow.querySelector('[data-cta="hotel_'+id+'"]');if(!card)return;
      const top=card.querySelector('.hotel-top');if(top)top.textContent=d.top[lang];
      const name=card.querySelector('.hotel-name');if(name)name.textContent=d.name[lang];
      const meta=card.querySelector('.hotel-meta');if(meta)meta.textContent=d.meta[lang];
      const rating=card.querySelector('.rating');if(rating){if(d.rating)rating.textContent=lang==='ru'?String(d.rating).replace('.',','):String(d.rating);else rating.remove()}
      const price=card.querySelector('.hotel-price-row');if(price)price.innerHTML='<span class="price">'+nf(d.price)+' ₽ <span class="hotel-night">'+(lang==='ru'?'за ночь':lang==='hi'?'प्रति रात':'per night')+'</span></span><span class="price-alt">≈ ₹'+nf(Math.round(d.price*RUB_TO_INR))+'</span>';
      activate(card,d.url);
    });
    const cta=hotelRow.querySelector('.card--cta');if(cta)cta.href=hotelAllUrl();
  }
})();
