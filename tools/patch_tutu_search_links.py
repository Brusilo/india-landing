from pathlib import Path
import re

builder = r'''/* Tutu public search URL builder for India Landing. */
(function(){
  'use strict';

  const countrySlug={
    RU:'russia',IN:'india',KZ:'kazakhstan',UZ:'uzbekistan',KG:'kirgizstan',TJ:'tadjikistan',
    AM:'armeniya',AZ:'azerbaydjan',BY:'belarus',MD:'moldova',TM:'turkmenistan',GE:'georgia',
    CN:'china',AE:'uae',QA:'qatar',TR:'turkey'
  };

  // Numeric IDs are added only when verified from current public Tutu URLs/examples.
  // The route path remains a working fallback for cities without a verified numeric ID.
  const aviaId={
    'ru-moscow':491,
    'ru-saint-petersburg':75,
    'ru-sochi':78,
    'ru-kazan':33,
    'ru-yekaterinburg':29,
    'in-delhi':216
  };

  const busId={
    'ru-moscow':1447874,
    'ru-gelendzhik':1447979,
    'ru-loo':2082727
  };

  const hotelGeoId={
    'ru-moscow':2657260,
    'in-delhi':2657045
  };

  const transportSlugOverride={
    'ru-moscow':'Moskva',
    'ru-saint-petersburg':'Sankt-Peterburg',
    'ru-yekaterinburg':'Ekaterinburg',
    'ru-nizhny-novgorod':'Nijniy_novgorod',
    'ru-mineralnye-vody':'Mineralnye_vody',
    'ru-yoshkar-ola':'Yoshkar-Ola',
    'ru-gorno-altaysk':'Gorno-Altaysk',
    'ru-ulan-ude':'Ulan-Ude',
    'ru-petropavlovsk-kamchatsky':'Petropavlovsk-Kamchatskiy',
    'ru-yuzhno-sakhalinsk':'Yuzhno-Sakhalinsk',
    'in-delhi':'Deli',
    'in-bengaluru':'Bangalore',
    'in-kolkata':'Kolkata',
    'in-thiruvananthapuram':'Trivandrum',
    'in-kozhikode':'Kozhikode'
  };

  const hotelSlugOverride={
    'ru-moscow':'moscow',
    'ru-saint-petersburg':'saint_petersburg',
    'in-delhi':'delhi',
    'in-mumbai':'mumbai',
    'in-bengaluru':'bangalore'
  };

  function asciiWords(value){
    return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,' ').trim().split(/\s+/).filter(Boolean);
  }
  function transportSlug(place){
    if(!place)return '';
    if(transportSlugOverride[place.id])return transportSlugOverride[place.id];
    return asciiWords(place.canonical).join('-');
  }
  function hotelSlug(place){
    if(!place)return '';
    if(hotelSlugOverride[place.id])return hotelSlugOverride[place.id];
    return asciiWords(place.canonical).map(x=>x.toLowerCase()).join('_');
  }
  function pad(n){return String(n).padStart(2,'0')}
  function iso(d){return d?d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()):''}
  function dotted(d){return d?pad(d.getDate())+'.'+pad(d.getMonth()+1)+'.'+d.getFullYear():''}
  function compact(d){return d?pad(d.getDate())+pad(d.getMonth()+1)+d.getFullYear():''}
  function total(s){return Math.max(1,Number(s.adults||0)+Number(s.children||0))}
  function travelerToken(s){
    const adults=Math.max(1,Number(s.adults||1));
    const count=Math.max(0,Number(s.children||0));
    const ages=(s.childAges||[]).slice(0,count).map(x=>Math.max(0,Math.min(17,Number(x))));
    while(ages.length<count)ages.push(5);
    return [adults].concat(ages).join('.');
  }
  function requireValue(value,code){if(!value){const e=new Error(code);e.code=code;throw e}}
  function params(obj){
    const p=new URLSearchParams();
    Object.entries(obj).forEach(([k,v])=>{if(v!==undefined&&v!==null)p.set(k,String(v))});
    return p.toString();
  }

  function buildHotel(s){
    requireValue(s.destination,'destination');requireValue(s.start,'hotelDates');requireValue(s.end,'hotelDates');
    const place=s.destination,country=countrySlug[place.country];requireValue(country,'unsupported');
    const q={check_in:iso(s.start),check_out:iso(s.end),details_params:''};
    if(hotelGeoId[place.id])q.geo_id=hotelGeoId[place.id];
    q.geo_name=(place.name&&place.name.ru)||place.canonical;
    q.geo_type='locality';q.resultId='';q['room[0]']=total(s);
    return 'https://hotel.tutu.ru/c_'+country+'/'+hotelSlug(place)+'/?'+params(q);
  }

  function buildAvia(s){
    requireValue(s.from,'from');requireValue(s.to,'to');requireValue(s.date,'date');
    const from=transportSlug(s.from),to=transportSlug(s.to);requireValue(from&&to,'unsupported');
    const q={class:s.cabin==='business'?'C':'Y',travelers:travelerToken(s)};
    if(aviaId[s.from.id]&&aviaId[s.to.id])q['route[0]']=aviaId[s.from.id]+'-'+compact(s.date)+'-'+aviaId[s.to.id];
    q.search_extension='avia';
    return 'https://avia.tutu.ru/f/'+encodeURIComponent(from)+'/'+encodeURIComponent(to)+'/?'+params(q);
  }

  function buildTrain(s){
    requireValue(s.from,'from');requireValue(s.to,'to');requireValue(s.date,'date');
    const q={date:dotted(s.date),travelers:travelerToken(s),search_extension:'train'};
    if(hotelGeoId[s.to.id])q.hotel_geo_id=hotelGeoId[s.to.id];
    return 'https://www.tutu.ru/poezda/'+encodeURIComponent(transportSlug(s.from))+'/'+encodeURIComponent(transportSlug(s.to))+'/?'+params(q);
  }

  function buildBus(s){
    requireValue(s.from,'from');requireValue(s.to,'to');requireValue(s.date,'date');
    const q={};
    if(busId[s.from.id])q.from=busId[s.from.id];
    if(busId[s.to.id])q.to=busId[s.to.id];
    q.date=dotted(s.date);q.travelers=travelerToken(s);q.amount=total(s);
    return 'https://bus.tutu.ru/raspisanie/gorod_'+encodeURIComponent(transportSlug(s.from))+'/gorod_'+encodeURIComponent(transportSlug(s.to))+'/?'+params(q);
  }

  function build(mode,state){
    if(mode==='hotel')return buildHotel(state);
    if(mode==='flight')return buildAvia(state);
    if(mode==='train')return buildTrain(state);
    if(mode==='bus')return buildBus(state);
    const e=new Error('unsupported');e.code='unsupported';throw e;
  }

  const messages={
    ru:{from:'Выберите город отправления из подсказок.',to:'Выберите город назначения из подсказок.',destination:'Выберите город из подсказок.',date:'Выберите дату поездки.',hotelDates:'Выберите даты заезда и выезда.',unsupported:'Для этого города пока не удалось собрать ссылку Туту.'},
    en:{from:'Select the departure city from the suggestions.',to:'Select the destination city from the suggestions.',destination:'Select a city from the suggestions.',date:'Select a travel date.',hotelDates:'Select check-in and check-out dates.',unsupported:'A Tutu link is not available for this city yet.'},
    hi:{from:'सुझावों में से प्रस्थान शहर चुनें।',to:'सुझावों में से गंतव्य शहर चुनें।',destination:'सुझावों में से शहर चुनें।',date:'यात्रा की तारीख चुनें।',hotelDates:'चेक-इन और चेक-आउट की तारीखें चुनें।',unsupported:'इस शहर के लिए Tutu लिंक अभी उपलब्ध नहीं है।'}
  };
  function message(code,lang){const l=messages[lang]||messages.ru;return l[code]||l.unsupported}

  window.TUTU_LINKS={build,message,transportSlug,hotelSlug,travelerToken,aviaId,busId,hotelGeoId};
})();
'''

