/* Tour destinations for the India Landing.
 * Only country IDs evidenced by the two supplied Tutu/Travelata URLs or
 * Travelata's published partner API example may enter deep-link searches.
 * The other destinations remain browse-only until a partner directory sync.
 * Source: https://support.travelpayouts.com/hc/ru/articles/360022674591-API-%D0%BE%D1%82-Travelata
 */
(function(root){
  'use strict';

  // IDs below are Travelata partner departure IDs from its public
  // https://traff.travelata.ru/constructor.php fromCity and departureCity
  // option lists, cross-checked with known Moscow=2 and Petersburg=1.
  // Never confuse these with Tutu SEO city slugs (e.g. Kazan SEO=33 vs
  // Travelata departure=29). Rostov-on-Don is absent and stays browse-only.
  const departures=[
    {key:'moscow',id:2,name:{ru:'Москва',en:'Moscow',hi:'मॉस्को'}},
    {key:'spb',id:1,name:{ru:'Санкт-Петербург',en:'Saint Petersburg',hi:'सेंट पीटर्सबर्ग'}},
    {key:'kazan',id:29,name:{ru:'Казань',en:'Kazan',hi:'कज़ान'}},
    {key:'ekaterinburg',id:25,name:{ru:'Екатеринбург',en:'Yekaterinburg',hi:'येकातेरिनबुर्ग'}},
    {key:'novosibirsk',id:53,name:{ru:'Новосибирск',en:'Novosibirsk',hi:'नोवोसिबिर्स्क'}},
    {key:'samara',id:64,name:{ru:'Самара',en:'Samara',hi:'समारा'}},
    {key:'nizhny-novgorod',id:50,name:{ru:'Нижний Новгород',en:'Nizhny Novgorod',hi:'निझनी नोवगोरोद'}},
    {key:'irkutsk',id:28,name:{ru:'Иркутск',en:'Irkutsk',hi:'इर्कुत्स्क'}},
    {key:'perm',id:61,name:{ru:'Пермь',en:'Perm',hi:'पेर्म'}},
    {key:'krasnodar',id:36,name:{ru:'Краснодар',en:'Krasnodar',hi:'क्रास्नोदार'}},
    {key:'rostov-on-don',id:null,name:{ru:'Ростов-на-Дону',en:'Rostov-on-Don',hi:'रोस्तोव-ऑन-डॉन'}},
    {key:'ufa',id:79,name:{ru:'Уфа',en:'Ufa',hi:'ऊफ़ा'}},
    {key:'cheboksary',id:83,name:{ru:'Чебоксары',en:'Cheboksary',hi:'चेबोक्सारी'}},
    {key:'sochi',id:67,name:{ru:'Сочи',en:'Sochi',hi:'सोची'}}
  ];
  // Browse URLs are verified public tours.tutu.ru landing pages.
  // Only numeric IDs confirmed by partner documentation or user examples are used for search.
  // Country IDs also verified from the public Travelata link-constructor
  // https://traff.travelata.ru/constructor.php (defaultCountry option values).
  // Turkey=92, Abkhazia=1 and Belarus=11 match documented partner APIs;
  // Egypt=29 remains grounded in the supplied Tutu-branded search example.
  const destinations=[
    {key:'russia',kind:'country',id:76,name:{ru:'Россия',en:'Russia',hi:'रूस'},ru:'Россия',browse:'https://tours.tutu.ru/strana/rossiya/',aliases:'rossiya winter snow'},
    {key:'turkey',kind:'country',id:92,name:{ru:'Турция',en:'Turkey',hi:'तुर्किये'},ru:'Турция',browse:'https://tours.tutu.ru/strana/turkey/',aliases:'turkiye turkiye türkiye'},
    {key:'egypt',kind:'country',id:29,name:{ru:'Египет',en:'Egypt',hi:'मिस्र'},ru:'Египет',browse:'https://tours.tutu.ru/strana/egypt/',aliases:'misr'},
    {key:'uae',kind:'country',id:68,name:{ru:'ОАЭ',en:'UAE',hi:'संयुक्त अरब अमीरात'},ru:'ОАЭ',browse:'https://tours.tutu.ru/strana/united_arab_emirates/',aliases:'emirates dubai дубай दुबई'},
    {key:'thailand',kind:'country',id:87,name:{ru:'Таиланд',en:'Thailand',hi:'थाईलैंड'},ru:'Таиланд',browse:'https://tours.tutu.ru/strana/thailand/',aliases:'тайланд'},
    {key:'india',kind:'country',id:33,name:{ru:'Индия',en:'India',hi:'भारत'},ru:'Индия',browse:'https://tours.tutu.ru/strana/india/',aliases:'bharat'},
    {key:'maldives',kind:'country',id:56,name:{ru:'Мальдивы',en:'Maldives',hi:'मालदीव'},ru:'Мальдивы',browse:'https://tours.tutu.ru/strana/maldives/',aliases:'maldivy'},
    {key:'abkhazia',kind:'country',id:1,name:{ru:'Абхазия',en:'Abkhazia',hi:'अब्खाज़िया'},ru:'Абхазия',browse:'https://tours.tutu.ru/strana/abkhazia/',aliases:''},
    {key:'uzbekistan',kind:'country',id:null,name:{ru:'Узбекистан',en:'Uzbekistan',hi:'उज़्बेकिस्तान'},ru:'Узбекистан',browse:'https://tours.tutu.ru/strana/uzbekistan/',aliases:''},
    {key:'cuba',kind:'country',id:48,name:{ru:'Куба',en:'Cuba',hi:'क्यूबा'},ru:'Куба',browse:'https://tours.tutu.ru/strana/cuba/',aliases:''},
    {key:'belarus',kind:'country',id:11,name:{ru:'Беларусь',en:'Belarus',hi:'बेलारूस'},ru:'Беларусь',browse:'https://tours.tutu.ru/strana/belarus/',aliases:''},
    {key:'kazakhstan',kind:'country',id:null,name:{ru:'Казахстан',en:'Kazakhstan',hi:'कज़ाख़स्तान'},ru:'Казахстан',browse:'https://tours.tutu.ru/strana/kazahstan/',aliases:''},
    {key:'georgia',kind:'country',id:129,name:{ru:'Грузия',en:'Georgia',hi:'जॉर्जिया'},ru:'Грузия',browse:'https://tours.tutu.ru/strana/georgia/',aliases:''},
    {key:'armenia',kind:'country',id:6,name:{ru:'Армения',en:'Armenia',hi:'आर्मेनिया'},ru:'Армения',browse:'https://tours.tutu.ru/strana/armeniya/',aliases:''},
    {key:'azerbaijan',kind:'country',id:null,name:{ru:'Азербайджан',en:'Azerbaijan',hi:'अज़रबैजान'},ru:'Азербайджан',browse:'https://tours.tutu.ru/strana/azerbaydjan/',aliases:''},
    {key:'kyrgyzstan',kind:'country',id:null,name:{ru:'Кыргызстан',en:'Kyrgyzstan',hi:'किर्गिज़स्तान'},ru:'Кыргызстан',browse:'https://tours.tutu.ru/strana/kirgizstan/',aliases:''},
    {key:'vietnam',kind:'country',id:22,name:{ru:'Вьетнам',en:'Vietnam',hi:'वियतनाम'},ru:'Вьетнам',browse:'https://tours.tutu.ru/strana/vietnam/',aliases:''},
    {key:'indonesia',kind:'country',id:34,name:{ru:'Индонезия',en:'Indonesia',hi:'इंडोनेशिया'},ru:'Индонезия',browse:'https://tours.tutu.ru/strana/indonesia/',aliases:'Bali बाली Бали'},
    {key:'srilanka',kind:'country',id:110,name:{ru:'Шри-Ланка',en:'Sri Lanka',hi:'श्रीलंका'},ru:'Шри-Ланка',browse:'https://tours.tutu.ru/strana/sri_lanka/',aliases:''},
    {key:'china',kind:'country',id:44,name:{ru:'Китай',en:'China',hi:'चीन'},ru:'Китай',browse:'https://tours.tutu.ru/strana/china/',aliases:''},
    {key:'japan',kind:'country',id:null,name:{ru:'Япония',en:'Japan',hi:'जापान'},ru:'Япония',browse:'https://tours.tutu.ru/strana/japan/',aliases:''},
    {key:'southkorea',kind:'country',id:null,name:{ru:'Южная Корея',en:'South Korea',hi:'दक्षिण कोरिया'},ru:'Южная Корея',browse:'https://tours.tutu.ru/strana/south_korea/',aliases:''},
    {key:'serbia',kind:'country',id:81,name:{ru:'Сербия',en:'Serbia',hi:'सर्बिया'},ru:'Сербия',browse:'https://tours.tutu.ru/strana/serbiya/',aliases:''},
    // All 45 currently listed Tutu tour countries have their own catalogue browse pages.
    {key:'austria',kind:'country',id:3,name:{ru:'Австрия',en:'Austria',hi:'ऑस्ट्रिया'},ru:'Австрия',browse:'https://tours.tutu.ru/strana/austria/',aliases:''},
    {key:'andorra',kind:'country',id:4,name:{ru:'Андорра',en:'Andorra',hi:'अंडोरा'},ru:'Андорра',browse:'https://tours.tutu.ru/strana/andorra/',aliases:''},
    {key:'bulgaria',kind:'country',id:13,name:{ru:'Болгария',en:'Bulgaria',hi:'बुल्गारिया'},ru:'Болгария',browse:'https://tours.tutu.ru/strana/bulgaria/',aliases:''},
    {key:'germany',kind:'country',id:24,name:{ru:'Германия',en:'Germany',hi:'जर्मनी'},ru:'Германия',browse:'https://tours.tutu.ru/strana/germany/',aliases:''},
    {key:'greece',kind:'country',id:26,name:{ru:'Греция',en:'Greece',hi:'ग्रीस'},ru:'Греция',browse:'https://tours.tutu.ru/strana/greece/',aliases:''},
    {key:'dominican-republic',kind:'country',id:28,name:{ru:'Доминикана',en:'Dominican Republic',hi:'डोमिनिकन गणराज्य'},ru:'Доминикана',browse:'https://tours.tutu.ru/strana/dominican_republic/',aliases:''},
    {key:'israel',kind:'country',id:32,name:{ru:'Израиль',en:'Israel',hi:'इज़राइल'},ru:'Израиль',browse:'https://tours.tutu.ru/strana/israel/',aliases:''},
    {key:'jordan',kind:'country',id:35,name:{ru:'Иордания',en:'Jordan',hi:'जॉर्डन'},ru:'Иордания',browse:'https://tours.tutu.ru/strana/jordan/',aliases:''},
    {key:'spain',kind:'country',id:38,name:{ru:'Испания',en:'Spain',hi:'स्पेन'},ru:'Испания',browse:'https://tours.tutu.ru/strana/spain/',aliases:''},
    {key:'italy',kind:'country',id:39,name:{ru:'Италия',en:'Italy',hi:'इटली'},ru:'Италия',browse:'https://tours.tutu.ru/strana/italy/',aliases:''},
    {key:'cyprus',kind:'country',id:43,name:{ru:'Кипр',en:'Cyprus',hi:'साइप्रस'},ru:'Кипр',browse:'https://tours.tutu.ru/strana/cyprus/',aliases:''},
    {key:'malta',kind:'country',id:57,name:{ru:'Мальта',en:'Malta',hi:'माल्टा'},ru:'Мальта',browse:'https://tours.tutu.ru/strana/malta/',aliases:''},
    {key:'morocco',kind:'country',id:59,name:{ru:'Марокко',en:'Morocco',hi:'मोरक्को'},ru:'Марокко',browse:'https://tours.tutu.ru/strana/morocco/',aliases:''},
    {key:'mexico',kind:'country',id:60,name:{ru:'Мексика',en:'Mexico',hi:'मेक्सिको'},ru:'Мексика',browse:'https://tours.tutu.ru/strana/mexico/',aliases:''},
    {key:'portugal',kind:'country',id:75,name:{ru:'Португалия',en:'Portugal',hi:'पुर्तगाल'},ru:'Португалия',browse:'https://tours.tutu.ru/strana/portugal/',aliases:''},
    {key:'tanzania',kind:'country',id:null,name:{ru:'Танзания',en:'Tanzania',hi:'तंज़ानिया'},ru:'Танзания',browse:'https://tours.tutu.ru/strana/tanzaniya/',aliases:''},
    {key:'tunisia',kind:'country',id:91,name:{ru:'Тунис',en:'Tunisia',hi:'ट्यूनीशिया'},ru:'Тунис',browse:'https://tours.tutu.ru/strana/tunisia/',aliases:''},
    {key:'france',kind:'country',id:99,name:{ru:'Франция',en:'France',hi:'फ्रांस'},ru:'Франция',browse:'https://tours.tutu.ru/strana/france/',aliases:''},
    {key:'croatia',kind:'country',id:101,name:{ru:'Хорватия',en:'Croatia',hi:'क्रोएशिया'},ru:'Хорватия',browse:'https://tours.tutu.ru/strana/croatia/',aliases:''},
    {key:'montenegro',kind:'country',id:104,name:{ru:'Черногория',en:'Montenegro',hi:'मोंटेनेग्रो'},ru:'Черногория',browse:'https://tours.tutu.ru/strana/chernogoriya/',aliases:''},
    {key:'czech-republic',kind:'country',id:105,name:{ru:'Чехия',en:'Czech Republic',hi:'चेक गणराज्य'},ru:'Чехия',browse:'https://tours.tutu.ru/strana/czech_republic/',aliases:''},
    {key:'switzerland',kind:'country',id:null,name:{ru:'Швейцария',en:'Switzerland',hi:'स्विट्ज़रलैंड'},ru:'Швейцария',browse:'https://tours.tutu.ru/strana/switzerland/',aliases:''},
    // Winter interests are explicit browse-only items, NOT unverified resorts.
    {key:'murmansk',kind:'winter',id:null,name:{ru:'Мурманск',en:'Murmansk',hi:'मुर्मांस्क'},ru:'Мурманск',browse:'https://tours.tutu.ru/strana/rossiya/kurort/murmansk/',aliases:'northern lights aurora aurora borealis polar lights северное сияние'},
    {key:'teriberka',kind:'winter',id:null,name:{ru:'Териберка',en:'Teriberka',hi:'तेरिबेरका'},ru:'Териберка',browse:'https://tours.tutu.ru/strana/rossiya/kurort/murmansk/',browseAs:'murmansk',aliases:'arctic lights northern lights arctic sea coast арктика'},
    {key:'baikal',kind:'winter',id:null,name:{ru:'Байкал',en:'Lake Baikal',hi:'बैकाल झील'},ru:'Байкал',browse:'https://tours.tutu.ru/strana/rossiya/kurort/baikal/',aliases:'irkutsk иркутск frozen lake blue ice clear ice winter lake बर्फ़ीली झील'},
    {key:'saint-petersburg',kind:'winter',id:null,name:{ru:'Санкт-Петербург',en:'Saint Petersburg',hi:'सेंट पीटर्सबर्ग'},ru:'Санкт-Петербург',browse:'https://tours.tutu.ru/strana/rossiya/kurort/saint_petersburg/',aliases:'spb petersburg питер'},
    {key:'moscow',kind:'winter',id:null,name:{ru:'Москва',en:'Moscow',hi:'मॉस्को'},ru:'Москва',browse:'https://tours.tutu.ru/strana/rossiya/kurort/moscow/',aliases:'moskva'},
    {key:'karelia',kind:'winter',id:null,name:{ru:'Карелия',en:'Karelia',hi:'कारेलिया'},ru:'Карелия',browse:'https://tours.tutu.ru/strana/rossiya/kurort/karelia/',aliases:'petrozavodsk петрозаводск snow forest winter huskies forests'},
    {key:'kazan',kind:'winter',id:null,name:{ru:'Казань',en:'Kazan',hi:'कज़ान'},ru:'Казань',browse:'https://tours.tutu.ru/strana/rossiya/kurort/kazan/',aliases:''},
    {key:'sochi',kind:'winter',id:null,name:{ru:'Сочи',en:'Sochi',hi:'सोची'},ru:'Сочи',browse:'https://tours.tutu.ru/strana/rossiya/kurort/sochi/',aliases:'rosa khutor красная поляна ski'},
    {key:'krasnaya-polyana',kind:'winter',id:null,name:{ru:'Красная Поляна',en:'Krasnaya Polyana',hi:'क्रास्नाया पोल्याना'},ru:'Красная Поляна',browse:'https://tours.tutu.ru/strana/rossiya/kurort/krasnaya_polyana/',aliases:'ski skiing snowboarding slopes snowy mountains горные лыжи'},
    {key:'sheregesh',kind:'winter',id:null,name:{ru:'Шерегеш',en:'Sheregesh',hi:'शेरेगेश'},ru:'Шерегеш',browse:'https://tours.tutu.ru/strana/rossiya/kurort/sheregesh/',aliases:'snow ski skiing snowboard powder snow winter resort снег'},
    {key:'arkhyz',kind:'winter',id:null,name:{ru:'Архыз',en:'Arkhyz',hi:'आर्खिज़'},ru:'Архыз',browse:'https://tours.tutu.ru/strana/rossiya/kurort/arkhyz/',aliases:'ski mountains кавказ'},
    {key:'altai',kind:'winter',id:null,name:{ru:'Алтай',en:'Altai',hi:'अल्ताई'},ru:'Алтай',browse:'https://tours.tutu.ru/strana/rossiya/kurort/altai/',aliases:'mountains snowy mountains nature snow winter горы'},
    {key:'gorno-altaysk',kind:'winter',id:null,name:{ru:'Горно-Алтайск',en:'Gorno-Altaysk',hi:'गोर्नो-अल्तायस्क'},ru:'Горно-Алтайск',browse:'https://tours.tutu.ru/strana/rossiya/kurort/gorno_altaysk/',aliases:'altai'},
    {key:'irkutsk',kind:'winter',id:null,name:{ru:'Иркутск',en:'Irkutsk',hi:'इर्कुत्स्क'},ru:'Иркутск',browse:'https://tours.tutu.ru/strana/rossiya/kurort/irkutsk/',aliases:'lake baikal'},
    {key:'listvyanka',kind:'winter',id:null,name:{ru:'Листвянка',en:'Listvyanka',hi:'लिस्तव्यांका'},ru:'Листвянка',browse:'https://tours.tutu.ru/strana/rossiya/kurort/listvyanka/',aliases:'baikal lakeside'},
    {key:'olkhon',kind:'winter',id:null,name:{ru:'Ольхон',en:'Olkhon Island',hi:'ओलखोन द्वीप'},ru:'Ольхон',browse:'https://tours.tutu.ru/strana/rossiya/kurort/olkhon/',aliases:'baikal ice lake island'},
    {key:'kaliningrad',kind:'winter',id:null,name:{ru:'Калининград',en:'Kaliningrad',hi:'कालिनिनग्राद'},ru:'Калининград',browse:'https://tours.tutu.ru/strana/rossiya/kurort/kaliningrad/',aliases:'baltic christmas'},
    {key:'yakutsk',kind:'winter',id:null,name:{ru:'Якутск',en:'Yakutsk',hi:'याकुत्स्क'},ru:'Якутск',browse:'https://tours.tutu.ru/strana/rossiya/kurort/yakutsk/',aliases:'snow winter cold'},
    {key:'suzdal',kind:'winter',id:null,name:{ru:'Суздаль',en:'Suzdal',hi:'सुज़दल'},ru:'Суздаль',browse:'https://tours.tutu.ru/strana/rossiya/kurort/suzdal/',aliases:'golden ring christmas'},
    {key:'veliky-novgorod',kind:'winter',id:null,name:{ru:'Великий Новгород',en:'Veliky Novgorod',hi:'वेलिकी नोवगोरोद'},ru:'Великий Новгород',browse:'https://tours.tutu.ru/strana/rossiya/kurort/veliky_novgorod/',aliases:'historic winter'},
    {key:'moscow-oblast',kind:'winter',id:null,name:{ru:'Подмосковье',en:'Moscow Region',hi:'मॉस्को क्षेत्र'},ru:'Подмосковье',browse:'https://tours.tutu.ru/strana/rossiya/kurort/moscow_oblast/',aliases:'winter retreat countryside'},
    {key:'golden-ring',kind:'winter',id:null,name:{ru:'Золотое кольцо',en:'Golden Ring',hi:'गोल्डन रिंग'},ru:'Золотое кольцо',browse:'https://tours.tutu.ru/strana/rossiya/kurort/golden_ring/',aliases:'suzdal vladimir historic'},
    {key:'rosa-khutor',kind:'winter',id:null,name:{ru:'Роза Хутор',en:'Rosa Khutor',hi:'रोज़ा खुतोर'},ru:'Роза Хутор',browse:'https://tours.tutu.ru/strana/rossiya/kurort/rosa_khutor/',aliases:'sochi ski'},
    {key:'dombay',kind:'winter',id:null,name:{ru:'Домбай',en:'Dombay',hi:'दोम्बाय'},ru:'Домбай',browse:'https://tours.tutu.ru/strana/rossiya/kurort/dombay/',aliases:'ski mountains caucasus'},
    {key:'prielbrusie',kind:'winter',id:null,name:{ru:'Приэльбрусье',en:'Elbrus Region',hi:'एल्ब्रुस क्षेत्र'},ru:'Приэльбрусье',browse:'https://tours.tutu.ru/strana/rossiya/kurort/prielbrusie/',aliases:'mount elbrus ski'},
    {key:'kislovodsk',kind:'winter',id:null,name:{ru:'Кисловодск',en:'Kislovodsk',hi:'किस्लोवोद्स्क'},ru:'Кисловодск',browse:'https://tours.tutu.ru/strana/rossiya/kurort/kislovodsk/',aliases:'spa north caucasus'},
    {key:'veliky-ustyug',kind:'winter',id:null,name:{ru:'Великий Устюг',en:'Veliky Ustyug',hi:'वेलिकी उस्त्यूग'},ru:'Великий Устюг',browse:'https://tours.tutu.ru/strana/rossiya/kurort/veliky_ustyug/',aliases:'ded moroz дед мороз santa claus father frost christmas magic सांता क्लॉज़'},
    {key:'antalya',kind:'resort',parent:'turkey',id:null,name:{ru:'Анталья',en:'Antalya',hi:'अंताल्या'},ru:'Анталья',browse:'https://tours.tutu.ru/strana/turkey/kurort/antalya/',aliases:'antalya turkey'},
    {key:'alanya',kind:'resort',parent:'turkey',id:null,name:{ru:'Аланья',en:'Alanya',hi:'अलान्या'},ru:'Аланья',browse:'https://tours.tutu.ru/strana/turkey/kurort/alanya/',aliases:'alania turkey'},
    {key:'istanbul',kind:'resort',parent:'turkey',id:null,name:{ru:'Стамбул',en:'Istanbul',hi:'इस्तांबुल'},ru:'Стамбул',browse:'https://tours.tutu.ru/strana/turkey/kurort/stambul/',aliases:'istanbul city'},
    {key:'hurghada',kind:'resort',parent:'egypt',id:null,name:{ru:'Хургада',en:'Hurghada',hi:'हुरगाडा'},ru:'Хургада',browse:'https://tours.tutu.ru/strana/egypt/kurort/hurgada/',aliases:'egypt red sea'},
    {key:'sharm-el-sheikh',kind:'resort',parent:'egypt',id:null,name:{ru:'Шарм-эль-Шейх',en:'Sharm El Sheikh',hi:'शर्म अल शेख़'},ru:'Шарм-эль-Шейх',browse:'https://tours.tutu.ru/strana/egypt/kurort/sharm-el-sheyh/',aliases:'sharm el sheikh'},
    {key:'phuket',kind:'resort',parent:'thailand',id:null,name:{ru:'Пхукет',en:'Phuket',hi:'फुकेत'},ru:'Пхукет',browse:'https://tours.tutu.ru/strana/thailand/kurort/phuket/',aliases:'thailand beach'},
    {key:'goa',kind:'resort',parent:'india',id:null,name:{ru:'Гоа',en:'Goa',hi:'गोवा'},ru:'Гоа',browse:'https://tours.tutu.ru/strana/india/kurort/goa/',aliases:'goa india beach'},
    {key:'bali',kind:'resort',parent:'indonesia',id:null,name:{ru:'Бали',en:'Bali',hi:'बाली'},ru:'Бали',browse:'https://tours.tutu.ru/strana/indonesia/kurort/bali/',aliases:'bali indonesia island'},
    {key:'dubai',kind:'resort',parent:'uae',id:null,name:{ru:'Дубай',en:'Dubai',hi:'दुबई'},ru:'Дубай',browse:'https://tours.tutu.ru/strana/united_arab_emirates/kurort/dubai/',aliases:'dubai emirates'}
  ];
  // Display-only additions from the public Travelata country/fromCity/toCity
  // dictionaries. The curated 81 items take precedence because their RU/EN/HI
  // names and Tutu URLs have been checked separately. Entries below are
  // selectable suggestions, not guarantees of availability or booking links.
  const provider=root.TUTU_TOUR_PUBLIC_OPTIONS||{countries:[],departures:[],resorts:{}};
  const providerStats={
    countries:(provider.countries||[]).length,
    departures:(provider.departures||[]).length,
    locations:Object.values(provider.resorts||{}).reduce((n,items)=>n+items.length,0)
  };
  const sameName=(a,b)=>String(a).toLocaleLowerCase('ru-RU').replace(/ё/g,'е').trim()===
                          String(b).toLocaleLowerCase('ru-RU').replace(/ё/g,'е').trim();
  const alreadyCountry=name=>destinations.some(d=>d.kind==='country'&&sameName(d.ru,name));
  for(const [sourceId,ru,en] of provider.countries||[]){
    if(alreadyCountry(ru))continue;
    destinations.push({key:'catalog-country-'+sourceId,kind:'country',id:null,source:'travelata-visual',
      ru,name:{ru,en,hi:en},aliases:en,providerId:Number(sourceId),browse:null});
  }
  for(const [sourceId,ru,en] of provider.departures||[]){
    if(departures.some(d=>sameName(d.name.ru,ru)))continue;
    departures.push({key:'catalog-departure-'+sourceId,id:null,source:'travelata-visual',
      name:{ru,en,hi:en},aliases:en,providerId:Number(sourceId)});
  }
  const providerParent={'76':'russia','92':'turkey','33':'india'};
  for(const [countryId,places] of Object.entries(provider.resorts||{})){
    const parent=providerParent[countryId];if(!parent)continue;
    for(const [sourceId,ru,en] of places){
      if(destinations.some(d=>(d.kind==='winter'||d.kind==='resort'||d.kind==='place')
         &&(d.parent||'russia')===parent&&sameName(d.ru,ru)))continue;
      destinations.push({key:'catalog-place-'+countryId+'-'+sourceId,kind:'place',
        parent,id:null,source:'travelata-visual',providerId:Number(sourceId),
        ru,name:{ru,en,hi:en},aliases:en,browse:null});
    }
  }
  const byKey=new Map(destinations.map(d=>[d.key,d]));
  // Each of the following 7 x 4 city/resort combinations was independently
  // checked to return an exact-path HTTP 200 page whose heading matches the
  // selected origin and resort (11 October 2026, CI winter-route audit).
  // These numbers are Tutu SEO city slugs, never Travelata partner IDs.
  // Do not expand either whitelist without testing the new combinations.
  const winterSeoOriginSlugs={
    moscow:'491_moskva',
    spb:'75_sankt-peterburg',
    kazan:'33_kazan',
    ekaterinburg:'29_ekaterinburg'
  };
  const winterSeoResortSlugs={
    baikal:'baikal',
    karelia:'karelia',
    'krasnaya-polyana':'krasnaya_polyana',
    sheregesh:'sheregesh',
    altai:'altai',
    sochi:'sochi',
    'veliky-ustyug':'veliky_ustyug'
  };
  function winterCityTourPage(destination,origin){
    const resort=winterSeoResortSlugs[destination],city=winterSeoOriginSlugs[origin];
    return resort&&city
      ?'https://tours.tutu.ru/rossiya/'+resort+'/iz/'+city+'/'
      :null;
  }
  // Travelata's public toCity dropdown lists Murmansk=1726 under Russia=76.
  // Read-only live Tutu x Travelata search confirmed that the country-level
  // query with #?toCountry=76&toCity=1726 visibly selects Murmansk.
  // Other winter resorts stay browse-only until the same check is completed.
  const brandedResorts={murmansk:{country:'russia',cityId:1726}};
  const departureByKey=new Map(departures.map(d=>[d.key,d]));
  // Tutu SEO pages, NOT Travelata search departure IDs.
  const murmanskFromPages={
    moscow:'https://tours.tutu.ru/rossiya/murmansk/iz/491_moskva/',
    spb:'https://tours.tutu.ru/rossiya/murmansk/iz/75_sankt-peterburg/',
    kazan:'https://tours.tutu.ru/rossiya/murmansk/iz/33_kazan/',
    ekaterinburg:'https://tours.tutu.ru/rossiya/murmansk/iz/29_ekaterinburg/',
    novosibirsk:'https://tours.tutu.ru/rossiya/murmansk/iz/58_novosibirsk/',
    samara:'https://tours.tutu.ru/rossiya/murmansk/iz/74_samara/',
    'nizhny-novgorod':'https://tours.tutu.ru/rossiya/murmansk/iz/55_nijniy_novgorod/',
    irkutsk:'https://tours.tutu.ru/rossiya/murmansk/iz/31_irkutsk/',
    perm:'https://tours.tutu.ru/rossiya/murmansk/iz/68_perm/',
    krasnodar:'https://tours.tutu.ru/rossiya/murmansk/iz/39_krasnodar/',
    'rostov-on-don':'https://tours.tutu.ru/rossiya/murmansk/iz/72_rostov-na-donu/'
  };

  function normalize(value){
    return String(value||'').toLocaleLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
  }
  function find(query,limit){
    const q=normalize(query);
    const featured=['russia','murmansk','baikal','teriberka','karelia','sheregesh',
      'moscow','saint-petersburg','goa','india','turkey','uae','egypt','dubai','phuket'];
    const rank=d=>{
      if(!q){const i=featured.indexOf(d.key);return i<0?100:i}
      const names=Object.values(d.name).map(normalize);
      if(names.some(n=>n===q))return 0;
      if(names.some(n=>n.startsWith(q)))return 1;
      if(normalize(d.aliases).split(' ').some(n=>n===q||n.startsWith(q)))return 2;
      if(names.some(n=>n.includes(q)))return 3;
      return 4;
    };
    return destinations.filter(d=>!q||normalize(Object.values(d.name).join(' ')+' '+d.aliases).includes(q))
      .sort((a,b)=>rank(a)-rank(b)).slice(0,Math.min(30,Math.max(1,limit||12)));
  }
  function dateParts(isoDate){
    const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate||''));
    if(!m)return null;
    const y=Number(m[1]),mo=Number(m[2]),day=Number(m[3]);
    const dt=new Date(y,mo-1,day);
    if(dt.getFullYear()!==y||dt.getMonth()!==mo-1||dt.getDate()!==day)return null;
    return {iso:m[0],local:m[3]+'.'+m[2]+'.'+m[1]};
  }
  function build(state){
    const dep=departureByKey.get(state.departure),d=byKey.get(state.destination),date=dateParts(state.date);
    const min=Number(state.nightsMin),max=Number(state.nightsMax),adults=Number(state.adults);
    const children=state.children===undefined?0:Number(state.children);
    const ages=Array.isArray(state.childAges)?state.childAges:[];
    if(!dep||!d||!date||!Number.isInteger(min)||!Number.isInteger(max)||min<1||max>29||min>max||
       !Number.isInteger(adults)||adults<1||adults>6||
       !Number.isInteger(children)||children<0||children>3||adults+children>9||
       (children>0&&(ages.length!==children||ages.some(a=>!Number.isInteger(a)||a<0||a>17))))
       throw new Error('Invalid tour search');
    const today=new Date(),pad=n=>String(n).padStart(2,'0');
    const todayIso=today.getFullYear()+'-'+pad(today.getMonth()+1)+'-'+pad(today.getDate());
    const maxDate=new Date(today.getFullYear(),today.getMonth()+11,today.getDate());
    const maxIso=maxDate.getFullYear()+'-'+pad(maxDate.getMonth()+1)+'-'+pad(maxDate.getDate());
    if(date.iso<todayIso||date.iso>maxIso)throw new Error('Invalid tour date');

    // Only allow verified resort/country pairs into the branded search.
    const resort=d.kind==='winter'?brandedResorts[d.key]:null;
    const searchCountry=resort?byKey.get(resort.country):d;
    if((!resort&&!Number.isInteger(d.id))||!Number.isInteger(dep.id)||children>0){
      const target=(d.key==='murmansk'||d.browseAs==='murmansk')
        ?murmanskFromPages[dep.key]
        :d.kind==='winter'?winterCityTourPage(d.key,dep.key):null;
      return {url:target||d.browse,filtered:false,destination:d,departure:dep,
        departureApplied:Boolean(target),reason:children>0?'children':
         !Number.isInteger(dep.id)?'departure':'destination'};
    }
    if(d.kind!=='country'&&!resort)throw new Error('Unverified destination type');

    const q=new URLSearchParams();
    q.set('departure',String(dep.id));
    q.set('arrival_id',String(searchCountry.id));
    q.set('arrival_type','country');
    q.set('arrival_text',searchCountry.ru);
    q.set('date_begin',date.local);
    q.set('date_end',date.local);
    q.set('adults',String(adults));
    q.set('nights_min',String(min));
    q.set('nights_max',String(max));
    q.set('utm_source','tutu_main');
    q.set('utm_medium','internal');
    q.set('utm_content','tours_search_form');

    // sid is a provider-generated session token; never copy one from a sample URL.
    const hash=new URLSearchParams();
    hash.set('fromCity',String(dep.id));
    hash.set('toCountry',String(searchCountry.id));
    if(resort)hash.set('toCity',String(resort.cityId));
    hash.set('dateFrom',date.local);
    hash.set('dateTo',date.local);
    hash.set('nightFrom',String(min));
    hash.set('nightTo',String(max));
    hash.set('adults',String(adults));
    hash.set('hotelClass','all');
    hash.set('meal','all');
    hash.set('priceFrom','6000');
    hash.set('priceTo','21000000');
    hash.set('sort','recommend');
    return {url:'https://web.tutu.travelata.ru/search/?'+q.toString()+'#?'+hash.toString(),filtered:true,destination:d,resortApplied:Boolean(resort)};
  }
  root.TUTU_TOURS={departures,destinations,byKey,departureByKey,find,build,dateParts,murmanskFromPages,winterCityTourPage,brandedResorts,providerStats};
})(window);
