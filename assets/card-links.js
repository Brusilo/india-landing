/* Route / hotel card links and audited display values. */
(function(){
  'use strict';
  const HOME='https://www.tutu.ru/';
  const OFFERS='https://www.tutu.ru/juicy-offers/';
  const RUB_TO_INR=1.13262;
  const lang=document.documentElement.lang==='hi'?'hi':document.documentElement.lang==='en'?'en':'ru';
  const routeData={
    r1:{price:15783,h:10,m:10},
    r2:{price:1574,h:12,m:37},
    r3:{price:1681,h:14,m:27},
    r4:{price:29996,h:6,m:30},
    r5:{price:16539,h:6,m:10},
    r8:{price:2070,h:8,m:0},
    r9:{price:2746,h:3,m:30},
    r10:{price:1659,h:12,m:9}
  };
  const hotels={
    h1:{name:'Отель Булгар',city:{ru:'Казань',en:'Kazan',hi:'कज़ान'},top:{ru:'Казань · 2,9 км от центра',en:'Kazan · 2.9 km from the centre',hi:'कज़ान · केंद्र से 2.9 किमी'},meta:{ru:'Отель · 214 отзывов',en:'Hotel · 214 reviews',hi:'होटल · 214 समीक्षाएँ'},rating:'8,3',price:3584,url:'https://hotel.tutu.ru/h_otel_bulgar/'},
    h2:{name:'Грейс Амалия',city:{ru:'Сочи',en:'Sochi',hi:'सोची'},top:{ru:'Сочи · 633 м до пляжа',en:'Sochi · 633 m to the beach',hi:'सोची · समुद्र तट से 633 मी'},meta:{ru:'Гостевой дом · 240 отзывов',en:'Guest house · 240 reviews',hi:'गेस्ट हाउस · 240 समीक्षाएँ'},rating:'9,1',price:2300,url:'https://hotel.tutu.ru/h_otel_greys_amaliya/'},
    h3:{name:'Хостел Автор Таганка',city:{ru:'Москва',en:'Moscow',hi:'मॉस्को'},top:{ru:'Москва · 3 км от центра',en:'Moscow · 3 km from the centre',hi:'मॉस्को · केंद्र से 3 किमी'},meta:{ru:'Хостел · 336 отзывов',en:'Hostel · 336 reviews',hi:'हॉस्टल · 336 समीक्षाएँ'},rating:'8,4',price:4122,url:'https://hotel.tutu.ru/h_khostel_avtor/'},
    h4:{name:'Номера у Невы',city:{ru:'Санкт-Петербург',en:'Saint Petersburg',hi:'सेंट पीटर्सबर्ग'},top:{ru:'Санкт-Петербург · 5,2 км от центра',en:'Saint Petersburg · 5.2 km from the centre',hi:'सेंट पीटर्सबर्ग · केंद्र से 5.2 किमी'},meta:{ru:'Отель · 157 отзывов',en:'Hotel · 157 reviews',hi:'होटल · 157 समीक्षाएँ'},rating:'7,8',price:2199,url:'https://hotel.tutu.ru/h_otel_art_deko_nevsky/'},
    h5:{name:'Гостевые комнаты и апартаменты Грифон',city:{ru:'Санкт-Петербург',en:'Saint Petersburg',hi:'सेंट पीटर्सबर्ग'},top:{ru:'Санкт-Петербург · 894 м от центра',en:'Saint Petersburg · 894 m from the centre',hi:'सेंट पीटर्सबर्ग · केंद्र से 894 मी'},meta:{ru:'Апартаменты',en:'Apartments',hi:'अपार्टमेंट'},rating:'9,1',price:2400,url:'https://hotel.tutu.ru/h_gostevye_komnaty_i_apartamenty_grifon/'},
    h6:{name:'Боярин',city:{ru:'Геленджик',en:'Gelendzhik',hi:'गेलेंदझिक'},top:{ru:'Геленджик · 483 м до пляжа',en:'Gelendzhik · 483 m to the beach',hi:'गेलेंदझिक · समुद्र तट से 483 मी'},meta:{ru:'Гостевой дом · 33 отзыва',en:'Guest house · 33 reviews',hi:'गेस्ट हाउस · 33 समीक्षाएँ'},rating:'9,5',price:2500,url:'https://hotel.tutu.ru/h_gostevoy_dom_boyarin/'}
  };

  const nf=n=>Number(n).toLocaleString(lang==='en'?'en-GB':lang==='hi'?'en-IN':'ru-RU');
  const duration=(h,m)=>lang==='ru'?(h+' ч'+(m?' '+m+' мин':'')):lang==='hi'?(h+' घं'+(m?' '+m+' मि':'')):(h+' h'+(m?' '+m+' min':''));
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
    const q=String(text||'').trim();if(!q)return null;
    const norm=q.toLocaleLowerCase();
    const list=TUTU_PLACES.search(q,20)||[];
    return list.find(p=>[p.canonical,p.name&&p.name.ru,p.name&&p.name.en,p.name&&p.name.hi].filter(Boolean).some(x=>String(x).toLocaleLowerCase()===norm))||list[0]||null;
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
    const combinedFallback=new Set(['r6','r7']);
    routes.querySelectorAll('.card[data-transport]').forEach(card=>{
      const id=(card.dataset.cta||'').replace(/^route_/,'').replace(/_combined$/,'');
      if(combinedFallback.has(id)){
        const price=card.querySelector('.price');if(price)price.textContent=lang==='ru'?'Уточнить на Туту':lang==='hi'?'टूटू पर देखें':'Check on Tutu';
        const alt=card.querySelector('.price-alt');if(alt)alt.textContent='';
        const meta=card.querySelector('.card-meta');if(meta)meta.textContent=lang==='ru'?'Составной маршрут':lang==='hi'?'संयुक्त मार्ग':'Combined route';
        activate(card,HOME);
        return;
      }
      const d=routeData[id];
      if(d){
        const price=card.querySelector('.price');if(price)price.textContent=(lang==='en'?'from ':lang==='hi'?'से ':'от ')+nf(d.price)+' ₽';
        const alt=card.querySelector('.price-alt');if(alt)alt.textContent='≈ ₹'+Math.round(d.price*RUB_TO_INR).toLocaleString('en-IN');
        const meta=card.querySelector('.card-meta');if(meta)meta.textContent=duration(d.h,d.m);
      }
      activate(card,routeUrl(card));
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
      const name=card.querySelector('.hotel-name');if(name)name.textContent=d.name;
      const meta=card.querySelector('.hotel-meta');if(meta)meta.textContent=d.meta[lang];
      const rating=card.querySelector('.rating');if(rating){if(d.rating)rating.textContent=d.rating;else rating.remove()}
      const price=card.querySelector('.hotel-price');if(price)price.innerHTML=(lang==='ru'?'от ':lang==='hi'?'से ':'from ')+nf(d.price)+' ₽ <span>'+(lang==='ru'?'за ночь':lang==='hi'?'प्रति रात':'per night')+'</span>';
      activate(card,d.url);
    });
    const cta=hotelRow.querySelector('.card--cta');if(cta)cta.href=hotelAllUrl();
  }
})();
