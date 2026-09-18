/* Multilingual FAQ corrections and first-visit language routing. */
(function () {
  'use strict';

  const LANGUAGE_KEY = 'india-landing-language';
  const lang = document.documentElement.lang === 'hi' ? 'hi' : document.documentElement.lang === 'en' ? 'en' : 'ru';

  function saveLanguage(value) {
    try { localStorage.setItem(LANGUAGE_KEY, value); } catch (_) {}
  }

  /* index.html is the English default. Russian and Hindi use dedicated URLs. */

  const FAQ = {
    ru: [
      {
        q: 'Какие карты принимаются для оплаты авиабилетов?',
        a: 'К оплате принимаются карты, выпущенные в России, странах СНГ, Прибалтике и большинстве стран Европы. Оплата также возможна виртуальной, предоплаченной картой VISA Virtual.'
      },
      {
        q: 'Что делать, если в имени на билете ошибка?',
        a: 'Правила зависят от вида билета и перевозчика. Если заметили ошибку, как можно раньше обратитесь в поддержку Туту. Для авиабилетов имя и фамилия должны совпадать с загранпаспортом, а возможность и стоимость исправления определяет авиакомпания.'
      },
      {
        q: 'Нужна ли регистрация при заселении в отель?',
        a: 'Если иностранный гость живёт в гостинице или отеле в России, на миграционный учёт его ставит администрация объекта размещения. При проживании в квартире или другом частном жилье это делает принимающая сторона или арендодатель. Уточните у объекта размещения необходимые документы и возможный регистрационный сбор.'
      },
      {
        q: 'Чем отличается плацкарт от купе?',
        a: 'В плацкарте обычно 54 спальных места, а блоки открыты и соединены общим проходом. В купейном вагоне обычно 32 или 36 мест, по четыре в закрывающемся купе. В купе меньше пассажиров и больше приватности, поэтому оно обычно дороже.'
      },
      {
        q: 'Как добраться из аэропорта в другой город?',
        a: 'На Туту можно искать билеты на самолёты, поезда и автобусы. Если прямого варианта нет, соберите поездку из отдельных сегментов и заложите достаточное время на пересадку.'
      },
      {
        q: 'Сколько багажа можно взять с собой?',
        a: 'Нормы зависят от перевозчика и тарифа. Для авиабилетов условия ручной клади и багажа показываются при выборе тарифа, а у автобусных перевозчиков багаж может оплачиваться отдельно. Перед покупкой проверьте условия именно вашего билета.'
      },
      {
        q: 'Можно ли вернуть или обменять билет?',
        a: 'Это зависит от вида транспорта, перевозчика и тарифа. Возвратные и невозвратные условия показываются до покупки. После покупки доступные действия можно посмотреть в заказе на сайте или в приложении Туту; для некоторых билетов обмен фактически оформляется как возврат и покупка нового билета.'
      }
    ],
    en: [
      {
        q: 'Which cards can I use to pay for flights?',
        a: 'Cards issued in Russia, CIS countries, the Baltic states and most European countries are accepted. You can also pay with a virtual prepaid VISA Virtual card.'
      },
      {
        q: 'What should I do if my name is wrong on the ticket?',
        a: 'The rules depend on the ticket type and carrier. Contact Tutu support as soon as you notice an error. For flights, the first and last name on the ticket should match the passport used for travel; whether a correction is possible and whether it costs extra depends on the airline.'
      },
      {
        q: 'Do foreign guests need registration when staying at a hotel?',
        a: 'In Russia, a hotel or other accommodation provider registers foreign guests for migration purposes. If you stay in an apartment or other private accommodation, the host or landlord is normally the receiving party. Check the required documents and any registration fee with your accommodation.'
      },
      {
        q: 'What is the difference between platzkart and a compartment?',
        a: 'A platzkart carriage normally has 54 sleeping berths in open sections connected by a common aisle. A compartment carriage usually has 32 or 36 berths, with four berths in each compartment behind a closing door. Compartments have fewer passengers and more privacy, so they are usually more expensive.'
      },
      {
        q: 'How can I continue from an airport to another city?',
        a: 'Tutu lets you search for flights, trains and buses. If there is no direct option, build the trip from separate segments and leave enough time for the connection.'
      },
      {
        q: 'How much baggage can I take?',
        a: 'Baggage limits depend on the carrier and fare. For flights, cabin-baggage and checked-baggage conditions are shown with the fare; on buses, baggage may be charged separately. Check the conditions for your specific ticket before paying.'
      },
      {
        q: 'Can I refund or exchange a ticket?',
        a: 'It depends on the transport type, carrier and fare. Refundable and non-refundable conditions are shown before purchase. After purchase, available actions are shown in your order on the Tutu website or app; for some tickets, an exchange is handled as a refund followed by a new purchase.'
      }
    ],
    hi: [
      {
        q: 'फ्लाइट टिकट के भुगतान के लिए कौन-से कार्ड स्वीकार किए जाते हैं?',
        a: 'रूस, CIS देशों, बाल्टिक देशों और यूरोप के अधिकांश देशों में जारी किए गए कार्ड स्वीकार किए जाते हैं। वर्चुअल प्रीपेड VISA Virtual कार्ड से भी भुगतान किया जा सकता है।'
      },
      {
        q: 'अगर टिकट में नाम गलत हो तो क्या करें?',
        a: 'नियम टिकट के प्रकार और परिवहन कंपनी पर निर्भर करते हैं। गलती दिखते ही Tutu सहायता से संपर्क करें। फ्लाइट टिकट में नाम और उपनाम यात्रा के लिए इस्तेमाल किए जाने वाले पासपोर्ट से मेल खाने चाहिए; सुधार संभव है या नहीं और उसका शुल्क कितना होगा, यह एयरलाइन तय करती है।'
      },
      {
        q: 'होटल में ठहरने पर विदेशी मेहमानों का पंजीकरण जरूरी है?',
        a: 'रूस में होटल या अन्य आवास विदेशी मेहमान का माइग्रेशन पंजीकरण करता है। यदि आप अपार्टमेंट या किसी निजी आवास में ठहरते हैं, तो आम तौर पर मेज़बान या मकान-मालिक यह प्रक्रिया करता है। आवश्यक दस्तावेज़ और संभावित पंजीकरण शुल्क की जानकारी अपने आवास से पहले ही ले लें।'
      },
      {
        q: 'प्लात्सकार्ट और कूपे में क्या अंतर है?',
        a: 'प्लात्सकार्ट डिब्बे में आम तौर पर 54 सोने की जगहें होती हैं और हिस्से खुले होते हैं। कूपे डिब्बे में आम तौर पर 32 या 36 जगहें होती हैं और हर बंद होने वाले कूपे में चार बर्थ होती हैं। कूपे में यात्री कम और निजता अधिक होती है, इसलिए यह आम तौर पर महंगा होता है।'
      },
      {
        q: 'एयरपोर्ट से दूसरे शहर कैसे जाएँ?',
        a: 'Tutu पर फ्लाइट, ट्रेन और बस के टिकट खोजे जा सकते हैं। यदि सीधा विकल्प न मिले, तो यात्रा को अलग-अलग हिस्सों में बनाएँ और कनेक्शन के लिए पर्याप्त समय रखें।'
      },
      {
        q: 'मैं कितना सामान ले जा सकता हूँ?',
        a: 'सामान की सीमा परिवहन कंपनी और किराये के नियमों पर निर्भर करती है। फ्लाइट के लिए हैंड बैगेज और चेक-इन बैगेज की शर्तें किराया चुनते समय दिखाई जाती हैं; बस में सामान के लिए अलग शुल्क हो सकता है। भुगतान से पहले अपने टिकट की शर्तें जरूर जाँचें।'
      },
      {
        q: 'क्या टिकट वापस या बदल सकता हूँ?',
        a: 'यह परिवहन के प्रकार, कंपनी और किराये के नियमों पर निर्भर करता है। रिफंड योग्य और नॉन-रिफंडेबल शर्तें खरीद से पहले दिखाई जाती हैं। खरीद के बाद उपलब्ध विकल्प Tutu वेबसाइट या ऐप में आपके ऑर्डर में दिखेंगे; कुछ टिकटों में बदलाव पुराने टिकट का रिफंड करके नया टिकट खरीदने के रूप में किया जाता है।'
      }
    ]
  };

  function renderFaq() {
    const list = document.getElementById('faq-list');
    if (!list) return;
    list.innerHTML = FAQ[lang].map(function (item) {
      const details = document.createElement('details');
      details.className = 'faq-item';
      const summary = document.createElement('summary');
      const plus = document.createElement('span');
      plus.className = 'faq-plus';
      plus.setAttribute('aria-hidden', 'true');
      summary.appendChild(plus);
      summary.appendChild(document.createTextNode(item.q));
      const answer = document.createElement('p');
      answer.textContent = item.a;
      details.appendChild(summary);
      details.appendChild(answer);
      return details.outerHTML;
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.lang a[hreflang]').forEach(function (link) {
      link.addEventListener('click', function () { saveLanguage(link.getAttribute('hreflang')); });
    });
    renderFaq();
  });
})();
