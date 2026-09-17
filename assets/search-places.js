/* Shared multilingual place database for India Landing.
   Canonical English names/IDs are stable so route URL templates can be added later. */
(function(){
  const C={
    RU:{ru:'Россия',en:'Russia',hi:'रूस'},IN:{ru:'Индия',en:'India',hi:'भारत'},KZ:{ru:'Казахстан',en:'Kazakhstan',hi:'कज़ाख़स्तान'},UZ:{ru:'Узбекистан',en:'Uzbekistan',hi:'उज़्बेकिस्तान'},KG:{ru:'Кыргызстан',en:'Kyrgyzstan',hi:'किर्गिज़स्तान'},TJ:{ru:'Таджикистан',en:'Tajikistan',hi:'ताजिकिस्तान'},AM:{ru:'Армения',en:'Armenia',hi:'आर्मेनिया'},AZ:{ru:'Азербайджан',en:'Azerbaijan',hi:'अज़रबैजान'},BY:{ru:'Беларусь',en:'Belarus',hi:'बेलारूस'},MD:{ru:'Молдова',en:'Moldova',hi:'मोल्दोवा'},TM:{ru:'Туркменистан',en:'Turkmenistan',hi:'तुर्कमेनिस्तान'},GE:{ru:'Грузия',en:'Georgia',hi:'जॉर्जिया'},CN:{ru:'Китай',en:'China',hi:'चीन'},AE:{ru:'ОАЭ',en:'UAE',hi:'यूएई'},QA:{ru:'Катар',en:'Qatar',hi:'क़तर'},TR:{ru:'Турция',en:'Turkey',hi:'तुर्की'}
  };
  const rows=[
    // Russia — major, regional and university cities
    ['RU','Москва','Moscow','मॉस्को','MOW','SVO DME VKO ZIA Moskva Москва',1],
    ['RU','Санкт-Петербург','Saint Petersburg','सेंट पीटर्सबर्ग','LED','St Petersburg SPB Питер Петербург',2],
    ['RU','Казань','Kazan','कज़ान','KZN','',3],
    ['RU','Сочи','Sochi','सोची','AER','Adler Адлер',4],
    ['RU','Екатеринбург','Yekaterinburg','येकातेरिनबर्ग','SVX','Ekaterinburg',5],
    ['RU','Новосибирск','Novosibirsk','नोवोसिबिर्स्क','OVB','',6],
    ['RU','Уфа','Ufa','ऊफ़ा','UFA','',7],
    ['RU','Самара','Samara','समारा','KUF','',8],
    ['RU','Красноярск','Krasnoyarsk','क्रास्नोयार्स्क','KJA','',9],
    ['RU','Нижний Новгород','Nizhny Novgorod','निझ्नी नोवगोरोद','GOJ','Nizhniy Novgorod',10],
    ['RU','Омск','Omsk','ओम्स्क','OMS','',11],
    ['RU','Пермь','Perm','पर्म','PEE','',12],
    ['RU','Челябинск','Chelyabinsk','चेल्याबिंस्क','CEK','',13],
    ['RU','Тюмень','Tyumen','त्युमेन','TJM','Tiumen',14],
    ['RU','Иркутск','Irkutsk','इरकुत्स्क','IKT','',15],
    ['RU','Калининград','Kaliningrad','कलिनिनग्राद','KGD','',16],
    ['RU','Владивосток','Vladivostok','व्लादिवोस्तोक','VVO','',17],
    ['RU','Хабаровск','Khabarovsk','खाबारोव्स्क','KHV','',18],
    ['RU','Волгоград','Volgograd','वोल्गोग्राद','VOG','',19],
    ['RU','Оренбург','Orenburg','ओरेनबुर्ग','REN','',20],
    ['RU','Саратов','Saratov','सारातोव','GSV','',21],
    ['RU','Ульяновск','Ulyanovsk','उल्यानोव्स्क','ULV','',22],
    ['RU','Махачкала','Makhachkala','मखाचकला','MCX','',23],
    ['RU','Минеральные Воды','Mineralnye Vody','मिनेराल्नी वोडी','MRV','Mineral Waters Минводы',24],
    ['RU','Краснодар','Krasnodar','क्रास्नोदार','KRR','',25],
    ['RU','Анапа','Anapa','अनापा','AAQ','',26],
    ['RU','Геленджик','Gelendzhik','गेलेंदझिक','GDZ','',27],
    ['RU','Ставрополь','Stavropol','स्तावरोपोल','STW','',28],
    ['RU','Грозный','Grozny','ग्रोज़्नी','GRV','',29],
    ['RU','Владикавказ','Vladikavkaz','व्लादिकावकाज़','OGZ','',30],
    ['RU','Нальчик','Nalchik','नालचिक','NAL','',31],
    ['RU','Астрахань','Astrakhan','अस्त्राखान','ASF','',32],
    ['RU','Йошкар-Ола','Yoshkar-Ola','योश्कर-ओला','JOK','Yoshkar Ola Йошкар Ола',33],
    ['RU','Тверь','Tver','त्वेर','','',34],
    ['RU','Курск','Kursk','कुर्स्क','URS','',35],
    ['RU','Белгород','Belgorod','बेलगोरोद','EGO','',36],
    ['RU','Брянск','Bryansk','ब्रियांस्क','BZK','',37],
    ['RU','Смоленск','Smolensk','स्मोलेंस्क','','',38],
    ['RU','Псков','Pskov','प्स्कोव','PKV','',39],
    ['RU','Великий Новгород','Veliky Novgorod','वेलिकी नोवगोरोद','','Novgorod',40],
    ['RU','Рязань','Ryazan','रियाज़ान','','Riazan',41],
    ['RU','Тула','Tula','तूला','','',42],
    ['RU','Орёл','Oryol','ओर्योल','','Orel Орел',43],
    ['RU','Калуга','Kaluga','कलुगा','KLF','',44],
    ['RU','Иваново','Ivanovo','इवानोवो','IWA','',45],
    ['RU','Ярославль','Yaroslavl','यारोस्लाव्ल','IAR','',46],
    ['RU','Кострома','Kostroma','कोस्त्रोमा','KMW','',47],
    ['RU','Вологда','Vologda','वोलोग्दा','VGD','',48],
    ['RU','Череповец','Cherepovets','चेरेपोवेत्स','CEE','',49],
    ['RU','Владимир','Vladimir','व्लादिमीर','','',50],
    ['RU','Тамбов','Tambov','ताम्बोव','TBW','',51],
    ['RU','Липецк','Lipetsk','लिपेत्स्क','LPK','',52],
    ['RU','Воронеж','Voronezh','वोरोनेझ','VOZ','',53],
    ['RU','Пенза','Penza','पेंज़ा','PEZ','',54],
    ['RU','Саранск','Saransk','सारांस्क','SKX','',55],
    ['RU','Чебоксары','Cheboksary','चेबोक्सारी','CSY','',56],
    ['RU','Киров','Kirov','कीरोव','KVX','',57],
    ['RU','Ижевск','Izhevsk','इझेव्स्क','IJK','',58],
    ['RU','Барнаул','Barnaul','बरनौल','BAX','',59],
    ['RU','Горно-Алтайск','Gorno-Altaysk','गोर्नो-अल्ताइस्क','RGK','Gorno Altaysk',60],
    ['RU','Томск','Tomsk','तोम्स्क','TOF','',61],
    ['RU','Кемерово','Kemerovo','केमेरोवो','KEJ','',62],
    ['RU','Новокузнецк','Novokuznetsk','नोवोकुज़नेत्स्क','NOZ','',63],
    ['RU','Абакан','Abakan','अबाकान','ABA','',64],
    ['RU','Кызыл','Kyzyl','किज़िल','KYZ','',65],
    ['RU','Курган','Kurgan','कुर्गान','KRO','',66],
    ['RU','Магнитогорск','Magnitogorsk','मैग्नितोगोर्स्क','MQF','',67],
    ['RU','Сургут','Surgut','सुरगुत','SGC','',68],
    ['RU','Нижневартовск','Nizhnevartovsk','निझनेवार्तोव्स्क','NJC','',69],
    ['RU','Ханты-Мансийск','Khanty-Mansiysk','खांती-मान्सीस्क','HMA','Khanty Mansiysk',70],
    ['RU','Нефтеюганск','Nefteyugansk','नेफ्तेयुगांस्क','','',71],
    ['RU','Ноябрьск','Noyabrsk','नोयाब्र्स्क','NOJ','',72],
    ['RU','Новый Уренгой','Novy Urengoy','नोवी उरेंगोय','NUX','',73],
    ['RU','Салехард','Salekhard','सालेखार्द','SLY','',74],
    ['RU','Надым','Nadym','नादिम','NYM','',75],
    ['RU','Когалым','Kogalym','कोगालिम','KGP','',76],
    ['RU','Урай','Uray','उराय','URJ','',77],
    ['RU','Тобольск','Tobolsk','तोबोल्स्क','RMZ','',78],
    ['RU','Улан-Удэ','Ulan-Ude','उलान-उदे','UUD','Ulan Ude',79],
    ['RU','Чита','Chita','चिता','HTA','',80],
    ['RU','Братск','Bratsk','ब्रात्स्क','BTK','',81],
    ['RU','Усть-Кут','Ust-Kut','उस्त-कुत','UKX','Ust Kut',82],
    ['RU','Благовещенск','Blagoveshchensk','ब्लागोवेश्चेन्स्क','BQS','',83],
    ['RU','Якутск','Yakutsk','याकुत्स्क','YKS','',84],
    ['RU','Мирный','Mirny','मिर्नी','MJZ','',85],
    ['RU','Нерюнгри','Neryungri','नेर्युंग्री','NER','',86],
    ['RU','Магадан','Magadan','मागादान','GDX','',87],
    ['RU','Анадырь','Anadyr','अनादिर','DYR','',88],
    ['RU','Петропавловск-Камчатский','Petropavlovsk-Kamchatsky','पेत्रोपावलोव्स्क-कामचात्स्की','PKC','Petropavlovsk Kamchatsky',89],
    ['RU','Южно-Сахалинск','Yuzhno-Sakhalinsk','युज़्नो-साखालिंस्क','UUS','Yuzhno Sakhalinsk',90],
    ['RU','Комсомольск-на-Амуре','Komsomolsk-on-Amur','कोम्सोमोल्स्क-ऑन-अमूर','KXK','Komsomolsk na Amure',91],
    ['RU','Николаевск-на-Амуре','Nikolaevsk-on-Amur','निकोलायेव्स्क-ऑन-अमूर','NLI','',92],
    ['RU','Советская Гавань','Sovetskaya Gavan','सोवेत्स्काया गवान','GVN','',93],
    ['RU','Тында','Tynda','तिन्दा','TYD','',94],
    ['RU','Архангельск','Arkhangelsk','आर्खांगेलेस्क','ARH','',95],
    ['RU','Мурманск','Murmansk','मुरमान्स्क','MMK','',96],
    ['RU','Петрозаводск','Petrozavodsk','पेत्रोज़ावोद्स्क','PES','',97],
    ['RU','Сыктывкар','Syktyvkar','सिक्तिवकार','SCW','',98],
    ['RU','Ухта','Ukhta','उख्ता','UCT','',99],
    ['RU','Усинск','Usinsk','उसिंस्क','USK','',100],
    ['RU','Воркута','Vorkuta','वोरकुता','VKT','',101],
    ['RU','Нарьян-Мар','Naryan-Mar','नार्यान-मार','NNM','Naryan Mar',102],
    ['RU','Норильск','Norilsk','नोरिल्स्क','NSK','',103],
    ['RU','Игарка','Igarka','इगार्का','IAA','',104],
    ['RU','Певек','Pevek','पेवेक','PWE','',105],
    ['RU','Тикси','Tiksi','तिक्सी','IKS','',106],
    ['RU','Орск','Orsk','ओर्स्क','OSW','',107],
    ['RU','Нижнекамск','Nizhnekamsk','निझनेकाम्स्क','NBC','',108],
    ['RU','Бугульма','Bugulma','बुगुल्मा','UUA','',109],
    ['RU','Старый Оскол','Stary Oskol','स्तारी ओस्कोल','','',110],
    ['RU','Печора','Pechora','पेचोरा','PEX','',111],
    ['RU','Котлас','Kotlas','कोटलास','KSZ','',112],
    ['RU','Великий Устюг','Veliky Ustyug','वेलिकी उस्त्युग','VUS','',113],
    ['RU','Ейск','Yeysk','येइस्क','','Eysk',114],
    ['RU','Элиста','Elista','एलिस्ता','ESL','',115],
    ['RU','Пятигорск','Pyatigorsk','प्यातिगोर्स्क','','',116],
    ['RU','Кисловодск','Kislovodsk','किस्लोवोद्स्क','','',117],
    ['RU','Ессентуки','Yessentuki','येस्सेंतुकी','','Essentuki',118],
    ['RU','Железноводск','Zheleznovodsk','झेलेज़नोवोद्स्क','','',119],
    ['RU','Таганрог','Taganrog','तगानरोग','','',120],
    ['RU','Тольятти','Tolyatti','तोल्यात्ती','','Togliatti',121],
    ['RU','Набережные Челны','Naberezhnye Chelny','नाबेरेझ्निये चेल्नी','','Naberezhnye Chelny',122],

    // India — international and high-demand nodes
    ['IN','Дели','Delhi','दिल्ली','DEL','New Delhi Dilli Нью-Дели',1],
    ['IN','Мумбаи','Mumbai','मुंबई','BOM','Bombay Бомбей',2],
    ['IN','Бенгалуру','Bengaluru','बेंगलुरु','BLR','Bangalore Бангалор',3],
    ['IN','Хайдарабад','Hyderabad','हैदराबाद','HYD','',4],
    ['IN','Ченнаи','Chennai','चेन्नई','MAA','Madras Мадрас',5],
    ['IN','Колката','Kolkata','कोलकाता','CCU','Calcutta Калькутта',6],
    ['IN','Кочи','Kochi','कोच्चि','COK','Cochin Кочин',7],
    ['IN','Гоа','Goa','गोवा','GOI GOX','Dabolim Mopa Даболим Мопа',8],
    ['IN','Ахмадабад','Ahmedabad','अहमदाबाद','AMD','',9],
    ['IN','Джайпур','Jaipur','जयपुर','JAI','',10],
    ['IN','Лакхнау','Lucknow','लखनऊ','LKO','',11],
    ['IN','Гувахати','Guwahati','गुवाहाटी','GAU','',12],
    ['IN','Амритсар','Amritsar','अमृतसर','ATQ','',13],
    ['IN','Варанаси','Varanasi','वाराणसी','VNS','Benares Banaras',14],
    ['IN','Пуна','Pune','पुणे','PNQ','Poona',15],
    ['IN','Нагпур','Nagpur','नागपुर','NAG','',16],
    ['IN','Чандигарх','Chandigarh','चंडीगढ़','IXC','',17],
    ['IN','Бхубанешвар','Bhubaneswar','भुवनेश्वर','BBI','',18],
    ['IN','Патна','Patna','पटना','PAT','',19],
    ['IN','Мангалур','Mangaluru','मंगलुरु','IXE','Mangalore Мангалор',20],
    ['IN','Каннур','Kannur','कन्नूर','CNN','',21],
    ['IN','Шринагар','Srinagar','श्रीनगर','SXR','',22],
    ['IN','Коимбатур','Coimbatore','कोयंबटूर','CJB','',23],
    ['IN','Индаур','Indore','इंदौर','IDR','',24],
    ['IN','Райпур','Raipur','रायपुर','RPR','',25],
    ['IN','Тируччираппалли','Tiruchirappalli','तिरुचिरापल्ली','TRZ','Trichy Tiruchirapalli',26],
    ['IN','Порт-Блэр','Port Blair','पोर्ट ब्लेयर','IXZ','',27],
    ['IN','Вишакхапатнам','Visakhapatnam','विशाखापत्तनम','VTZ','Vizag',28],
    ['IN','Кожикоде','Kozhikode','कोझिकोड','CCJ','Calicut Каликут',29],
    ['IN','Тируванантапурам','Thiruvananthapuram','तिरुवनंतपुरम','TRV','Trivandrum Тривандрум',30],
    ['IN','Сурат','Surat','सूरत','STV','',31],

    // Kazakhstan
    ['KZ','Алматы','Almaty','अल्माटी','ALA','Alma-Ata Алма-Ата',1],
    ['KZ','Астана','Astana','अस्ताना','NQZ','Nur-Sultan Нур-Султан',2],
    ['KZ','Шымкент','Shymkent','शिमकेंट','CIT','Chimkent',3],
    ['KZ','Актау','Aktau','अक्ताउ','SCO','',4],
    ['KZ','Актобе','Aktobe','अक्तोबे','AKX','',5],
    ['KZ','Атырау','Atyrau','अतिराउ','GUW','',6],
    ['KZ','Караганда','Karaganda','करागांदा','KGF','',7],
    ['KZ','Костанай','Kostanay','कोस्तानाय','KSN','',8],
    ['KZ','Кызылорда','Kyzylorda','किज़िलोर्दा','KZO','',9],
    ['KZ','Павлодар','Pavlodar','पावलोदार','PWQ','',10],
    ['KZ','Петропавловск','Petropavl','पेत्रोपावल','PPK','Petropavlovsk',11],
    ['KZ','Семей','Semey','सेमेय','PLX','Semipalatinsk Семипалатинск',12],
    ['KZ','Тараз','Taraz','तराज़','DMB','',13],
    ['KZ','Туркестан','Turkistan','तुर्किस्तान','HSA','',14],
    ['KZ','Уральск','Oral','ओरल','URA','Uralsk',15],
    ['KZ','Усть-Каменогорск','Oskemen','उस्केमेन','UKK','Ust-Kamenogorsk',16],
    ['KZ','Жезказган','Zhezkazgan','झेज़काज़गान','DZN','',17],
    ['KZ','Кокшетау','Kokshetau','कोकशेताउ','KOV','',18],
    ['KZ','Балхаш','Balkhash','बाल्खाश','BXH','',19],
    ['KZ','Байконур','Baikonur','बाइकोनूर','BXY','',20],
    ['KZ','Талдыкорган','Taldykorgan','ताल्दिकोर्गान','TDK','',21],
    ['KZ','Ушарал','Usharal','उशाराल','USJ','',22],
    ['KZ','Урджар','Urzhar','उरझार','UZR','',23],
    ['KZ','Зайсан','Zaysan','ज़ैसान','SZI','',24],

    // Uzbekistan
    ['UZ','Ташкент','Tashkent','ताशकंद','TAS','',1],
    ['UZ','Самарканд','Samarkand','समरकंद','SKD','Samarqand',2],
    ['UZ','Бухара','Bukhara','बुखारा','BHK','Buxoro',3],
    ['UZ','Фергана','Fergana','फ़रग़ना','FEG','Fargona',4],
    ['UZ','Наманган','Namangan','नमंगन','NMA','',5],
    ['UZ','Андижан','Andijan','अंदिजान','AZN','Andijon',6],
    ['UZ','Карши','Qarshi','कार्शी','KSQ','Karshi',7],
    ['UZ','Навои','Navoi','नवोई','NVI','Navoiy',8],
    ['UZ','Нукус','Nukus','नुकुस','NCU','',9],
    ['UZ','Ургенч','Urgench','उरगेन्च','UGC','',10],
    ['UZ','Термез','Termez','तेरमेज़','TMJ','',11],
    ['UZ','Коканд','Kokand','कोकंद','','QoQon',12],
    ['UZ','Зарафшан','Zarafshan','ज़रफ़शान','','',13],
    ['UZ','Муйнак','Muynak','मुइनाक','','Moynaq',14],
    ['UZ','Заамин','Zaamin','ज़ामिन','','',15],

    // Kyrgyzstan
    ['KG','Бишкек','Bishkek','बिश्केक','BSZ','Frunze Фрунзе',1],
    ['KG','Ош','Osh','ओश','OSS','',2],
    ['KG','Иссык-Куль','Issyk-Kul','इस्सिक-कुल','IKU','Tamchy Тамчы',3],
    ['KG','Баткен','Batken','बतकेन','БAT','',4],
    ['KG','Каракол','Karakol','कराकोल','','',5],
    ['KG','Джалал-Абад','Jalal-Abad','जलाल-अबाद','','',6],
    ['KG','Исфана','Isfana','इस्फाना','','Razzakov',7],

    // Tajikistan
    ['TJ','Душанбе','Dushanbe','दुशांबे','DYU','',1],
    ['TJ','Худжанд','Khujand','खुजंद','LBD','Khudzhand',2],
    ['TJ','Куляб','Kulob','कुलोब','TJU','Kulyab',3],
    ['TJ','Бохтар','Bokhtar','बोख्तर','KQT','Qurghonteppa Kurgan-Tyube',4],

    // Armenia
    ['AM','Ереван','Yerevan','येरेवान','EVN','Erevan',1],
    ['AM','Гюмри','Gyumri','ग्युमरी','LWN','Leninakan',2],
    ['AM','Дилижан','Dilijan','दिलिजान','','',3],
    ['AM','Ванадзор','Vanadzor','वनादज़ोर','','',4],
    ['AM','Цахкадзор','Tsaghkadzor','त्साखकादज़ोर','','',5],

    // Azerbaijan
    ['AZ','Баку','Baku','बाकू','GYD','',1],
    ['AZ','Гянджа','Ganja','गांजा','GNJ','Gence',2],
    ['AZ','Нахичевань','Nakhchivan','नखचिवान','NAJ','',3],
    ['AZ','Габала','Gabala','गबाला','GBB','Qabala',4],
    ['AZ','Ленкорань','Lankaran','लांकरान','LLK','Lankaran',5],
    ['AZ','Загатала','Zaqatala','ज़काताला','ZTU','Zagatala',6],

    // Belarus
    ['BY','Минск','Minsk','मिन्स्क','MSQ','',1],
    ['BY','Брест','Brest','ब्रेस्ट','BQT','',2],
    ['BY','Гомель','Gomel','गोमेल','GME','',3],
    ['BY','Гродно','Grodno','ग्रोद्नो','GNA','Hrodna',4],
    ['BY','Витебск','Vitebsk','वितेब्स्क','VTB','',5],
    ['BY','Могилёв','Mogilev','मोगिलेव','MVQ','Mahilyow',6],

    // Moldova
    ['MD','Кишинёв','Chisinau','किशिनाउ','RMO','Kishinev Chişinău',1],
    ['MD','Бельцы','Balti','बाल्त्सी','','Bălți',2],

    // Turkmenistan
    ['TM','Ашхабад','Ashgabat','अश्गाबात','ASB','Ashkhabad',1],
    ['TM','Туркменбаши','Turkmenbashi','तुर्कमेनबाशी','KRW','',2],
    ['TM','Туркменабад','Turkmenabat','तुर्कमेनाबात','CRZ','',3],
    ['TM','Мары','Mary','मारी','MYP','',4],
    ['TM','Дашогуз','Dashoguz','दाशोगुज़','TAZ','',5],
    ['TM','Керки','Kerki','केर्की','KEA','',6],
    ['TM','Балканабат','Balkanabat','बल्कानाबात','','Nebit Dag',7],

    // Georgia
    ['GE','Тбилиси','Tbilisi','त्बिलिसी','TBS','Tiflis',1],
    ['GE','Батуми','Batumi','बातुमी','BUS','',2],
    ['GE','Кутаиси','Kutaisi','कुताइसी','KUT','',3],
    ['GE','Гудаури','Gudauri','गुदाउरी','','',4],
    ['GE','Боржоми','Borjomi','बोरजोमी','','',5],
    ['GE','Кобулети','Kobuleti','कोबुलेती','','',6],

    // China — intentionally limited to 10 useful nodes
    ['CN','Пекин','Beijing','बीजिंग','BJS','PEK PKX Peking',1],
    ['CN','Шанхай','Shanghai','शंघाई','SHA','PVG',2],
    ['CN','Гуанчжоу','Guangzhou','ग्वांगझोउ','CAN','Canton',3],
    ['CN','Шэньчжэнь','Shenzhen','शेन्ज़ेन','SZX','',4],
    ['CN','Санья','Sanya','सान्या','SYX','',5],
    ['CN','Хайкоу','Haikou','हाइकोउ','HAK','',6],
    ['CN','Харбин','Harbin','हार्बिन','HRB','',7],
    ['CN','Чэнду','Chengdu','चेंगदू','CTU TFU','',8],
    ['CN','Урумчи','Urumqi','उरुमची','URC','Urumchi',9],
    ['CN','Маньчжурия','Manzhouli','मांझोउली','NZH','Manchuria',10],

    // Useful international hubs
    ['AE','Дубай','Dubai','दुबई','DXB DWC','',1],
    ['AE','Абу-Даби','Abu Dhabi','अबू धाबी','AUH','',2],
    ['AE','Шарджа','Sharjah','शारजाह','SHJ','',3],
    ['QA','Доха','Doha','दोहा','DOH','',1],
    ['TR','Стамбул','Istanbul','इस्तांबुल','IST SAW','Constantinople',1],
    ['TR','Анталья','Antalya','अंताल्या','AYT','',2]
  ];

  const slug=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const normalize=s=>String(s||'').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ё/g,'е').replace(/[’'`]/g,'').replace(/[-_/.,()]+/g,' ').replace(/\s+/g,' ').trim();
  const places=rows.map((r,i)=>{
    const [country,ru,en,hi,iata,aliases,priority]=r;
    const id=country.toLowerCase()+'-'+slug(en);
    const search=normalize([ru,en,hi,iata,aliases,C[country].ru,C[country].en,C[country].hi].join(' '));
    return {id,country,canonical:en,slug:slug(en),name:{ru,en,hi},iata:iata?iata.split(' '):[],aliases:(aliases||'').split(' ').filter(Boolean),priority:priority||999,search};
  });
  const byId=new Map(places.map(x=>[x.id,x]));
  const popular={
    from:['in-delhi','in-mumbai','in-bengaluru','ru-moscow','ru-saint-petersburg','ru-kazan'],
    to:['ru-moscow','ru-saint-petersburg','ru-kazan','ru-sochi','in-delhi','in-mumbai']
  };
  function lang(){const l=document.documentElement.lang;return l==='hi'?'hi':l==='en'?'en':'ru'}
  function countryName(code,l=lang()){return (C[code]&&C[code][l])||code}
  function display(p,l=lang()){return {name:p.name[l]||p.name.en,meta:[countryName(p.country,l),p.iata.join(', ')].filter(Boolean).join(' · ')}}
  function levenshtein(a,b){
    if(a===b)return 0;if(!a.length)return b.length;if(!b.length)return a.length;
    const v=Array.from({length:b.length+1},(_,i)=>i);
    for(let i=1;i<=a.length;i++){let prev=v[0];v[0]=i;for(let j=1;j<=b.length;j++){const old=v[j];v[j]=Math.min(v[j]+1,v[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=old}}return v[b.length]
  }
  function tokenScore(q,p){
    if(!q)return p.priority/1000;
    const fields=[p.name.ru,p.name.en,p.name.hi,p.canonical,...p.iata,...p.aliases].map(normalize).filter(Boolean);
    let best=99;
    for(const f of fields){
      if(f===q)best=Math.min(best,0);
      else if(f.startsWith(q))best=Math.min(best,.12);
      else if(f.split(' ').some(w=>w.startsWith(q)))best=Math.min(best,.22);
      else if(f.includes(q))best=Math.min(best,.36);
      else if(q.length>=3){
        const words=f.split(' ');
        for(const w of words){const d=levenshtein(q,w);if(d<=2)best=Math.min(best,.52+d*.08)}
      }
    }
    if(best===99 && p.search.includes(q))best=.42;
    return best===99?99:best+(p.priority/10000)+(p.country==='RU'||p.country==='IN'?0:.02);
  }
  function search(query,limit=6){
    const q=normalize(query);
    if(!q)return [];
    return places.map(p=>[tokenScore(q,p),p]).filter(x=>x[0]<99).sort((a,b)=>a[0]-b[0]).slice(0,limit).map(x=>x[1]);
  }
  function popularFor(kind='to'){return (popular[kind]||popular.to).map(id=>byId.get(id)).filter(Boolean)}
  window.TUTU_PLACES={places,byId,search,popularFor,display,countryName,normalize};
})();
