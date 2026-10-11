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
ru:{from:'Откуда',destination:'Страна, курорт или город',date:'Когда',nights:'Кол-во ночей',who:'Кто едет',search:'Найти туры',min:'от',max:'до',night:'ночей',adults:'Взрослые',adult:'взрослый',adult2:'взрослых',select:'Выберите направление из списка',fallback:'По этому направлению открываем общий каталог туров: точный поиск ещё не подтверждён.',winter:'Зимняя сказка в России',countries:'Страны',dates:'Дата вылета',reset:'Вернуться к поиску',chipDate:'Завтра',noResults:'Ничего не найдено',range:'Диапазон ночей'},
en:{from:'From',destination:'Country, resort or city',date:'Departure',nights:'Nights',who:'Travellers',search:'Search tours',min:'from',max:'to',night:'nights',adults:'Adults',adult:'adult',adult2:'adults',select:'Select a destination from the suggestions',fallback:'This opens the general tours catalogue; an exact search link is not yet verified.',winter:'Winter in Russia',countries:'Countries',dates:'Departure date',reset:'Back to search',chipDate:'Tomorrow',noResults:'No results',range:'Number of nights'},
hi:{from:'कहाँ से',destination:'देश, रिज़ॉर्ट या शहर',date:'कब',nights:'कितनी रातें',who:'यात्री',search:'टूर खोजें',min:'से',max:'तक',night:'रातें',adults:'वयस्क',adult:'वयस्क',adult2:'वयस्क',select:'सूची से जगह चुनें',fallback:'इस जगह के लिए सामान्य टूर कैटलॉग खुलेगा; सटीक खोज लिंक अभी सत्यापित नहीं है।',winter:'रूस की सर्दियाँ',countries:'देश',dates:'रवाना होने की तारीख़',reset:'खोज पर वापस जाएँ',chipDate:'कल',noResults:'कोई परिणाम नहीं',range:'रातों की संख्या'}
}[lang];
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const initialDate=new Date();initialDate.setDate(initialDate.getDate()+2);
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const dateLabel=d=>new Intl.DateTimeFormat(lang==='ru'?'ru-RU':lang==='hi'?'hi-IN':'en-GB',{day:'numeric',month:'long',weekday:'short'}).format(new Date(d+'T12:00:00'));
const state={departure:'moscow',destination:'russia',date:iso(initialDate),nightsMin:7,nightsMax:14,adults:1};
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
 form.querySelectorAll('[data-tour-trigger]').forEach(b=>b.setAttribute('aria-expanded','false'));
}
function show(type,html){
 const btn=form.querySelector('[data-tour-trigger="'+type+'"]');const cell=btn&&btn.closest('.tour-cell');
 if(!cell)return;
 if(overlay===type){close();return}
 close();
 const panel=document.createElement('div');panel.className='tour-panel tour-panel--'+type;panel.innerHTML=html;cell.appendChild(panel);
 overlay=type;btn.setAttribute('aria-expanded','true');
}
function render(){
 close();
 const dep=data.departureByKey.get(state.departure);
 const dest=data.byKey.get(state.destination);
 form.innerHTML=
 field(dict.from,button(dep.name[lang],'departure'),'departure')+
 field(dict.destination,'<input class="tour-destination" role="combobox" aria-label="'+esc(dict.destination)+'" aria-autocomplete="list" autocomplete="off" value="'+esc(dest.name[lang])+'">','destination')+
 field(dict.date,button(dateLabel(state.date),'date'),'date')+
 field(dict.nights,button(state.nightsMin+'–'+state.nightsMax+' '+dict.night,'nights'),'nights')+
 field(dict.who,button(state.adults+' '+(state.adults===1?dict.adult:dict.adult2),'people'),'people')+
 '<button type="submit" class="v2-submit tour-submit">'+esc(dict.search)+'</button>';
 hints.innerHTML='<div class="tour-hints"><span>'+esc(dict.winter)+':</span>'+['murmansk','teriberka','baikal','saint-petersburg','moscow'].map(key=>{const d=data.byKey.get(key);return '<button type="button" data-tour-choice="'+key+'">'+esc(d.name[lang])+'</button>'}).join('')+'</div>';
 bind();
}
function options(list){
 return '<div class="tour-option-list">'+list.map(x=>'<button type="button" data-tour-choice="'+esc(x.key)+'"><strong>'+esc(x.name[lang])+'</strong>'+(x.kind==='winter'?'<small>'+esc(dict.winter)+'</small>':'')+'</button>').join('')+'</div>';
}
function destinationPanel(q){
 const items=data.find(q,18);
 return items.length?options(items):'<p class="tour-empty">'+esc(dict.noResults)+'</p>';
}
function bind(){
 form.querySelector('[data-tour-trigger="departure"]').addEventListener('click',()=>show('departure','<div class="tour-option-list">'+data.departures.map(d=>'<button type="button" data-tour-dep="'+d.key+'">'+esc(d.name[lang])+'</button>').join('')+'</div>'));
 form.querySelector('[data-tour-trigger="nights"]').addEventListener('click',()=>show('nights','<div class="tour-night-head"><span>'+dict.min+' <b data-tour-min>'+state.nightsMin+'</b></span><span>'+dict.max+' <b data-tour-max>'+state.nightsMax+'</b> '+dict.night+'</span></div><div class="tour-range"><label><span class="sr-only">'+dict.min+'</span><input type="range" min="1" max="30" value="'+state.nightsMin+'" data-tour-range="min"></label><label><span class="sr-only">'+dict.max+'</span><input type="range" min="1" max="30" value="'+state.nightsMax+'" data-tour-range="max"></label></div>'));
 form.querySelector('[data-tour-trigger="people"]').addEventListener('click',()=>show('people','<div class="tour-people"><span>'+dict.adults+'</span><button type="button" data-tour-step="-1" aria-label="-">−</button><strong>'+state.adults+'</strong><button type="button" data-tour-step="1" aria-label="+">+</button></div>'));
 form.querySelector('[data-tour-trigger="date"]').addEventListener('click',()=>{const d=new Date(state.date+'T12:00:00');calendarMonth=new Date(d.getFullYear(),d.getMonth(),1);openCalendar()});
 const input=form.querySelector('.tour-destination');
 input.addEventListener('focus',()=>show('destination',destinationPanel(input.value)));
 input.addEventListener('input',()=>{const panel=form.querySelector('.tour-panel--destination');if(!panel)show('destination',destinationPanel(input.value));else panel.innerHTML=destinationPanel(input.value)});
}
function openCalendar(){
 const year=calendarMonth.getFullYear(),month=calendarMonth.getMonth();
 const first=new Date(year,month,1),startOffset=(first.getDay()+6)%7,last=new Date(year,month+1,0).getDate();
 const monthLabel=new Intl.DateTimeFormat(lang==='ru'?'ru-RU':lang==='hi'?'hi-IN':'en-GB',{month:'long',year:'numeric'}).format(first);
 const today=iso(new Date()),cutoff=new Date();cutoff.setMonth(cutoff.getMonth()+11);
 let html='<div class="tour-month"><button type="button" data-tour-nav="-1" aria-label="Previous month">‹</button><strong>'+esc(monthLabel)+'</strong><button type="button" data-tour-nav="1" aria-label="Next month">›</button></div><div class="tour-days">';
 const weekdays=lang==='ru'?['Пн','Вт','Ср','Чт','Пт','Сб','Вс']:lang==='hi'?['सो','मं','बु','गु','शु','श','र']:['Mo','Tu','We','Th','Fr','Sa','Su'];
 html+=weekdays.map(x=>'<span>'+x+'</span>').join('')+'<span></span>'.repeat(startOffset);
 for(let i=1;i<=last;i++){const d=iso(new Date(year,month,i));html+='<button type="button" data-tour-day="'+d+'" '+(d<today||d>iso(cutoff)?'disabled':'')+' class="'+(d===state.date?'is-selected':'')+'">'+i+'</button>'}
 show('date',html+'</div>');
}
function activate(){
 if(active)return;active=true;
 savedForm=[...form.childNodes];savedHints=[...hints.childNodes];savedMode=form.dataset.mode;
 // Both DOM and listeners on the legacy search are preserved by detaching nodes.
 savedForm.forEach(n=>n.remove());savedHints.forEach(n=>n.remove());
 form.dataset.mode='tour';hints.dataset.mode='tour';
 tab.classList.add('is-active');tab.setAttribute('aria-selected','true');
 document.querySelectorAll('.transport button').forEach(b=>{b.classList.remove('is-active');b.setAttribute('aria-selected','false')});
 render();
}
function deactivate(){
 if(!active)return;active=false;
 close();form.replaceChildren(...savedForm);hints.replaceChildren(...savedHints);
 form.dataset.mode=savedMode;hints.dataset.mode=savedMode;
 tab.classList.remove('is-active');tab.setAttribute('aria-selected','false');
}
tab.addEventListener('click',e=>{e.preventDefault();activate()});
document.querySelectorAll('.transport button').forEach(b=>b.addEventListener('click',()=>deactivate(),true));
form.addEventListener('click',e=>{
 if(!active)return;
 const d=e.target.closest('[data-tour-dep]');if(d){state.departure=d.dataset.tourDep;render();return}
 const choice=e.target.closest('[data-tour-choice]');if(choice){state.destination=choice.dataset.tourChoice;render();return}
 const nav=e.target.closest('[data-tour-nav]');if(nav){calendarMonth.setMonth(calendarMonth.getMonth()+Number(nav.dataset.tourNav));openCalendar();return}
 const day=e.target.closest('[data-tour-day]');if(day){state.date=day.dataset.tourDay;render();return}
 const step=e.target.closest('[data-tour-step]');if(step){state.adults=Math.min(9,Math.max(1,state.adults+Number(step.dataset.tourStep)));render();form.querySelector('[data-tour-trigger="people"]').click();return}
});
hints.addEventListener('click',e=>{if(!active)return;const el=e.target.closest('[data-tour-choice]');if(el){state.destination=el.dataset.tourChoice;render()}},true);
form.addEventListener('input',e=>{
 if(!active)return;const el=e.target.closest('[data-tour-range]');if(!el)return;
 const val=Number(el.value);
 if(el.dataset.tourRange==='min'){state.nightsMin=Math.min(val,state.nightsMax)}else{state.nightsMax=Math.max(val,state.nightsMin)}
 const panel=form.querySelector('.tour-panel--nights');if(!panel)return;
 panel.querySelector('[data-tour-min]').textContent=state.nightsMin;
 panel.querySelector('[data-tour-max]').textContent=state.nightsMax;
 panel.querySelector('[data-tour-range="min"]').value=state.nightsMin;
 panel.querySelector('[data-tour-range="max"]').value=state.nightsMax;
 form.querySelector('[data-tour-trigger="nights"]').textContent=state.nightsMin+'–'+state.nightsMax+' '+dict.night;
});
form.addEventListener('submit',e=>{
 if(!active)return;e.preventDefault();e.stopImmediatePropagation();
 const d=data.byKey.get(state.destination);
 // Never search a silently substituted location; the visible input must match choice.
 if(form.querySelector('.tour-destination').value!==d.name[lang]){alert(dict.select);return}
 try{
  const result=data.build(state);
  if(!result.filtered&&!confirm(dict.fallback))return;
  window.location.assign(result.url);
 }catch(err){alert(dict.select)}
},true);
document.addEventListener('click',e=>{if(active&&!e.target.closest('.tour-cell')&&!e.target.closest('.tour-panel'))close()});
document.addEventListener('keydown',e=>{if(active&&e.key==='Escape')close()});
})();
