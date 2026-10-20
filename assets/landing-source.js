/* Tutu's checkout lists foreign payment methods (Visa, Mastercard) first when
   the visitor carries the cookie landing_source=international. A page can only
   set cookies for its own domain, so this works once the landing is served
   from tutu.ru or one of its subdomains, and does nothing elsewhere (e.g. on
   brusilo.github.io). Domain .tutu.ru sends it to www, avia, hotel and bus
   checkouts; tours go to travelata.ru and do not receive it. */
(function () {
  'use strict';
  var COOKIE = 'landing_source=international';
  var MAX_AGE = 30 * 24 * 60 * 60; // 30 days
  function onTutuDomain(host) { return /(^|\.)tutu\.ru$/i.test(host || ''); }
  if (!onTutuDomain(window.location.hostname)) return;
  try {
    document.cookie = COOKIE + '; domain=.tutu.ru; path=/; max-age=' + MAX_AGE + '; secure; samesite=lax';
  } catch (_) {}
})();