Path('assets/tutu-link-builder.js').write_text(builder, encoding='utf-8')

p=Path('assets/search-v2.js')
s=p.read_text(encoding='utf-8')

# Keep ages in mode state so travelers=3.4 means 3 adults + child aged 4.
s=s.replace("flight:{fromText:'',toText:'',from:null,to:null,date:null,adults:1,children:0,cabin:'economy'},", "flight:{fromText:'',toText:'',from:null,to:null,date:null,adults:1,children:0,childAges:[],cabin:'economy'},")
s=s.replace("train:{fromText:'',toText:'',from:null,to:null,date:null,adults:1,children:0,cabin:null},", "train:{fromText:'',toText:'',from:null,to:null,date:null,adults:1,children:0,childAges:[],cabin:null},")
s=s.replace("bus:{fromText:'',toText:'',from:null,to:null,date:null,adults:1,children:0,cabin:null},", "bus:{fromText:'',toText:'',from:null,to:null,date:null,adults:1,children:0,childAges:[],cabin:null},")
s=s.replace("hotel:{destinationText:'',destination:null,start:null,end:null,adults:2,children:0,cabin:null}", "hotel:{destinationText:'',destination:null,start:null,end:null,adults:2,children:0,childAges:[],cabin:null}")

# Localized labels for child ages.
s=s.replace("children:'Дети',childSub:'До 12 лет',", "children:'Дети',childSub:'До 18 лет',childAge:'Возраст ребёнка',years:'лет',")
s=s.replace("children:'Children',childSub:'Under 12',", "children:'Children',childSub:'Under 18',childAge:'Child age',years:'years',")
s=s.replace("children:'बच्चे',childSub:'12 वर्ष से कम',", "children:'बच्चे',childSub:'18 वर्ष से कम',childAge:'बच्चे की उम्र',years:'वर्ष',")

