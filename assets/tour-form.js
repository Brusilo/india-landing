/* Tutu India tour-search mode. Does not change flight/train/bus/hotel handlers. */
(function(){
'use strict';
const data=window.TUTU_TOURS;
const tab=document.querySelector('.transport .tours-tab');
const form=document.querySelector('form.search-v2');
const hints=document.querySelector('.search-hints-v2');
if(!data||!tab||!form||!hints)return;
const lang=document.documentElement.lang==='hi'?'hi':document.documentElement.lang==='ru'?'ru':'en';
const dict={
ru:{selectDeparture:'Выберите город отправления из списка',selectDate:'Выберите дату вылета',departureMeta:'Город отправления',countryMeta:'Страна',previewMessage:'Это демонстрационная форма: направления и параметры выбираются, но поиск и бронирование пока не запускаются.',from:'Откуда',findDeparture:'Поиск города отправления',destination:'Страна, курорт или город',date:'Когда',nights:'Кол-во ночей',who:'Кто едет',search:'Найти',min:'от',max:'до',night:'ночей',adults:'Взрослые',adult:'взрослый',adult2:'взрослых',children:'Дети',child:'ребёнок',child2:'детей',childAge:'Возраст на конец поездки',ageRequired:'Укажите возраст каждого ребёнка.',invalid:'Проверьте параметры тура.',fallbackDeparture:'Этот город вылета пока нельзя передать в поиск автоматически. На Туту потребуется снова выбрать город, даты, ночи и туристов. Продолжить?',fallbackPair:'Откроется страница выбранного маршрута из вашего города. Даты, ночи и туристов понадобится указать на Туту ещё раз. Продолжить?',fallbackChildren:'Для поиска тура с детьми нужно повторно выбрать количество и возраст детей на Туту, а также даты и ночи. Продолжить?',select:'Выберите направление из списка',fallback:'Откроется страница выбранного направления на Туту. Дату, ночи и число туристов, возможно, потребуется указать повторно. Продолжить?',fallbackNearby:'Для Териберки пока не подтверждена отдельная страница туров. Откроется страница туров в Мурманск: даты, ночи и туристов нужно будет выбрать заново. Продолжить?',winter:'Зимняя сказка в России',countries:'Страны',dates:'Дата вылета',reset:'Вернуться к поиску',chipDate:'Завтра',noResults:'Ничего не найдено',range:'Диапазон ночей',unavailableDestination:'Для этого направления пока нет точной поисковой ссылки. Выберите другое направление.',unavailableDeparture:'Для этого города вылета пока нет точной поисковой ссылки. Выберите другой город.',unavailableChildren:'Пока не можем корректно передать возраст детей в поиск туров. Выберите поиск без детей.'},
en:{selectDeparture:'Select a departure city from the list',selectDate:'Choose your departure date',departureMeta:'Departure city',countryMeta:'Country',previewMessage:'Preview only: you can choose a destination and dates, but tour search and booking are not active yet.',findDeparture:'Search departure cities',from:'From',destination:'Country, resort or city',date:'Departure',nights:'Nights',who:'Travellers',search:'Search',min:'from',max:'to',night:'nights',adults:'Adults',adult:'adult',adult2:'adults',children:'Children',child:'child',child2:'children',childAge:'Age at end of trip',ageRequired:'Select the age of each child.',invalid:'Check your tour details.',fallbackDeparture:'This departure city cannot yet be passed automatically. On Tutu, choose the departure city, dates, nights and travellers again. Continue?',fallbackPair:'This opens the route page from your chosen city. Please choose dates, nights and travellers again on Tutu. Continue?',fallbackChildren:'For tours with children, please choose the children’s ages and count again on Tutu, along with the dates and nights. Continue?',select:'Select a destination from the suggestions',fallback:'This opens the selected Tutu destination. Dates, nights and travellers may need to be set again on the next page. Continue?',fallbackNearby:'A separate tour page for Teriberka is not verified. Open Murmansk tours instead? You will need to choose the dates, nights and travellers again.',winter:'Winter in Russia',countries:'Countries',dates:'Departure date',reset:'Back to search',chipDate:'Tomorrow',noResults:'No results',range:'Number of nights',unavailableDestination:'An exact tour-search link is not available for this destination yet. Choose another destination.',unavailableDeparture:'An exact tour-search link is not available for this departure city yet. Choose another city.',unavailableChildren:'Child ages cannot yet be transferred accurately to tour search. Please search without children.'},
hi:{selectDeparture:'सूची से प्रस्थान का शहर चुनें',selectDate:'रवाना होने की तारीख़ चुनें',departureMeta:'प्रस्थान का शहर',countryMeta:'देश',previewMessage:'यह डेमो फ़ॉर्म है। जगह और तारीख़ चुन सकते हैं, लेकिन अभी टूर खोज और बुकिंग चालू नहीं है।',findDeparture:'प्रस्थान का शहर खोजें',from:'कहाँ से',destination:'देश, रिज़ॉर्ट या शहर',date:'कब',nights:'कितनी रातें',who:'यात्री',search:'खोजें',min:'से',max:'तक',night:'रातें',adults:'वयस्क',adult:'वयस्क',adult2:'वयस्क',children:'बच्चे',child:'बच्चा',child2:'बच्चे',childAge:'यात्रा के अंत में उम्र',ageRequired:'हर बच्चे की उम्र चुनें।',invalid:'टूर की जानकारी जाँचें।',fallbackDeparture:'इस शहर से प्रस्थान को अभी सीधे खोज में नहीं भेज सकते। टूटू पर शहर, तारीख़, रातें और यात्रियों को दोबारा चुनना होगा। आगे बढ़ें?',fallbackPair:'आपके चुने हुए शहर से इस मार्ग का पेज खुलेगा। टूटू पर तारीख़, रातें और यात्रियों को फिर चुनें। आगे बढ़ें?',fallbackChildren:'बच्चों के साथ टूर के लिए टूटू पर बच्चों की संख्या, उम्र, तारीख़ और रातें दोबारा चुननी होंगी। आगे बढ़ें?',select:'सूची से जगह चुनें',fallback:'टूटू पर चुनी हुई जगह का पेज खुलेगा। तारीख़, रातों की संख्या और यात्रियों को वहाँ दोबारा चुनना पड़ सकता है। आगे बढ़ें?',fallbackNearby:'तेरिबेरका के लिए अलग टूर पेज की पुष्टि नहीं हुई है। मुर्मांस्क के टूर खुलेंगे, जहाँ तारीख़, रातें और यात्रियों को दोबारा चुनना होगा। आगे बढ़ें?',winter:'रूस की सर्दियाँ',countries:'देश',dates:'रवाना होने की तारीख़',reset:'खोज पर वापस जाएँ',chipDate:'कल',noResults:'कोई परिणाम नहीं',range:'रातों की संख्या',unavailableDestination:'इस जगह के लिए सही टूर खोज लिंक अभी उपलब्ध नहीं है। कृपया दूसरी जगह चुनें।',unavailableDeparture:'इस प्रस्थान शहर के लिए सही टूर खोज लिंक अभी उपलब्ध नहीं है। कृपया दूसरा शहर चुनें।',unavailableChildren:'बच्चों की उम्र अभी टूर खोज में सही तरीके से नहीं भेज सकते। फ़िलहाल बिना बच्चों के खोजें।'}
}[lang];

const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const normalize=s=>String(s||'').normalize('NFD').toLocaleLowerCase()
  .replace(/[\u0300-\u036f]/g,'').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const today=new Date();
const initialDate=new Date(today.getFullYear(),today.getMonth(),today.getDate()+2);
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const dateLabel=d=>new Intl.DateTimeFormat(lang==='ru'?'ru-RU':lang==='hi'?'hi-IN':'en-GB',
  {day:'numeric',month:'short',weekday:'short'}).format(new Date(d+'T12:00:00'));

// Same unfilled defaults as all other Tutu search modes.
// Nights and travellers are the only pre-selected values.
const state={departure:null,destination:null,departureText:'',destinationText:'',date:null,
  nightsMin:7,nightsMax:14,adults:1,children:0,childAges:[]};
const persistence=window.TUTU_SEARCH_PERSIST;
function restoreTour(){
 const raw=persistence?.read().tour;
 if(!raw||typeof raw!=='object')return;
 for(const role of ['departure','destination']){
   const item=role==='departure'?data.departureByKey.get(raw[role]):data.byKey.get(raw[role]);
   state[role]=item?item.key:null;
   state[role+'Text']=item?'':typeof raw[role+'Text']==='string'?raw[role+'Text'].slice(0,128):'';
 }
 const date=raw.date;
 if(typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)){
   const d=new Date(date+'T12:00:00');
   if(!Number.isNaN(d.getTime())&&iso(d)===date&&date>=iso(new Date()))state.date=date;
 }
 state.nightsMin=Number.isInteger(raw.nightsMin)?Math.max(1,Math.min(29,raw.nightsMin)):7;
 state.nightsMax=Number.isInteger(raw.nightsMax)
   ?Math.max(state.nightsMin,Math.min(29,raw.nightsMax)):Math.max(14,state.nightsMin);
 state.adults=Number.isInteger(raw.adults)?Math.max(1,Math.min(6,raw.adults)):1;
 state.children=Number.isInteger(raw.children)
   ?Math.max(0,Math.min(3,9-state.adults,raw.children)):0;
 state.childAges=Array.isArray(raw.childAges)
   ?raw.childAges.slice(0,state.children).map(age=>Number.isInteger(age)&&age>=0&&age<=17?age:null):[];
 while(state.childAges.length<state.children)state.childAges.push(null);
}
function saveTour(){
 if(!persistence)return;
 persistence.saveTour({
   departure:state.departure,destination:state.destination,
   departureText:state.departureText,destinationText:state.destinationText,
   date:state.date,nightsMin:state.nightsMin,nightsMax:state.nightsMax,
   adults:state.adults,children:state.children,childAges:[...state.childAges]
 });
}
restoreTour();
let active=false;
let savedForm=null,savedHints=null,savedMode=null;
let calendarMonth=new Date(initialDate.getFullYear(),initialDate.getMonth(),1);
let overlay=null;

function placeField(role,caption){
 const item=role==='departure'?data.departureByKey.get(state.departure):data.byKey.get(state.destination);
 const value=item?(item.name[lang]||item.name.en||item.ru):state[role+'Text']||'';
 return '<div class="v2-field v2-field--place tour-cell tour-cell--'+role+(value?' has-value':'')+
   '" data-role="'+(role==='departure'?'from':'to')+'">'+
   '<span class="v2-caption">'+esc(caption)+'</span>'+
   '<input type="text" class="v2-input tour-'+(role==='departure'?'departure-input':'destination')+
   '" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list"'+
   ' aria-expanded="false" aria-controls="tour-list-'+role+'" maxlength="128"'+
   ' aria-label="'+esc(caption)+'" value="'+esc(value)+'" placeholder="'+esc(caption)+'">'+
   '<div class="search-suggest tour-panel--'+role+'" id="tour-list-'+role+
   '" role="listbox" hidden></div></div>';
}
function triggerField(name,caption,value){
 const isDate=name==='date';
 const className=isDate?'v2-field--date':'v2-field--always-caption'+(name==='people'?' v2-field--pax':'');
 return '<div class="v2-field '+className+' tour-cell tour-cell--'+name+
   (isDate&&value?' has-value':'')+'" data-role="'+name+'">'+
   '<button type="button" class="v2-trigger" data-tour-trigger="'+name+
   '" aria-haspopup="dialog" aria-expanded="false">'+
   '<span class="v2-caption">'+esc(caption)+'</span>'+
   '<span class="v2-value">'+esc(value||caption)+'</span></button>'+
   '<div class="'+(isDate?'v2-calendar':'v2-popover')+
   ' tour-panel--'+name+'" hidden></div></div>';
}
function close(){
 form.querySelectorAll('.search-suggest,.tour-panel--date,.tour-panel--nights,.tour-panel--people')
   .forEach(box=>{box.hidden=true;box.dataset.active='-1'});
 form.querySelectorAll('[data-tour-trigger],.tour-destination,.tour-departure-input').forEach(el=>{
   el.setAttribute('aria-expanded','false');
   el.removeAttribute('aria-activedescendant');
 });
 overlay=null;
}
function show(type,html,refresh=false){
 const cell=form.querySelector('.tour-cell--'+type);
 const box=cell&&cell.querySelector('.tour-panel--'+type);
 if(!box)return;
 if(overlay===type&&!refresh){close();return}
 close();
 box.innerHTML=html;box.hidden=false;box.dataset.active='-1';overlay=type;
 const opener=cell.querySelector('[data-tour-trigger],.v2-input');
 if(opener)opener.setAttribute('aria-expanded','true');
}
function guestValue(){
 let summary=state.adults+' '+(state.adults===1?dict.adult:dict.adult2);
 if(state.children)summary+=', '+state.children+' '+
   (state.children===1?dict.child:dict.child2);
 return summary;
}
function renderHints(){
 // Native Tutu shortcuts: two departure cities and three destinations.
 // Hidden entirely on mobile, unlike form fields and autocomplete.
 const departures=['moscow','spb'].map(key=>{
   const d=data.departureByKey.get(key);
   return d?'<button type="button" class="quick-chip-v2" data-tour-dep="'+esc(key)+'">'+
     esc(d.name[lang]||d.name.en)+'</button>':'';
 }).join('');
 hints.innerHTML='<div class="quick-group-v2 quick-group-v2--from">'+departures+'</div>'+
   '<div class="quick-group-v2 quick-group-v2--destination">'+
   ['kaliningrad','baikal','turkey'].map(key=>{
     const d=data.byKey.get(key);
     return '<button type="button" class="quick-chip-v2" data-tour-choice="'+esc(key)+'">'+
       esc(d.name[lang]||d.name.en)+'</button>';
   }).join('')+'</div>'+
   '<div class="quick-group-v2 quick-group-v2--date">'+
   [0,1].map(offset=>'<button type="button" class="quick-chip-v2" data-tour-date="'+offset+'">'+
     esc(offset===0?(lang==='ru'?'Сегодня':lang==='hi'?'आज':'Today'):
       (lang==='ru'?'Завтра':lang==='hi'?'कल':'Tomorrow'))+'</button>').join('')+'</div>';
}
function showSearchIssue(message){
 let issue=document.querySelector('.tour-search-issue');
 if(!issue){
   issue=document.createElement('p');
   issue.className='tour-search-issue';
   issue.setAttribute('role','status');
   hints.insertAdjacentElement('afterend',issue);
 }
 issue.textContent=message;
}
function hideSearchIssue(){
 document.querySelector('.tour-search-issue')?.remove();
}
function render(){
 hideSearchIssue();
 close();
 form.innerHTML=
   placeField('departure',dict.from)+
   placeField('destination',dict.destination)+
   triggerField('date',dict.date,state.date?dateLabel(state.date):'')+
   triggerField('nights',dict.nights,state.nightsMin+'–'+state.nightsMax+' '+dict.night)+
   triggerField('people',dict.who,guestValue())+
   '<button type="submit" class="v2-submit tour-submit">'+esc(dict.search)+'</button>';
 renderHints();
 bind();
 saveTour();
}
function placeMeta(d){
 if(d.kind==='winter')return data.byKey.get('russia').name[lang];
 if(d.kind==='resort'||d.kind==='place')return data.byKey.get(d.parent)?.name[lang]||dict.countryMeta;
 return dict.countryMeta;
}
function destinationPanel(q){
 const items=data.find(q,6);
 return items.map((x,i)=>'<button type="button" class="suggest-item" role="option"'+
   ' aria-selected="false" id="tour-destination-option-'+i+'" data-tour-choice="'+esc(x.key)+'">'+
   '<span class="suggest-main">'+esc(x.name[lang]||x.name.en)+'</span>'+
   '<span class="suggest-meta">'+esc(placeMeta(x))+'</span></button>').join('')||
   '<p class="tour-empty">'+esc(dict.noResults)+'</p>';
}
function originMatches(q){
 const n=normalize(q);
 if(!n)return ['moscow','spb','kazan','ekaterinburg'].map(k=>data.departureByKey.get(k)).filter(Boolean);
 const ranked=data.departures.filter(d=>
   Object.values(d.name).some(v=>normalize(v).includes(n))||
   normalize(d.aliases||'').includes(n));
 const priority=d=>{
   const names=Object.values(d.name).map(normalize);
   if(names.some(v=>v===n))return 0;
   if(names.some(v=>v.startsWith(n)))return 1;
   if(names.some(v=>v.includes(n)))return 2;
   return 3;
 };
 return ranked.sort((a,b)=>priority(a)-priority(b)).slice(0,6);
}

const departureCountryIds={
 kazakhstan:[3,4,5,9,11,31,59,77,86,197],
 kyrgyzstan:[14,155,198],
 belarus:[17,45,194,195,196],
 uzbekistan:[94,199,200,201,202,203,205],
 azerbaijan:[204,212],
 georgia:[206,208],
 armenia:[209]
};
const departureCountryNames={
 ru:{russia:'Россия',kazakhstan:'Казахстан',kyrgyzstan:'Кыргызстан',belarus:'Беларусь',uzbekistan:'Узбекистан',azerbaijan:'Азербайджан',georgia:'Грузия',armenia:'Армения'},
 en:{russia:'Russia',kazakhstan:'Kazakhstan',kyrgyzstan:'Kyrgyzstan',belarus:'Belarus',uzbekistan:'Uzbekistan',azerbaijan:'Azerbaijan',georgia:'Georgia',armenia:'Armenia'},
 hi:{russia:'रूस',kazakhstan:'कज़ाख़स्तान',kyrgyzstan:'किर्गिज़स्तान',belarus:'बेलारूस',uzbekistan:'उज़्बेकिस्तान',azerbaijan:'अज़रबैजान',georgia:'जॉर्जिया',armenia:'आर्मेनिया'}
};
function departureCountryName(d){
 const id=Number(d.id);
 const key=Object.keys(departureCountryIds).find(country=>departureCountryIds[country].includes(id))||'russia';
 return departureCountryNames[lang][key];
}
function departurePanel(q){
 const items=originMatches(q);
 return items.map((d,i)=>'<button type="button" class="suggest-item" role="option"'+
  ' aria-selected="false" id="tour-departure-option-'+i+'" data-tour-dep="'+esc(d.key)+'">'+
  '<span class="suggest-main">'+esc(d.name[lang]||d.name.en)+'</span>'+
  '<span class="suggest-meta">'+esc(departureCountryName(d))+'</span></button>').join('')||
  '<p class="tour-empty">'+esc(dict.noResults)+'</p>';
}
function guestPanel(){
 const row=(kind,title,count,min,max)=>'<div class="guest-row"><div class="guest-name">'+esc(title)+
   '</div><div class="guest-stepper">'+
   '<button type="button" data-tour-person="'+kind+'" data-tour-step="-1" '+
   (count<=min?'disabled':'')+' aria-label="-">−</button><output>'+count+'</output>'+
   '<button type="button" data-tour-person="'+kind+'" data-tour-step="1" '+
   (count>=max?'disabled':'')+' aria-label="+">+</button></div></div>';
 let html=row('adult',dict.adults,state.adults,1,6)+
   row('child',dict.children,state.children,0,Math.min(3,9-state.adults));
 if(state.children){
   html+='<div class="child-ages-v2">';
   for(let i=0;i<state.children;i++){
     html+='<label class="child-age-v2"><span>'+esc(dict.childAge)+' '+(i+1)+'</span>'+
       '<select data-tour-child-age="'+i+'" aria-label="'+esc(dict.childAge)+' '+(i+1)+'">'+
       '<option value="" '+(state.childAges[i]==null?'selected':'disabled')+'>—</option>'+
       Array.from({length:18},(_,n)=>'<option value="'+n+'" '+
         (state.childAges[i]===n?'selected':'')+'>'+n+'</option>').join('')+
       '</select></label>';
   }
   html+='</div>';
 }
 return html;
}
function rangePercent(n){return ((n-1)/28*100).toFixed(2)+'%'}
function nightsPanel(){
 return '<div class="tour-night-head"><span>'+esc(dict.min)+' <b data-tour-min>'+
   state.nightsMin+'</b></span><span>'+esc(dict.max)+' <b data-tour-max>'+
   state.nightsMax+'</b> '+esc(dict.night)+'</span></div>'+
   '<div class="tour-range" style="--tour-from:'+rangePercent(state.nightsMin)+
   ';--tour-to:'+rangePercent(state.nightsMax)+'">'+
   '<div class="tour-track" aria-hidden="true"></div>'+
   '<input type="range" min="1" max="29" value="'+state.nightsMin+
   '" data-tour-range="min" aria-label="'+esc(dict.min+' '+dict.night)+'">'+
   '<input type="range" min="1" max="29" value="'+state.nightsMax+
   '" data-tour-range="max" aria-label="'+esc(dict.max+' '+dict.night)+'"></div>';
}
function openCalendar(refresh=false){
 const year=calendarMonth.getFullYear(),month=calendarMonth.getMonth();
 const first=new Date(year,month,1),startOffset=(first.getDay()+6)%7;
 const last=new Date(year,month+1,0).getDate();
 const monthName=new Intl.DateTimeFormat(lang==='ru'?'ru-RU':lang==='hi'?'hi-IN':'en-GB',
   {month:'long'}).format(first);
 const todayIso=iso(new Date()),cutoff=new Date();
 cutoff.setMonth(cutoff.getMonth()+11);
 let html='<div class="cal-head"><button type="button" class="cal-nav" data-tour-nav="-1"'+
   (first<=new Date(today.getFullYear(),today.getMonth(),1)?' disabled':'')+
   ' aria-label="Previous month">‹</button><span class="cal-title">'+
   esc(monthName.charAt(0).toUpperCase()+monthName.slice(1)+' '+year)+'</span>'+
   '<button type="button" class="cal-nav" data-tour-nav="1"'+
   (first>=new Date(cutoff.getFullYear(),cutoff.getMonth(),1)?' disabled':'')+
   ' aria-label="Next month">›</button></div><div class="cal-grid">';
 const weekdays=lang==='ru'?['Пн','Вт','Ср','Чт','Пт','Сб','Вс']:
   lang==='hi'?['सो','मं','बु','गु','शु','श','र']:
   ['Mo','Tu','We','Th','Fr','Sa','Su'];
 html+=weekdays.map(x=>'<span class="cal-wd">'+esc(x)+'</span>').join('')+
   '<span></span>'.repeat(startOffset);
 for(let i=1;i<=last;i++){
   const d=iso(new Date(year,month,i));
   html+='<button type="button" class="cal-day'+(state.date===d?' is-selected':'')+
     '" data-tour-day="'+d+'" '+(d<todayIso||d>iso(cutoff)?'disabled':'')+'>'+i+'</button>';
 }
 show('date',html+'</div>',refresh);
}
function commitSelection(role,key){
 const item=role==='departure'?data.departureByKey.get(key):data.byKey.get(key);
 if(!item)return;
 state[role]=key;
 state[role+'Text']='';
 render();
}
function bind(){
 for(const role of ['departure','destination']){
   const field=form.querySelector('.tour-cell--'+role),input=field.querySelector('.v2-input');
   const suggestions=()=>role==='departure'?departurePanel(input.value):destinationPanel(input.value);
   const open=()=>show(role,suggestions(),true);
   input.addEventListener('focus',()=>{input.select();open()});
   input.addEventListener('click',e=>{e.stopPropagation();open()});
   input.addEventListener('input',()=>{
     state[role]=null;
     state[role+'Text']=input.value;
     field.classList.toggle('has-value',Boolean(input.value.trim()));
     saveTour();
     open();
   });
   input.addEventListener('keydown',e=>{
     if(e.isComposing)return;
     const box=field.querySelector('.search-suggest');
     if(e.key==='ArrowDown'||e.key==='ArrowUp'){
       e.preventDefault();
       if(box.hidden)open();
       const items=[...box.querySelectorAll('.suggest-item')];
       if(!items.length)return;
       const index=Number(box.dataset.active||-1);
       const step=e.key==='ArrowDown'?1:-1;
       const next=index<0?(step===1?0:items.length-1):(index+step+items.length)%items.length;
       box.dataset.active=String(next);
       items.forEach((x,i)=>x.setAttribute('aria-selected',String(i===next)));
       input.setAttribute('aria-activedescendant',items[next].id);
     }else if(e.key==='Enter'){
       const item=box.querySelector('[aria-selected="true"]')||
         (box.querySelectorAll('.suggest-item').length===1?box.querySelector('.suggest-item'):null);
       let key=item&&(role==='departure'?item.dataset.tourDep:item.dataset.tourChoice);
       if(!key){
         const matches=role==='departure'?data.departures:data.destinations;
         const exact=matches.find(x=>Object.values(x.name).some(v=>normalize(v)===normalize(input.value)));
         key=exact&&exact.key;
       }
       if(key){e.preventDefault();e.stopPropagation();commitSelection(role,key)}
       else if(!box.hidden)e.preventDefault();
     }else if(e.key==='Escape'||e.key==='Tab'){close()}
   });
 }
 form.querySelector('[data-tour-trigger="nights"]').addEventListener('click',()=>show('nights',nightsPanel()));
 form.querySelector('[data-tour-trigger="people"]').addEventListener('click',()=>show('people',guestPanel()));
 form.querySelector('[data-tour-trigger="date"]').addEventListener('click',()=>{
   const d=state.date?new Date(state.date+'T12:00:00'):initialDate;
   calendarMonth=new Date(d.getFullYear(),d.getMonth(),1);
   openCalendar();
 });
}
function activate(){
 if(active)return;
 active=true;
 savedForm=[...form.childNodes];savedHints=[...hints.childNodes];savedMode=form.dataset.mode;
 savedForm.forEach(n=>n.remove());savedHints.forEach(n=>n.remove());
 form.dataset.mode='tour';hints.dataset.mode='tour';
 tab.classList.add('is-active');tab.setAttribute('aria-selected','true');
 document.querySelectorAll('.transport button:not(.tours-tab)').forEach(b=>{
   b.classList.remove('is-active');b.setAttribute('aria-selected','false');
 });
 render();
 persistence?.setActive('tour');
}
function deactivate(){
 if(!active)return;
 active=false;close();hideSearchIssue();
 form.replaceChildren(...savedForm);hints.replaceChildren(...savedHints);
 form.dataset.mode=savedMode;hints.dataset.mode=savedMode;
 tab.classList.remove('is-active');tab.setAttribute('aria-selected','false');
}
tab.addEventListener('click',e=>{e.preventDefault();activate()});
document.querySelectorAll('.transport button:not(.tours-tab)')
 .forEach(b=>b.addEventListener('click',()=>deactivate(),true));

form.addEventListener('click',e=>{
 if(!active)return;
 const origin=e.target.closest('[data-tour-dep]');
 if(origin){e.preventDefault();commitSelection('departure',origin.dataset.tourDep);return}
 const dest=e.target.closest('[data-tour-choice]');
 if(dest){e.preventDefault();commitSelection('destination',dest.dataset.tourChoice);return}
 const nav=e.target.closest('[data-tour-nav]');
 if(nav){
   e.preventDefault();
   calendarMonth.setMonth(calendarMonth.getMonth()+Number(nav.dataset.tourNav));
   openCalendar(true);return;
 }
 const day=e.target.closest('[data-tour-day]');
 if(day){
   e.preventDefault();state.date=day.dataset.tourDay;render();return;
 }
 const step=e.target.closest('[data-tour-step]');
 if(step){
   e.preventDefault();
   const delta=Number(step.dataset.tourStep);
   if(step.dataset.tourPerson==='child'){
     state.children=Math.max(0,Math.min(3,9-state.adults,state.children+delta));
     while(state.childAges.length<state.children)state.childAges.push(null);
     state.childAges.length=state.children;
   }else state.adults=Math.max(1,Math.min(6,state.adults+delta));
   render();
   form.querySelector('[data-tour-trigger="people"]').click();
 }
});
hints.addEventListener('click',e=>{
 if(!active)return;
 const departure=e.target.closest('[data-tour-dep]');
 if(departure){e.preventDefault();commitSelection('departure',departure.dataset.tourDep);return}
 const selected=e.target.closest('[data-tour-choice]');
 if(selected){e.preventDefault();commitSelection('destination',selected.dataset.tourChoice);return}
 const dateHint=e.target.closest('[data-tour-date]');
 if(dateHint){
   e.preventDefault();
   const d=new Date();
   d.setDate(d.getDate()+Number(dateHint.dataset.tourDate));
   state.date=iso(d);
   render();
 }
},true);
form.addEventListener('input',e=>{
 if(!active)return;
 hideSearchIssue();
 const el=e.target.closest('[data-tour-range]');
 if(!el)return;
 const val=Number(el.value);
 if(el.dataset.tourRange==='min')state.nightsMin=Math.min(val,state.nightsMax);
 else state.nightsMax=Math.max(val,state.nightsMin);
 const panel=form.querySelector('.tour-panel--nights');
 panel.querySelector('[data-tour-min]').textContent=state.nightsMin;
 panel.querySelector('[data-tour-max]').textContent=state.nightsMax;
 panel.querySelector('[data-tour-range="min"]').value=state.nightsMin;
 panel.querySelector('[data-tour-range="max"]').value=state.nightsMax;
 const slider=panel.querySelector('.tour-range');
 slider.style.setProperty('--tour-from',rangePercent(state.nightsMin));
 slider.style.setProperty('--tour-to',rangePercent(state.nightsMax));
 form.querySelector('[data-tour-trigger="nights"] .v2-value').textContent=
   state.nightsMin+'–'+state.nightsMax+' '+dict.night;
 saveTour();
});
form.addEventListener('change',e=>{
 if(!active)return;
 const select=e.target.closest('[data-tour-child-age]');
 if(select){
   state.childAges[Number(select.dataset.tourChildAge)]=
     select.value===''?null:Number(select.value);
   saveTour();
 }
});
function resolveInput(role){
 if(state[role])return true;
 const input=form.querySelector('.tour-cell--'+role+' .v2-input');
 const value=normalize(input.value);
 const list=role==='departure'?data.departures:data.destinations;
 const exact=list.find(x=>Object.values(x.name).some(n=>normalize(n)===value));
 if(exact){state[role]=exact.key;state[role+'Text']='';saveTour();return true}
 input.focus();
 show(role,role==='departure'?departurePanel(input.value):destinationPanel(input.value),true);
 showSearchIssue(role==='departure'?dict.selectDeparture:dict.select);
 return false;
}
form.addEventListener('submit',e=>{
 if(!active)return;
 e.preventDefault();e.stopImmediatePropagation();
 if(!resolveInput('departure')||!resolveInput('destination'))return;
 if(!state.date){
   calendarMonth=new Date(initialDate.getFullYear(),initialDate.getMonth(),1);
   openCalendar(true);showSearchIssue(dict.selectDate);return;
 }
 if(state.children&&state.childAges.some(age=>!Number.isInteger(age))){
   showSearchIssue(dict.ageRequired);return;
 }
 try{
   const result=data.build(state);
   if(!result.filtered||!result.url){
     const message=result.reason==='children'?dict.unavailableChildren:
       result.reason==='departure'?dict.unavailableDeparture:dict.unavailableDestination;
     showSearchIssue(message);
     return;
   }
   if(!/^https:\/\/web\.tutu\.travelata\.ru\/search\/\?/.test(result.url))
     throw new Error('Unsupported partner destination');
   window.location.assign(result.url);
 }catch(err){showSearchIssue(dict.invalid)}
},true);
document.addEventListener('click',e=>{
 if(active&&!e.target.closest('.tour-cell')&&!e.target.closest('.search-suggest'))close();
});
document.addEventListener('keydown',e=>{if(active&&e.key==='Escape')close()});
if(persistence?.read().activeMode==='tour')activate();
window.addEventListener('pagehide',saveTour);
})();
