/* Unified city-only search UI for RU / EN / HI. */
(function(){
  'use strict';

  const oldForm=document.querySelector('.search');
  const oldHints=document.querySelector('.search-hints');
  const buttons=[...document.querySelectorAll('.transport button')];
  if(!oldForm||!oldHints||buttons.length<4||!window.TUTU_PLACES)return;

  const pageLang=document.documentElement.lang==='hi'?'hi':document.documentElement.lang==='en'?'en':'ru';
  const locale=pageLang==='en'?'en-GB':pageLang==='hi'?'hi-IN':'ru-RU';
  const modes=['hotel','flight','train','bus'];
  const labels={
    ru:{
      from:'Откуда',to:'Куда',when:'Когда',flightWho:'Кто летит',travelWho:'Кто едет',swap:'Поменять местами',search:'Найти',
      hotelWhere:'Город',hotelDates:'Заезд — выезд',guests:'Кто едет',
      adults:'Взрослые',adultSub:'От 12 лет',children:'Дети',childSub:'До 18 лет',childAge:'Возраст ребёнка',years:'лет',
      economy:'Эконом',business:'Бизнес',cabin:'Класс обслуживания',
      passenger1:'пассажир',passenger2:'пассажира',passenger5:'пассажиров',
      guest1:'гость',guest2:'гостя',guest5:'гостей',
      prev:'Предыдущий месяц',next:'Следующий месяц'
    },
    en:{
      from:'From',to:'To',when:'When',flightWho:'Who is flying',travelWho:'Travellers',swap:'Swap places',search:'Search',
      hotelWhere:'City',hotelDates:'Check-in — check-out',guests:'Guests',
      adults:'Adults',adultSub:'12+ years',children:'Children',childSub:'Under 18',childAge:'Child age',years:'years',
      economy:'Economy',business:'Business',cabin:'Cabin class',
      passenger1:'passenger',passenger2:'passengers',passenger5:'passengers',
      guest1:'guest',guest2:'guests',guest5:'guests',
      prev:'Previous month',next:'Next month'
    },
    hi:{
      from:'कहाँ से',to:'कहाँ तक',when:'तारीख़',flightWho:'कौन यात्रा कर रहा है',travelWho:'यात्री',swap:'स्थान बदलें',search:'खोजें',
      hotelWhere:'शहर',hotelDates:'चेक-इन — चेक-आउट',guests:'मेहमान',
      adults:'वयस्क',adultSub:'12 साल और अधिक',children:'बच्चे',childSub:'18 साल से कम',childAge:'बच्चे की उम्र',years:'साल',
      economy:'इकोनॉमी',business:'बिज़नेस',cabin:'यात्रा की श्रेणी',
      passenger1:'यात्री',passenger2:'यात्री',passenger5:'यात्री',
      guest1:'मेहमान',guest2:'मेहमान',guest5:'मेहमान',
      prev:'पिछला महीना',next:'अगला महीना'
    }
  }[pageLang];

  const states={
    flight:{fromText:'',toText:'',from:null,to:null,date:null,adults:1,children:0,childAges:[],cabin:'economy'},
    train:{fromText:'',toText:'',from:null,to:null,date:null,adults:1,children:0,childAges:[],cabin:null},
    bus:{fromText:'',toText:'',from:null,to:null,date:null,adults:1,children:0,childAges:[],cabin:null},
    hotel:{destinationText:'',destination:null,start:null,end:null,adults:2,children:0,childAges:[],cabin:null}
  };

  let mode='flight';
  let calendarView=new Date(new Date().getFullYear(),new Date().getMonth(),1);
  const today=new Date();today.setHours(0,0,0,0);
  const lastMonth=new Date(today.getFullYear(),today.getMonth()+11,1);

  const form=document.createElement('form');
  form.className='search search-v2';
  form.noValidate=true;
  form.addEventListener('submit',e=>{e.preventDefault();submitSearch()});
  oldForm.replaceWith(form);

  const hints=document.createElement('div');
  hints.className='search-hints search-hints-v2';
  hints.setAttribute('aria-label',pageLang==='ru'?'Популярные варианты':pageLang==='hi'?'लोकप्रिय विकल्प':'Popular options');
  oldHints.replaceWith(hints);

  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const iso=d=>d?d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'):'';
  const dayFmt=new Intl.DateTimeFormat(locale,{day:'numeric',month:'short',weekday:'short'});
  const monthFmt=new Intl.DateTimeFormat(locale,{month:'long'});
  const weekdayFmt=new Intl.DateTimeFormat(locale,{weekday:'short'});
  const compactDayFmt=new Intl.DateTimeFormat(locale,{day:'numeric',month:'short'});

  function plural(n,type){
    if(pageLang==='hi')return type==='guest'?labels.guest1:labels.passenger1;
    if(pageLang==='en')return n===1?(type==='guest'?labels.guest1:labels.passenger1):(type==='guest'?labels.guest5:labels.passenger5);
    const d=n%100,m=n%10;
    const one=d<11||d>14?m===1:false;
    const few=(d<11||d>14)&&m>=2&&m<=4;
    if(type==='guest')return one?labels.guest1:few?labels.guest2:labels.guest5;
    return one?labels.passenger1:few?labels.passenger2:labels.passenger5;
  }

  function travellerValue(){
    const s=states[mode],total=s.adults+s.children,type=mode==='hotel'?'guest':'passenger';
    let text=total+' '+plural(total,type);
    if(mode==='flight')text+=', '+(s.cabin==='business'?labels.business:labels.economy).toLocaleLowerCase(locale);
    return text;
  }

  function formatSingle(d){return d?dayFmt.format(d):''}
  function formatRange(a,b){
    if(!a)return '';
    if(!b)return compactDayFmt.format(a)+' — …';
    return compactDayFmt.format(a)+' – '+compactDayFmt.format(b);
  }

  function selectedPlaceAttrs(place){
    if(!place)return '';
    return ' data-place-id="'+esc(place.id)+'" data-canonical="'+esc(place.canonical)+'" data-country="'+esc(place.country)+'"';
  }

  function placeField(role,caption,placeholder,text,place){
    return '<div class="v2-field v2-field--place '+(text?'has-value':'')+'" data-role="'+role+'">'+
      '<span class="v2-caption">'+esc(caption)+'</span>'+
      '<input class="v2-input" type="text" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="suggest-'+role+'" maxlength="128" value="'+esc(text)+'" placeholder="'+esc(placeholder)+'" aria-label="'+esc(caption)+'"'+selectedPlaceAttrs(place)+'>'+
      '<div class="search-suggest" role="listbox" id="suggest-'+role+'" hidden></div></div>';
  }

  function dateField(caption,value){
    return '<div class="v2-field v2-field--date '+(value?'has-value':'')+'" data-role="date">'+
      '<button type="button" class="v2-trigger" data-trigger="date" aria-haspopup="dialog"><span class="v2-caption">'+esc(caption)+'</span><span class="v2-value">'+esc(value||caption)+'</span></button><div class="v2-calendar" hidden></div></div>';
  }

  function paxField(caption){
    return '<div class="v2-field v2-field--always-caption v2-field--pax" data-role="pax">'+
      '<button type="button" class="v2-trigger" data-trigger="pax" aria-haspopup="dialog"><span class="v2-caption">'+esc(caption)+'</span><span class="v2-value">'+esc(travellerValue())+'</span></button><div class="v2-popover" hidden></div></div>';
  }

  function renderForm(){
    const s=states[mode];
    form.dataset.mode=mode;
    if(mode==='hotel'){
      form.innerHTML=placeField('destination',labels.hotelWhere,labels.hotelWhere,s.destinationText,s.destination)+
        dateField(labels.hotelDates,formatRange(s.start,s.end))+
        paxField(labels.guests)+
        '<button type="submit" class="v2-submit">'+esc(labels.search)+'</button>';
    }else{
      const who=mode==='flight'?labels.flightWho:labels.travelWho;
      form.innerHTML=placeField('from',labels.from,labels.from,s.fromText,s.from)+
        '<button type="button" class="v2-swap" aria-label="'+esc(labels.swap)+'"><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4 4 7l3 3M4 7h13M17 20l3-3-3-3M20 17H7"/></svg></span></button>'+
        placeField('to',labels.to,labels.to,s.toText,s.to)+
        dateField(labels.when,formatSingle(s.date))+
        paxField(who)+
        '<button type="submit" class="v2-submit">'+esc(labels.search)+'</button>';
    }
    bindForm();
    renderHints();
    document.documentElement.dataset.transportMode=mode;
  }

  function preferredPlaces(role){
    let ids;
    if(mode==='hotel'){
      ids=['ru-moscow','ru-saint-petersburg','ru-sochi','in-delhi','in-mumbai','ru-kazan'];
    }else if(mode==='flight'){
      ids=role==='from'
        ?['in-delhi','in-mumbai','in-bengaluru','ru-moscow','ru-saint-petersburg','ru-kazan']
        :['ru-moscow','ru-saint-petersburg','ru-kazan','ru-sochi','in-delhi','in-mumbai'];
    }else{
      ids=role==='from'
        ?['ru-moscow','ru-saint-petersburg','ru-kazan','ru-sochi','ru-samara','ru-nizhny-novgorod']
        :['ru-moscow','ru-saint-petersburg','ru-kazan','ru-sochi','ru-samara','ru-yekaterinburg'];
    }
    return ids.map(id=>TUTU_PLACES.byId.get(id)).filter(Boolean);
  }

  function renderSuggestions(input,role){
    const field=input.closest('.v2-field--place'),box=field.querySelector('.search-suggest'),q=input.value.trim();
    const allowed=p=>!window.TUTU_LINKS||window.TUTU_LINKS.supports(mode,p);
    const results=q?TUTU_PLACES.search(q,6,allowed):preferredPlaces(role).filter(allowed).slice(0,6);
    box.innerHTML=results.map((p,i)=>{
      const d=TUTU_PLACES.display(p,pageLang);
      return '<button type="button" class="suggest-item" role="option" aria-selected="false" id="option-'+role+'-'+i+'" data-place-id="'+esc(p.id)+'"><span class="suggest-main">'+esc(d.name)+'</span><span class="suggest-meta">'+esc(d.meta)+'</span></button>';
    }).join('');
    box.dataset.active='-1';box.hidden=!results.length;
    input.setAttribute('aria-expanded',String(!box.hidden));input.removeAttribute('aria-activedescendant');
  }

  function closeOverlays(except){
    form.querySelectorAll('.search-suggest,.v2-calendar,.v2-popover').forEach(x=>{
      if(x===except)return;
      x.hidden=true;
      const input=x.parentElement.querySelector('.v2-input');
      if(input){input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant')}
    });
  }

  function setPlace(role,place,input){
    const d=TUTU_PLACES.display(place,pageLang),s=states[mode];
    input.value=d.name;
    input.dataset.placeId=place.id;
    input.dataset.canonical=place.canonical;
    input.dataset.country=place.country;
    input.closest('.v2-field').classList.add('has-value');
    if(mode==='hotel'){
      s.destination=place;s.destinationText=d.name;
    }else if(role==='from'){
      s.from=place;s.fromText=d.name;
    }else{
      s.to=place;s.toText=d.name;
    }
  }

  function bindPlaces(){
    form.querySelectorAll('.v2-field--place').forEach(field=>{
      const input=field.querySelector('.v2-input'),role=field.dataset.role,box=field.querySelector('.search-suggest');
      input.addEventListener('focus',()=>{closeOverlays(box);renderSuggestions(input,role)});
      input.addEventListener('click',e=>{e.stopPropagation();closeOverlays(box);renderSuggestions(input,role)});
      input.addEventListener('input',()=>{
        const s=states[mode];
        input.removeAttribute('data-place-id');input.removeAttribute('data-canonical');input.removeAttribute('data-country');
        field.classList.toggle('has-value',!!input.value.trim());
        if(mode==='hotel'){s.destination=null;s.destinationText=input.value}
        else if(role==='from'){s.from=null;s.fromText=input.value}
        else{s.to=null;s.toText=input.value}
        renderSuggestions(input,role);
      });
      input.addEventListener('keydown',e=>{
        if(e.isComposing)return;
        if(e.key==='ArrowDown'||e.key==='ArrowUp'){
          e.preventDefault();if(box.hidden)renderSuggestions(input,role);
          const items=[...box.querySelectorAll('[data-place-id]')];if(!items.length)return;
          const old=Number(box.dataset.active??-1);
          const next=old<0?(e.key==='ArrowDown'?0:items.length-1):(old+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;
          box.dataset.active=String(next);
          items.forEach((item,i)=>item.setAttribute('aria-selected',String(i===next)));
          input.setAttribute('aria-activedescendant',items[next].id);
        }else if(e.key==='Enter'&&!box.hidden&&Number(box.dataset.active)>=0){
          e.preventDefault();const item=box.querySelectorAll('[data-place-id]')[Number(box.dataset.active)];
          if(item){setPlace(role,TUTU_PLACES.byId.get(item.dataset.placeId),input);closeOverlays()}
        }else if(e.key==='Escape'||e.key==='Tab')closeOverlays();
      });
      box.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();
        const item=e.target.closest('[data-place-id]');if(!item)return;
        const p=TUTU_PLACES.byId.get(item.dataset.placeId);if(!p)return;
        setPlace(role,p,input);closeOverlays();
      });
    });
  }

  function calendarClasses(date,s){
    if(mode==='hotel'){
      if(s.start&&+date===+s.start)return ' is-range-start';
      if(s.end&&+date===+s.end)return ' is-range-end';
      if(s.start&&s.end&&date>s.start&&date<s.end)return ' is-in-range';
      return '';
    }
    return s.date&&+date===+s.date?' is-selected':'';
  }

  function renderCalendar(box){
    const s=states[mode],y=calendarView.getFullYear(),m=calendarView.getMonth();
    const offset=(new Date(y,m,1).getDay()+6)%7,count=new Date(y,m+1,0).getDate();
    const title=monthFmt.format(calendarView);
    let html='<div class="cal-head"><button type="button" class="cal-nav" data-step="-1" aria-label="'+esc(labels.prev)+'" '+(+calendarView<=+new Date(today.getFullYear(),today.getMonth(),1)?'disabled':'')+'>‹</button><span class="cal-title">'+esc(title.charAt(0).toUpperCase()+title.slice(1)+' '+y)+'</span><button type="button" class="cal-nav" data-step="1" aria-label="'+esc(labels.next)+'" '+(+calendarView>=+lastMonth?'disabled':'')+'>›</button></div><div class="cal-grid">';
    for(let i=0;i<7;i++)html+='<span class="cal-wd">'+esc(weekdayFmt.format(new Date(2024,0,1+i)))+'</span>';
    html+='<span></span>'.repeat(offset);
    for(let d=1;d<=count;d++){
      const date=new Date(y,m,d),disabled=date<today;
      html+='<button type="button" class="cal-day'+calendarClasses(date,s)+'" data-date="'+iso(date)+'" '+(disabled?'disabled':'')+'>'+d+'</button>';
    }
    box.innerHTML=html+'</div>';
  }

  function parseIso(value){const [y,m,d]=value.split('-').map(Number);return new Date(y,m-1,d)}

  function bindCalendar(){
    const field=form.querySelector('.v2-field--date');if(!field)return;
    const trigger=field.querySelector('[data-trigger="date"]'),box=field.querySelector('.v2-calendar');
    trigger.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      const wasHidden=box.hidden;
      closeOverlays(box);
      if(wasHidden){
        const s=states[mode],focusDate=mode==='hotel'?(s.start||today):(s.date||today);
        calendarView=new Date(focusDate.getFullYear(),focusDate.getMonth(),1);
        renderCalendar(box);box.hidden=false;
      }else box.hidden=true;
    });
    box.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      const nav=e.target.closest('.cal-nav');
      if(nav){calendarView=new Date(calendarView.getFullYear(),calendarView.getMonth()+Number(nav.dataset.step),1);renderCalendar(box);return}
      const day=e.target.closest('.cal-day');
      if(!day||day.disabled)return;
      const chosen=parseIso(day.dataset.date),s=states[mode];
      if(mode==='hotel'){
        if(!s.start||s.end||chosen<=s.start){s.start=chosen;s.end=null}
        else{s.end=chosen}
      }else{s.date=chosen}
      field.classList.add('has-value');
      field.querySelector('.v2-value').textContent=mode==='hotel'?formatRange(s.start,s.end):formatSingle(s.date);
      renderCalendar(box);
      if(mode!=='hotel'||s.end)box.hidden=true;
      renderHints();
    });
  }

  function renderGuestPopover(box){
    const s=states[mode],total=s.adults+s.children;
    if(!Array.isArray(s.childAges))s.childAges=[];
    while(s.childAges.length<s.children)s.childAges.push(5);
    if(s.childAges.length>s.children)s.childAges=s.childAges.slice(0,s.children);
    const ageOptions=value=>Array.from({length:18},(_,age)=>'<option value="'+age+'" '+(Number(value)===age?'selected':'')+'>'+age+' '+esc(labels.years)+'</option>').join('');
    const agesHtml=s.children?'<div class="child-ages-v2">'+s.childAges.map((age,i)=>'<label class="child-age-v2"><span>'+esc(labels.childAge)+' '+(i+1)+'</span><select data-child-age="'+i+'">'+ageOptions(age)+'</select></label>').join('')+'</div>':'';
    box.innerHTML='<div class="guest-row"><div><div class="guest-name">'+esc(labels.adults)+'</div><div class="guest-sub">'+esc(labels.adultSub)+'</div></div><div class="guest-stepper"><button type="button" data-person="adult" data-step="-1" '+(s.adults<=1?'disabled':'')+'>−</button><output>'+s.adults+'</output><button type="button" data-person="adult" data-step="1" '+(total>=9?'disabled':'')+'>+</button></div></div>'+
      '<div class="guest-row"><div><div class="guest-name">'+esc(labels.children)+'</div><div class="guest-sub">'+esc(labels.childSub)+'</div></div><div class="guest-stepper"><button type="button" data-person="child" data-step="-1" '+(s.children<=0?'disabled':'')+'>−</button><output>'+s.children+'</output><button type="button" data-person="child" data-step="1" '+(total>=9?'disabled':'')+'>+</button></div></div>'+agesHtml+
      (mode==='flight'?'<div class="cabin-row"><div class="cabin-title">'+esc(labels.cabin)+'</div><div class="cabin-tabs"><button type="button" data-cabin="economy" class="'+(s.cabin==='economy'?'is-active':'')+'">'+esc(labels.economy)+'</button><button type="button" data-cabin="business" class="'+(s.cabin==='business'?'is-active':'')+'">'+esc(labels.business)+'</button></div></div>':'');
  }

  function bindPax(){
    const field=form.querySelector('.v2-field--pax');if(!field)return;
    const trigger=field.querySelector('[data-trigger="pax"]'),box=field.querySelector('.v2-popover');
    trigger.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      const wasHidden=box.hidden;closeOverlays(box);
      if(wasHidden){renderGuestPopover(box);box.hidden=false}else box.hidden=true;
    });
    box.addEventListener('change',e=>{
      const age=e.target.closest('[data-child-age]');if(!age)return;
      const s=states[mode],i=Number(age.dataset.childAge);
      if(!Array.isArray(s.childAges))s.childAges=[];s.childAges[i]=Number(age.value);
    });
    box.addEventListener('click',e=>{
      if(e.target.closest('select,option')){e.stopPropagation();return}
      e.preventDefault();e.stopPropagation();
      const step=e.target.closest('[data-step]');
      if(step){
        const s=states[mode],delta=Number(step.dataset.step);
        if(step.dataset.person==='adult')s.adults=Math.max(1,Math.min(9-s.children,s.adults+delta));
        else{
          s.children=Math.max(0,Math.min(9-s.adults,s.children+delta));
          if(!Array.isArray(s.childAges))s.childAges=[];
          while(s.childAges.length<s.children)s.childAges.push(5);
          if(s.childAges.length>s.children)s.childAges=s.childAges.slice(0,s.children);
        }
        field.querySelector('.v2-value').textContent=travellerValue();renderGuestPopover(box);return;
      }
      const cab=e.target.closest('[data-cabin]');
      if(cab){states[mode].cabin=cab.dataset.cabin;field.querySelector('.v2-value').textContent=travellerValue();renderGuestPopover(box)}
    });
  }

  function bindSwap(){
    const swap=form.querySelector('.v2-swap');if(!swap)return;
    swap.addEventListener('click',()=>{
      const s=states[mode];
      [s.fromText,s.toText]=[s.toText,s.fromText];[s.from,s.to]=[s.to,s.from];renderForm();
    });
  }

  function submitSearch(){
    const state=states[mode],roles=mode==='hotel'?['destination']:['from','to'];
    // Exact multilingual names are enough; partial/ambiguous input is never guessed.
    roles.forEach(role=>{
      if(state[role])return;
      const p=TUTU_PLACES.resolveExact(state[role+'Text'],p=>!window.TUTU_LINKS||TUTU_LINKS.supports(mode,p));
      const input=form.querySelector('[data-role="'+role+'"] input');
      if(p&&input)setPlace(role,p,input);
    });
    const unknown=roles.some(role=>String(state[role+'Text']||'').trim()&&!state[role]);
    if(unknown){window.location.assign('https://www.tutu.ru/');return}
    try{
      if(!window.TUTU_LINKS){window.location.assign('https://www.tutu.ru/');return}
      const url=window.TUTU_LINKS.build(mode,state);
      window.location.assign(url);
    }catch(err){
      const code=err&&err.code?err.code:'unsupported';
      if(code==='unsupported'){window.location.assign('https://www.tutu.ru/');return}
      alert(window.TUTU_LINKS.message(code,pageLang));
    }
  }

  function bindForm(){bindPlaces();bindCalendar();bindPax();bindSwap()}

  function setQuickPlace(role,id){
    const p=TUTU_PLACES.byId.get(id);if(!p)return;
    const input=form.querySelector('.v2-field--place[data-role="'+role+'"] .v2-input');if(!input)return;
    setPlace(role,p,input);closeOverlays();
  }

  function setQuickDate(offset,length){
    const start=new Date(today);start.setDate(start.getDate()+offset);
    const s=states[mode];
    if(mode==='hotel'){
      const end=new Date(start);end.setDate(end.getDate()+(length||1));s.start=start;s.end=end;
    }else{s.date=start}
    renderForm();
  }

  function renderHints(){
    hints.dataset.mode=mode;
    let a=[],b=[];
    if(mode==='hotel'){
      a=[['ru-moscow'],['ru-saint-petersburg'],['ru-sochi']];
      b=[[0,1],[1,1]];
    }else if(mode==='flight'){
      a=[['in-delhi','from'],['in-mumbai','from'],['ru-moscow','to'],['ru-saint-petersburg','to']];
      b=[[0,0],[1,0]];
    }else{
      a=[['ru-moscow','from'],['ru-saint-petersburg','from'],['ru-kazan','to'],['ru-tver','to']];
      b=[[0,0],[1,0]];
    }
    const placeChip=item=>{const id=item[0],role=mode==='hotel'?'destination':item[1],p=TUTU_PLACES.byId.get(id);if(!p)return '';return '<button type="button" class="quick-chip-v2" data-v2-place="'+esc(id)+'" data-v2-role="'+esc(role)+'">'+esc(TUTU_PLACES.display(p,pageLang).name)+'</button>'};
    const dateHtml=b.map(x=>{
      const start=new Date(today);start.setDate(start.getDate()+x[0]);
      const label=mode==='hotel'?compactDayFmt.format(start)+' – '+compactDayFmt.format(new Date(start.getFullYear(),start.getMonth(),start.getDate()+(x[1]||1))):(x[0]===0?(pageLang==='ru'?'Сегодня':pageLang==='hi'?'आज':'Today'):(pageLang==='ru'?'Завтра':pageLang==='hi'?'कल':'Tomorrow'));
      return '<button type="button" class="quick-chip-v2" data-v2-date="'+x[0]+'" data-v2-length="'+x[1]+'">'+esc(label)+'</button>';
    }).join('');
    if(mode==='hotel'){
      const destinationHtml=a.map(placeChip).join('');
      hints.innerHTML='<div class="quick-group-v2 quick-group-v2--destination">'+destinationHtml+'</div><div class="quick-group-v2 quick-group-v2--date">'+dateHtml+'</div>';
    }else{
      const fromHtml=a.filter(item=>item[1]==='from').map(placeChip).join('');
      const toHtml=a.filter(item=>item[1]==='to').map(placeChip).join('');
      hints.innerHTML='<div class="quick-group-v2 quick-group-v2--from">'+fromHtml+'</div><div class="quick-group-v2 quick-group-v2--to">'+toHtml+'</div><div class="quick-group-v2 quick-group-v2--date">'+dateHtml+'</div>';
    }
  }

  hints.addEventListener('click',e=>{
    const p=e.target.closest('[data-v2-place]');if(p){setQuickPlace(p.dataset.v2Role,p.dataset.v2Place);return}
    const d=e.target.closest('[data-v2-date]');if(d)setQuickDate(Number(d.dataset.v2Date),Number(d.dataset.v2Length));
  });

  buttons.forEach((button,index)=>button.addEventListener('click',()=>{
    mode=modes[index];
    buttons.forEach((b,i)=>{const active=i===index;b.classList.toggle('is-active',active);b.setAttribute('aria-selected',String(active))});
    closeOverlays();renderForm();
  }));

  document.addEventListener('click',e=>{if(!e.target.closest('.search-v2'))closeOverlays()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeOverlays()});

  renderForm();
})();
