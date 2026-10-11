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
ru:{previewMessage:'Это демонстрационная форма: направления и параметры выбираются, но поиск и бронирование пока не запускаются.',from:'Откуда',findDeparture:'Поиск города отправления',destination:'Страна, курорт или город',date:'Когда',nights:'Кол-во ночей',who:'Кто едет',search:'Найти туры',min:'от',max:'до',night:'ночей',adults:'Взрослые',adult:'взрослый',adult2:'взрослых',children:'Дети',child:'ребёнок',child2:'детей',childAge:'Возраст на конец поездки',ageRequired:'Укажите возраст каждого ребёнка.',invalid:'Проверьте параметры тура.',fallbackDeparture:'Этот город вылета пока нельзя передать в поиск автоматически. На Туту потребуется снова выбрать город, даты, ночи и туристов. Продолжить?',fallbackPair:'Откроется страница выбранного маршрута из вашего города. Даты, ночи и туристов понадобится указать на Туту ещё раз. Продолжить?',fallbackChildren:'Для поиска тура с детьми нужно повторно выбрать количество и возраст детей на Туту, а также даты и ночи. Продолжить?',select:'Выберите направление из списка',fallback:'Откроется страница выбранного направления на Туту. Дату, ночи и число туристов, возможно, потребуется указать повторно. Продолжить?',fallbackNearby:'Для Териберки пока не подтверждена отдельная страница туров. Откроется страница туров в Мурманск: даты, ночи и туристов нужно будет выбрать заново. Продолжить?',winter:'Зимняя сказка в России',countries:'Страны',dates:'Дата вылета',reset:'Вернуться к поиску',chipDate:'Завтра',noResults:'Ничего не найдено',range:'Диапазон ночей'},
en:{previewMessage:'Preview only: you can choose a destination and dates, but tour search and booking are not active yet.',findDeparture:'Search departure cities',from:'From',destination:'Country, resort or city',date:'Departure',nights:'Nights',who:'Travellers',search:'Search tours',min:'from',max:'to',night:'nights',adults:'Adults',adult:'adult',adult2:'adults',children:'Children',child:'child',child2:'children',childAge:'Age at end of trip',ageRequired:'Select the age of each child.',invalid:'Check your tour details.',fallbackDeparture:'This departure city cannot yet be passed automatically. On Tutu, choose the departure city, dates, nights and travellers again. Continue?',fallbackPair:'This opens the route page from your chosen city. Please choose dates, nights and travellers again on Tutu. Continue?',fallbackChildren:'For tours with children, please choose the children’s ages and count again on Tutu, along with the dates and nights. Continue?',select:'Select a destination from the suggestions',fallback:'This opens the selected Tutu destination. Dates, nights and travellers may need to be set again on the next page. Continue?',fallbackNearby:'A separate tour page for Teriberka is not verified. Open Murmansk tours instead? You will need to choose the dates, nights and travellers again.',winter:'Winter in Russia',countries:'Countries',dates:'Departure date',reset:'Back to search',chipDate:'Tomorrow',noResults:'No results',range:'Number of nights'},
hi:{previewMessage:'यह डेमो फ़ॉर्म है। जगह और तारीख़ चुन सकते हैं, लेकिन अभी टूर खोज और बुकिंग चालू नहीं है।',findDeparture:'प्रस्थान का शहर खोजें',from:'कहाँ से',destination:'देश, रिज़ॉर्ट या शहर',date:'कब',nights:'कितनी रातें',who:'यात्री',search:'टूर खोजें',min:'से',max:'तक',night:'रातें',adults:'वयस्क',adult:'वयस्क',adult2:'वयस्क',children:'बच्चे',child:'बच्चा',child2:'बच्चे',childAge:'यात्रा के अंत में उम्र',ageRequired:'हर बच्चे की उम्र चुनें।',invalid:'टूर की जानकारी जाँचें।',fallbackDeparture:'इस शहर से प्रस्थान को अभी सीधे खोज में नहीं भेज सकते। टूटू पर शहर, तारीख़, रातें और यात्रियों को दोबारा चुनना होगा। आगे बढ़ें?',fallbackPair:'आपके चुने हुए शहर से इस मार्ग का पेज खुलेगा। टूटू पर तारीख़, रातें और यात्रियों को फिर चुनें। आगे बढ़ें?',fallbackChildren:'बच्चों के साथ टूर के लिए टूटू पर बच्चों की संख्या, उम्र, तारीख़ और रातें दोबारा चुननी होंगी। आगे बढ़ें?',select:'सूची से जगह चुनें',fallback:'टूटू पर चुनी हुई जगह का पेज खुलेगा। तारीख़, रातों की संख्या और यात्रियों को वहाँ दोबारा चुनना पड़ सकता है। आगे बढ़ें?',fallbackNearby:'तेरिबेरका के लिए अलग टूर पेज की पुष्टि नहीं हुई है। मुर्मांस्क के टूर खुलेंगे, जहाँ तारीख़, रातें और यात्रियों को दोबारा चुनना होगा। आगे बढ़ें?',winter:'रूस की सर्दियाँ',countries:'देश',dates:'रवाना होने की तारीख़',reset:'खोज पर वापस जाएँ',chipDate:'कल',noResults:'कोई परिणाम नहीं',range:'रातों की संख्या'}
}[lang];
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const initialDate=new Date();initialDate.setDate(initialDate.getDate()+2);
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const dateLabel=d=>new Intl.DateTimeFormat(lang==='ru'?'ru-RU':lang==='hi'?'hi-IN':'en-GB',{day:'numeric',month:'long',weekday:'short'}).format(new Date(d+'T12:00:00'));
const state={departure:'moscow',destination:'russia',date:iso(initialDate),nightsMin:7,nightsMax:14,adults:1,children:0,childAges:[]};
let active=false;
let savedForm=null,savedHints=null,savedMode=null;
let calendarMonth=new Date(initialDate.getFullYear(),initialDate.getMonth(),1);
let overlay=null;
function field(caption,html,name){
 return '<div class="tour-cell tour-cell--'+name+'"><span class="tour-caption">'+esc(caption)+'</span>'+html+'</div>';
}
function button(label,name){
 return '<button type="button" class="tour-value" data-tour-trigger="'+name+'" aria-expanded="false">'+esc(label)+'</button>';
}
function close(){
 const box=form.querySelector('.tour-panel'); if(box)box.remove();overlay=null;
 form.querySelectorAll('[data-tour-trigger],.tour-destination').forEach(b=>b.setAttribute('aria-expanded','false'));
}
function show(type,html,refresh=false){
 const btn=form.querySelector('[data-tour-trigger="'+type+'"]')||(type==='destination'?form.querySelector('.tour-destination'):null);const cell=btn&&btn.closest('.tour-cell');
 if(!cell)return;
 if(overlay===type&&!refresh){close();return}
 close();
 const panel=document.createElement('div');panel.className='tour-panel tour-panel--'+type;
 if(type==='destination'){panel.id='tour-destination-list';panel.setAttribute('role','listbox')}
 panel.innerHTML=html;cell.appendChild(panel);
 overlay=type;btn.setAttribute('aria-expanded','true');
}
function render(){
 close();
 const dep=data.departureByKey.get(state.departure);
 const dest=data.byKey.get(state.destination);
 form.innerHTML=
 field(dict.from,button(dep.name[lang],'departure'),'departure')+
 field(dict.destination,'<input class="tour-destination" role="combobox" aria-label="'+esc(dict.destination)+'" aria-autocomplete="list" autocomplete="off" aria-expanded="false" aria-controls="tour-destination-list" value="'+esc(dest.name[lang])+'">','destination')+
 field(dict.date,button(dateLabel(state.date),'date'),'date')+
 field(dict.nights,button(state.nightsMin+'–'+state.nightsMax+' '+dict.night,'nights'),'nights')+
 field(dict.who,button(guestValue(),'people'),'people')+
 '<button type="submit" class="v2-submit tour-submit">'+esc(dict.search)+'</button>';
 const hintButton=(key)=>{const d=data.byKey.get(key);return '<button type="button" data-tour-choice="'+key+'">'+esc(d.name[lang])+'</button>'};
 const tomorrow=lang==='ru'?'Завтра':lang==='hi'?'कल':'Tomorrow';
 const afterTomorrow=lang==='ru'?'Послезавтра':lang==='hi'?'परसों':'In two days';
 hints.innerHTML='<div class="tour-hints-top">'+
   '<div class="tour-hint-group tour-hint-departure">'+data.departures.filter(d=>['moscow','spb'].includes(d.key)).map(d=>'<button type="button" data-tour-dep="'+d.key+'">'+esc(d.name[lang])+'</button>').join('')+'</div>'+
   '<div class="tour-hint-group tour-hint-destination">'+['russia','turkey','egypt','uae'].map(hintButton).join('')+'</div>'+
   '<div class="tour-hint-group tour-hint-date"><button type="button" data-tour-offset="1">'+tomorrow+'</button><button type="button" data-tour-offset="2">'+afterTomorrow+'</button></div></div>'+
   '<div class="tour-hints-winter"><span>'+esc(dict.winter)+':</span>'+
   ['murmansk','teriberka','baikal','karelia','sheregesh','krasnaya-polyana'].map(hintButton).join('')+'</div>';
 bind();
}
function options(list){
 return '<div class="tour-option-list">'+list.map(x=>{
   const meta=x.kind==='winter'?dict.winter:
     (x.kind==='resort'||x.kind==='place')?(data.byKey.get(x.parent)?.name[lang]||''):dict.countries;
   return '<button type="button" role="option" aria-selected="false" id="tour-option-'+esc(x.key)+'" data-tour-choice="'+esc(x.key)+'"><strong>'+esc(x.name[lang])+'</strong><small>'+esc(meta)+'</small></button>';
 }).join('')+'</div>';
}
function destinationPanel(q){
 const items=data.find(q,18);
 return items.length?options(items):'<p class="tour-empty">'+esc(dict.noResults)+'</p>';
}
function departurePanel(q){
 const query=String(q||'').trim().toLocaleLowerCase();
 const matching=data.departures.filter(d=>!query||
   Object.values(d.name).some(v=>String(v).toLocaleLowerCase().includes(query))||
   String(d.aliases||'').toLocaleLowerCase().includes(query)).slice(0,35);
 return '<div class="tour-departure-search">'+
   '<input type="text" class="tour-departure-filter" autocomplete="off" aria-label="'+esc(dict.findDeparture)+'" placeholder="'+esc(dict.findDeparture)+'" value="'+esc(q||'')+'"></div>'+
   '<div class="tour-option-list tour-departure-list">'+
   matching.map(d=>'<button type="button" data-tour-dep="'+esc(d.key)+'">'+esc(d.name[lang])+'</button>').join('')+
   (matching.length?'':'<p class="tour-empty">'+esc(dict.noResults)+'</p>')+'</div>';
}
function guestValue(){
 let summary=state.adults+' '+(state.adults===1?dict.adult:dict.adult2);
 if(state.children)summary+=(lang==='ru'?' · ':', ')+state.children+' '+(state.children===1?dict.child:dict.child2);
 return summary;
}
function guestPanel(){
 const row=(kind,title,count,min,max)=>'<div class="tour-guest-row"><strong>'+esc(title)+'</strong><div class="tour-guest-controls">'+
   '<button type="button" data-tour-person="'+kind+'" data-tour-step="-1" '+(count<=min?'disabled':'')+' aria-label="-">−</button>'+
   '<output>'+count+'</output>'+
   '<button type="button" data-tour-person="'+kind+'" data-tour-step="1" '+(count>=max?'disabled':'')+' aria-label="+">+</button></div></div>';
 let html=row('adult',dict.adults,state.adults,1,6)+row('child',dict.children,state.children,0,Math.min(3,9-state.adults));
 for(let i=0;i<state.children;i++){
   html+='<label class="tour-age"><span>'+esc(dict.childAge)+' '+(i+1)+'</span><select data-tour-child-age="'+i+'" aria-label="'+esc(dict.childAge)+' '+(i+1)+'">'+
     '<option value="" '+(state.childAges[i]==null?'selected':'disabled')+'>—</option>'+
     Array.from({length:18},(_,n)=>'<option value="'+n+'" '+(state.childAges[i]===n?'selected':'')+'>'+n+'</option>').join('')+
     '</select></label>';
 }
 return html;
}
function rangePercent(n){return ((n-1)/28*100).toFixed(2)+'%'}
function nightsPanel(){
 return '<div class="tour-night-head"><span>'+dict.min+' <b data-tour-min>'+state.nightsMin+'</b></span><span>'+dict.max+' <b data-tour-max>'+state.nightsMax+'</b> '+dict.night+'</span></div>'+
   '<div class="tour-range" style="--tour-from:'+rangePercent(state.nightsMin)+';--tour-to:'+rangePercent(state.nightsMax)+'">'+
   '<div class="tour-track" aria-hidden="true"></div>'+
   '<input type="range" min="1" max="29" value="'+state.nightsMin+'" data-tour-range="min" aria-label="'+esc(dict.min+' '+dict.night)+'">'+
   '<input type="range" min="1" max="29" value="'+state.nightsMax+'" data-tour-range="max" aria-label="'+esc(dict.max+' '+dict.night)+'"></div>';
}
function bind(){
 form.querySelector('[data-tour-trigger="departure"]').addEventListener('click',()=>{show('departure',departurePanel(''));const field=form.querySelector('.tour-departure-filter');if(field)field.focus()});
 form.querySelector('[data-tour-trigger="nights"]').addEventListener('click',()=>show('nights',nightsPanel()));
 form.querySelector('[data-tour-trigger="people"]').addEventListener('click',()=>show('people',guestPanel()));
 form.querySelector('[data-tour-trigger="date"]').addEventListener('click',()=>{const d=new Date(state.date+'T12:00:00');calendarMonth=new Date(d.getFullYear(),d.getMonth(),1);openCalendar()});
 const input=form.querySelector('.tour-destination');
 input.addEventListener('focus',()=>{input.select();show('destination',destinationPanel(''))});
 input.addEventListener('input',()=>{
   const panel=form.querySelector('.tour-panel--destination');
   if(!panel)show('destination',destinationPanel(input.value));
   else{panel.innerHTML=destinationPanel(input.value);panel.dataset.active='-1';input.removeAttribute('aria-activedescendant')}
 });
 input.addEventListener('keydown',e=>{
   if(e.isComposing)return;
   if(e.key==='ArrowDown'||e.key==='ArrowUp'){
     e.preventDefault();
     let panel=form.querySelector('.tour-panel--destination');
     if(!panel){show('destination',destinationPanel(input.value));panel=form.querySelector('.tour-panel--destination')}
     if(!panel)return;
     const items=[...panel.querySelectorAll('[data-tour-choice]')];if(!items.length)return;
     const prev=Number(panel.dataset.active??-1),delta=e.key==='ArrowDown'?1:-1;
     const next=prev<0?(delta===1?0:items.length-1):(prev+delta+items.length)%items.length;
     panel.dataset.active=String(next);
     items.forEach((item,i)=>item.setAttribute('aria-selected',String(i===next)));
     input.setAttribute('aria-activedescendant',items[next].id);
     items[next].scrollIntoView({block:'nearest'});
   }else if(e.key==='Enter'){
     let panel=form.querySelector('.tour-panel--destination');
     const selected=panel&&panel.querySelector('[data-tour-choice][aria-selected="true"]');
     const normalized=x=>String(x).normalize('NFD').toLocaleLowerCase().trim();
     const typed=normalized(input.value);
     const exact=data.destinations.find(x=>Object.values(x.name).some(name=>normalized(name)===typed));
     const key=selected?.dataset.tourChoice||exact?.key;
     if(key){e.preventDefault();e.stopPropagation();state.destination=key;render()}
   }else if(e.key==='Escape'){close()}
 });
}
function openCalendar(refresh=false){
 const year=calendarMonth.getFullYear(),month=calendarMonth.getMonth();
 const first=new Date(year,month,1),startOffset=(first.getDay()+6)%7,last=new Date(year,month+1,0).getDate();
 const monthLabel=new Intl.DateTimeFormat(lang==='ru'?'ru-RU':lang==='hi'?'hi-IN':'en-GB',{month:'long',year:'numeric'}).format(first);
 const today=iso(new Date()),cutoff=new Date();cutoff.setMonth(cutoff.getMonth()+11);
 let html='<div class="tour-month"><button type="button" data-tour-nav="-1" aria-label="Previous month">‹</button><strong>'+esc(monthLabel)+'</strong><button type="button" data-tour-nav="1" aria-label="Next month">›</button></div><div class="tour-days">';
 const weekdays=lang==='ru'?['Пн','Вт','Ср','Чт','Пт','Сб','Вс']:lang==='hi'?['सो','मं','बु','गु','शु','श','र']:['Mo','Tu','We','Th','Fr','Sa','Su'];
 html+=weekdays.map(x=>'<span>'+x+'</span>').join('')+'<span></span>'.repeat(startOffset);
 for(let i=1;i<=last;i++){const d=iso(new Date(year,month,i));html+='<button type="button" data-tour-day="'+d+'" '+(d<today||d>iso(cutoff)?'disabled':'')+' class="'+(d===state.date?'is-selected':'')+'">'+i+'</button>'}
 show('date',html+'</div>',refresh);
}
function activate(){
 if(active)return;active=true;
 savedForm=[...form.childNodes];savedHints=[...hints.childNodes];savedMode=form.dataset.mode;
 // Both DOM and listeners on the legacy search are preserved by detaching nodes.
 savedForm.forEach(n=>n.remove());savedHints.forEach(n=>n.remove());
 form.dataset.mode='tour';hints.dataset.mode='tour';
 tab.classList.add('is-active');tab.setAttribute('aria-selected','true');
 document.querySelectorAll('.transport button:not(.tours-tab)').forEach(b=>{b.classList.remove('is-active');b.setAttribute('aria-selected','false')});
 render();
}
function deactivate(){
 if(!active)return;active=false;
 close();form.replaceChildren(...savedForm);hints.replaceChildren(...savedHints);
 form.dataset.mode=savedMode;hints.dataset.mode=savedMode;
 tab.classList.remove('is-active');tab.setAttribute('aria-selected','false');
}
tab.addEventListener('click',e=>{e.preventDefault();activate()});
document.querySelectorAll('.transport button:not(.tours-tab)').forEach(b=>b.addEventListener('click',()=>deactivate(),true));
form.addEventListener('click',e=>{
 if(!active)return;
 const d=e.target.closest('[data-tour-dep]');if(d){state.departure=d.dataset.tourDep;render();return}
 const choice=e.target.closest('[data-tour-choice]');if(choice){state.destination=choice.dataset.tourChoice;render();return}
 const nav=e.target.closest('[data-tour-nav]');if(nav){calendarMonth.setMonth(calendarMonth.getMonth()+Number(nav.dataset.tourNav));openCalendar(true);return}
 const day=e.target.closest('[data-tour-day]');if(day){state.date=day.dataset.tourDay;render();return}
 const step=e.target.closest('[data-tour-step]');
 if(step){
   const delta=Number(step.dataset.tourStep);
   if(step.dataset.tourPerson==='child'){
     state.children=Math.max(0,Math.min(3,9-state.adults,state.children+delta));
     while(state.childAges.length<state.children)state.childAges.push(null);
     state.childAges.length=state.children;
   }else{
     state.adults=Math.max(1,Math.min(6,state.adults+delta));
   }
   render();form.querySelector('[data-tour-trigger="people"]').click();return
 }
});
hints.addEventListener('click',e=>{
 if(!active)return;
 const dest=e.target.closest('[data-tour-choice]');if(dest){state.destination=dest.dataset.tourChoice;render();return}
 const dep=e.target.closest('[data-tour-dep]');if(dep){state.departure=dep.dataset.tourDep;render();return}
 const date=e.target.closest('[data-tour-offset]');
 if(date){const d=new Date();d.setDate(d.getDate()+Number(date.dataset.tourOffset));state.date=iso(d);render()}
},true);
form.addEventListener('input',e=>{
 if(!active)return;
 const departureFilter=e.target.closest('.tour-departure-filter');
 if(departureFilter){
   const panel=form.querySelector('.tour-departure-list');
   if(!panel)return;
   const query=departureFilter.value.trim().toLocaleLowerCase();
   const matching=data.departures.filter(d=>!query||
     Object.values(d.name).some(v=>String(v).toLocaleLowerCase().includes(query))||
     String(d.aliases||'').toLocaleLowerCase().includes(query)).slice(0,35);
   panel.innerHTML=matching.map(d=>'<button type="button" data-tour-dep="'+esc(d.key)+'">'+esc(d.name[lang])+'</button>').join('')||
     '<p class="tour-empty">'+esc(dict.noResults)+'</p>';
   return;
 }
 const el=e.target.closest('[data-tour-range]');if(!el)return;
 const val=Number(el.value);
 if(el.dataset.tourRange==='min'){state.nightsMin=Math.min(val,state.nightsMax)}else{state.nightsMax=Math.max(val,state.nightsMin)}
 const panel=form.querySelector('.tour-panel--nights');if(!panel)return;
 panel.querySelector('[data-tour-min]').textContent=state.nightsMin;
 panel.querySelector('[data-tour-max]').textContent=state.nightsMax;
 panel.querySelector('[data-tour-range="min"]').value=state.nightsMin;
 panel.querySelector('[data-tour-range="max"]').value=state.nightsMax;
 const slider=panel.querySelector('.tour-range');slider.style.setProperty('--tour-from',rangePercent(state.nightsMin));slider.style.setProperty('--tour-to',rangePercent(state.nightsMax));
 form.querySelector('[data-tour-trigger="nights"]').textContent=state.nightsMin+'–'+state.nightsMax+' '+dict.night;
});
form.addEventListener('change',e=>{
 if(!active)return;const select=e.target.closest('[data-tour-child-age]');if(!select)return;
 state.childAges[Number(select.dataset.tourChildAge)]=select.value===''?null:Number(select.value);
});
// This release is a VISUAL-ONLY prototype. No external travel links,
// redirects, partner API requests, booking or payment actions on submit.
form.addEventListener('submit',e=>{
 if(!active)return;e.preventDefault();e.stopImmediatePropagation();
 const d=data.byKey.get(state.destination);
 if(!d||form.querySelector('.tour-destination').value!==d.name[lang]){alert(dict.select);return}
 if(state.children&&state.childAges.some(age=>!Number.isInteger(age))){alert(dict.ageRequired);return}
 let message=hints.querySelector('.tour-preview-message');
 if(!message){message=document.createElement('p');message.className='tour-preview-message';message.setAttribute('role','status');hints.appendChild(message)}
 message.textContent=dict.previewMessage;
},true);
document.addEventListener('click',e=>{if(active&&!e.target.closest('.tour-cell')&&!e.target.closest('.tour-panel'))close()});
document.addEventListener('keydown',e=>{if(active&&e.key==='Escape')close()});
})();
