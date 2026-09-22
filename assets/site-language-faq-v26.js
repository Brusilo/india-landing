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
        a: 'К оплате принимаются карты, выпущенные в России, странах СНГ, Прибалтике и большинстве стран Европы. Оплата также возможна виртуальной, предоплаченной картой Visa Virtual.'
      },
      {
        q: 'Как добраться из аэропорта в другой город?',
        a: 'На Туту можно искать билеты на самолёты, поезда и автобусы. Если прямого варианта нет, соберите поездку из отдельных сегментов и заложите достаточное время на пересадку.'
      },
      {
        q: 'Что делать, если в паспорте нет фамилии или в имени на билете ошибка?',
        a: 'Впишите имя латиницей точно так, как в паспорте. Отчество иностранцам заполнять не нужно. Если в паспорте нет фамилии, напишите в поддержку до покупки. Небольшие опечатки в транслитерации обычно не мешают посадке, так как главное для проводников и контролёров – номер паспорта. При серьёзной ошибке напишите в поддержку до поездки, и мы поможем исправить данные.'
      },
      {
        q: 'Сколько багажа можно взять с собой?',
        a: 'Нормы зависят от перевозчика и тарифа. Для авиабилетов условия ручной клади и багажа показываются при выборе тарифа, а у автобусных перевозчиков багаж может оплачиваться отдельно. Перед покупкой проверьте условия именно вашего билета.'
      },
      {
        q: 'Можно ли вернуть или обменять билет?',
        a: 'Это зависит от вида транспорта, перевозчика и тарифа. Возвратные и невозвратные условия показываются до покупки. После покупки доступные действия можно посмотреть в заказе на сайте или в приложении Туту; для некоторых билетов обмен фактически оформляется как возврат и покупка нового билета.'
      },
      {
        q: 'Можно ли купить билет другу или родственнику?',
        a: 'Да. При оформлении укажите паспортные данные пассажира. В дорогу он берёт тот же паспорт, который указан в билете. После покупки поменять пассажира нельзя.'
      },
      {
        q: 'Чем отличается плацкарт от купе?',
        a: 'В плацкарте обычно 54 спальных места, а блоки открыты и соединены общим проходом. В купейном вагоне обычно 32 или 36 мест, по четыре в закрывающемся купе. В купе меньше пассажиров и больше приватности, поэтому оно обычно дороже.'
      }
    ],
    en: [
      {
        q: 'Which cards can I use to pay for flights?',
        a: 'Cards issued in Russia, CIS countries, the Baltic states and most European countries are accepted. You can also pay with a prepaid Visa Virtual card.'
      },
      {
        q: 'How do I get from the airport to another city?',
        a: 'Tutu lets you search for flights, trains and buses. If there is no direct option, build the trip from separate segments and leave enough time for the connection.'
      },
      {
        q: 'What if my passport has no surname, or my name is misspelled on the ticket?',
        a: 'Enter your name in Latin letters exactly as it appears in your passport. Foreign citizens do not need to fill in a patronymic. If your passport has no surname, contact support before booking. Minor transliteration differences usually cause no trouble at boarding, because conductors and inspectors go by your passport number. If the mistake is serious, contact support before your trip and we will help correct your details.'
      },
      {
        q: 'How much baggage can I take?',
        a: 'Baggage limits depend on the carrier and fare. For flights, cabin baggage and checked baggage allowances are shown with the fare; on buses, baggage may be charged separately. Check the conditions for your specific ticket before paying.'
      },
      {
        q: 'Can I refund or exchange a ticket?',
        a: 'It depends on the transport type, carrier and fare. Refundable and non-refundable conditions are shown before purchase. After purchase, available actions are shown in your order on the Tutu website or app; for some tickets, an exchange is handled as a refund followed by a new purchase.'
      },
      {
        q: 'Can I buy a ticket for a friend or relative?',
        a: 'Yes. Enter the passenger’s passport details when booking. They will need to show the same passport when travelling. The passenger cannot be changed after purchase.'
      },
      {
        q: 'What is the difference between platskart and kupe?',
        a: 'A platskart carriage normally has 54 sleeping berths in open sections connected by a common aisle. A kupe carriage usually has 32 or 36 berths, with four berths in each closed compartment. Kupe carriages have fewer passengers and more privacy, so they are usually more expensive.'
      }
    ],
    hi: [
      {
        q: 'फ़्लाइट टिकट के भुगतान के लिए कौन-से कार्ड स्वीकार किए जाते हैं?',
        a: 'रूस, CIS देशों, बाल्टिक देशों और यूरोप के अधिकांश देशों में जारी किए गए कार्ड स्वीकार किए जाते हैं। Visa Virtual प्रीपेड कार्ड से भी भुगतान किया जा सकता है।'
      },
      {
        q: 'एयरपोर्ट से दूसरे शहर कैसे जाएँ?',
        a: 'Tutu पर फ़्लाइट, ट्रेन और बस के टिकट खोजे जा सकते हैं। अगर सीधा विकल्प न मिले, तो यात्रा को अलग-अलग हिस्सों में बाँटकर बुक करें और कनेक्शन के लिए पर्याप्त समय रखें।'
      },
      {
        q: 'अगर पासपोर्ट में सरनेम नहीं है या टिकट पर नाम में गलती है तो क्या करें?',
        a: 'नाम लैटिन अक्षरों में ठीक वैसे ही लिखें जैसे पासपोर्ट में है। विदेशी नागरिकों को पैट्रोनिमिक (पिता का नाम) भरने की ज़रूरत नहीं है। अगर पासपोर्ट में सरनेम नहीं है, तो बुकिंग से पहले सपोर्ट से संपर्क करें। ट्रांसलिटरेशन की छोटी गलतियों से आमतौर पर बोर्डिंग में दिक्कत नहीं होती, क्योंकि कंडक्टर और इंस्पेक्टर पासपोर्ट नंबर देखते हैं। बड़ी गलती होने पर यात्रा से पहले सपोर्ट को लिखें, हम जानकारी ठीक करने में मदद करेंगे।'
      },
      {
        q: 'कितना सामान साथ ले जा सकते हैं?',
        a: 'सामान की सीमा परिवहन कंपनी और किराये के नियमों पर निर्भर करती है। फ़्लाइट के लिए हैंड बैगेज और चेक-इन बैगेज की शर्तें किराया चुनते समय दिखाई जाती हैं; बस में सामान के लिए अलग शुल्क हो सकता है। भुगतान से पहले अपने टिकट की शर्तें ज़रूर जाँचें।'
      },
      {
        q: 'क्या टिकट वापस या बदला जा सकता है?',
        a: 'यह परिवहन के प्रकार, कंपनी और किराये के नियमों पर निर्भर करता है। टिकट रिफंडेबल है या नॉन-रिफंडेबल, यह बुकिंग से पहले दिखाया जाता है। बुकिंग के बाद उपलब्ध विकल्प Tutu वेबसाइट या ऐप में आपके ऑर्डर में दिखेंगे; कुछ टिकटों में बदलाव के लिए पहले पुराना टिकट रिफंड करके नया टिकट खरीदना पड़ता है।'
      },
      {
        q: 'क्या मैं किसी दोस्त या रिश्तेदार के लिए टिकट खरीद सकता हूँ?',
        a: 'हाँ। बुकिंग के समय यात्री के पासपोर्ट की जानकारी डालें। यात्रा में उन्हें वही पासपोर्ट दिखाना होगा। खरीदने के बाद यात्री बदला नहीं जा सकता।'
      },
      {
        q: 'प्लात्सकार्ट और कूपे में क्या अंतर है?',
        a: 'प्लात्सकार्ट डिब्बे में आम तौर पर 54 बर्थ होती हैं और सोने की जगहें खुले सेक्शन में होती हैं। कूपे में आम तौर पर 32 या 36 बर्थ होती हैं, और हर बंद कूपे में चार बर्थ होती हैं। कूपे में यात्री कम होते हैं और ज़्यादा प्राइवेसी मिलती है, इसलिए यह आम तौर पर महँगा होता है।'
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

  /* Promo code copy button. */
  document.addEventListener('click', function (event) {
    const button = event.target.closest('.promo-strip__copy');
    if (!button) return;
    const code = button.getAttribute('data-promo-code');
    if (!code) return;
    const original = button.getAttribute('data-default-label') || button.textContent;
    button.setAttribute('data-default-label', original);
    const copied = button.getAttribute('data-copied-label') || 'Copied';
    const showCopied = function () {
      button.classList.add('is-copied');
      button.textContent = copied;
      window.setTimeout(function () {
        button.classList.remove('is-copied');
        button.textContent = original;
      }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(showCopied).catch(function () {});
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.lang a[hreflang]').forEach(function (link) {
      link.addEventListener('click', function () { saveLanguage(link.getAttribute('hreflang')); });
    });
    renderFaq();
  });
})();