old_render = re.search(r"  function renderGuestPopover\(box\)\{.*?\n  \}\n\n  function bindPax", s, re.S)
if not old_render:
    raise SystemExit('renderGuestPopover block not found')
new_render = r'''  function renderGuestPopover(box){
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

  function bindPax'''
s=s[:old_render.start()]+new_render+s[old_render.end():]

# Keep age array aligned when child count changes.
s=s.replace("else s.children=Math.max(0,Math.min(9-s.adults,s.children+delta));\n        field.querySelector('.v2-value').textContent=travellerValue();renderGuestPopover(box);return;", "else{\n          s.children=Math.max(0,Math.min(9-s.adults,s.children+delta));\n          if(!Array.isArray(s.childAges))s.childAges=[];\n          while(s.childAges.length<s.children)s.childAges.push(5);\n          if(s.childAges.length>s.children)s.childAges=s.childAges.slice(0,s.children);\n        }\n        field.querySelector('.v2-value').textContent=travellerValue();renderGuestPopover(box);return;")

# Select child's exact age.
needle="    box.addEventListener('click',e=>{\n      e.preventDefault();e.stopPropagation();"
idx=s.find(needle, s.find('function bindPax'))
if idx<0: raise SystemExit('bindPax click listener not found')
# Add a change listener before the click listener.
s=s[:idx]+"    box.addEventListener('change',e=>{\n      const age=e.target.closest('[data-child-age]');if(!age)return;\n      const s=states[mode],i=Number(age.dataset.childAge);\n      if(!Array.isArray(s.childAges))s.childAges=[];s.childAges[i]=Number(age.value);\n    });\n"+s[idx:]

# Bind Search button to URL generation.
s=s.replace("  function bindForm(){bindPlaces();bindCalendar();bindPax();bindSwap()}", r'''  function bindSubmit(){
    const button=form.querySelector('.v2-submit');if(!button)return;
    button.addEventListener('click',()=>{
      try{
        if(!window.TUTU_LINKS){const e=new Error('unsupported');e.code='unsupported';throw e}
        const url=window.TUTU_LINKS.build(mode,states[mode]);
        window.location.assign(url);
      }catch(err){
        const code=err&&err.code?err.code:'unsupported';
        alert(window.TUTU_LINKS?window.TUTU_LINKS.message(code,pageLang):code);
      }
    });
  }

  function bindForm(){bindPlaces();bindCalendar();bindPax();bindSwap();bindSubmit()}''')

p.write_text(s, encoding='utf-8')

# Child-age select styling.
cssp=Path('assets/search-v2.css')
css=cssp.read_text(encoding='utf-8')
marker='/* Child ages used by Tutu travelers parameter. */'
if marker not in css:
    css += r'''

/* Child ages used by Tutu travelers parameter. */
.child-ages-v2{display:grid;gap:8px;margin:6px 0 10px;padding-top:8px;border-top:1px solid #e6e7f3}
.child-age-v2{display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:13px;color:#8c8ca1}
.child-age-v2 select{min-width:112px;height:36px;padding:0 10px;border:1px solid #e6e7f3;border-radius:9px;background:#fff;color:#0d0b68;font:500 14px var(--font);outline:none}
'''
cssp.write_text(css,encoding='utf-8')

# Load builder before search UI and bust caches on all language pages.
version='20260917-tutu-links-1'
for name in ['index.html','index-en.html','index-hi.html']:
    hp=Path(name);html=hp.read_text(encoding='utf-8')
    if 'assets/tutu-link-builder.js' not in html:
        html=html.replace('<script src="assets/search-v2.js', '<script src="assets/tutu-link-builder.js?v='+version+'"></script>\n<script src="assets/search-v2.js', 1)
    html=re.sub(r'assets/search-v2\.js(?:\?v=[^"\']+)?','assets/search-v2.js?v='+version,html)
    html=re.sub(r'assets/search-v2\.css(?:\?v=[^"\']+)?','assets/search-v2.css?v='+version,html)
    hp.write_text(html,encoding='utf-8')
