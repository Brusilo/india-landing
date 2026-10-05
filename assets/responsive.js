/* Progressive mobile controls. Original nodes and the desktop DOM are restored on resize. */
(function () {
  'use strict';
  const compact = window.matchMedia('(max-width: 1100px)');
  const header = document.querySelector('.top');
  const nav = header && header.querySelector('.top-nav');
  let menuButton = null;
  let navOriginalId;
  const footerState = [];
  let nextPanelId = 0;

  function closeMenu(returnFocus) {
    if (!menuButton) return;
    const wasOpen = header.classList.contains('is-menu-open');
    header.classList.remove('is-menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
    if (wasOpen && returnFocus) menuButton.focus();
  }

  function mountCompact() {
    if (header && nav && !menuButton) {
      navOriginalId = nav.getAttribute('id');
      nav.id = navOriginalId || 'mobile-site-navigation';
      menuButton = document.createElement('button');
      menuButton.type = 'button';
      menuButton.className = 'mobile-menu-toggle';
      menuButton.setAttribute('aria-label', nav.getAttribute('aria-label') || 'Menu');
      menuButton.setAttribute('aria-controls', nav.id);
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="menu-lines" d="M4 6h16M4 12h16M4 18h16"/><path class="menu-close" d="m6 6 12 12M18 6 6 18"/></svg>';
      menuButton.addEventListener('click', function () {
        const open = menuButton.getAttribute('aria-expanded') !== 'true';
        header.classList.toggle('is-menu-open', open);
        menuButton.setAttribute('aria-expanded', String(open));
      });
      header.querySelector('.top-inner').appendChild(menuButton);
      header.classList.add('mobile-navigation');
    }
    if (footerState.length) return;
    document.querySelectorAll('.footer-col').forEach(function (column) {
      const record = {column, nodes: Array.from(column.childNodes), headings: []};
      const fragment = document.createDocumentFragment();
      let group;
      let panel;
      record.nodes.forEach(function (node) {
        if (node.nodeType === 1 && node.tagName === 'H4') {
          group = document.createElement('div');
          group.className = 'mobile-footer-group';
          group.appendChild(node);
          panel = document.createElement('div');
          panel.className = 'mobile-footer-panel';
          group.appendChild(panel);
          fragment.appendChild(group);
          record.headings.push({heading: node, group, panel, original: Array.from(node.childNodes)});
        } else if (panel) panel.appendChild(node);
        else fragment.appendChild(node);
      });
      record.headings.forEach(function (item) {
        if (item.panel.querySelector('.socials')) {
          item.group.className = 'mobile-footer-social';
          return;
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'footer-toggle';
        const title = document.createElement('span');
        item.original.forEach(function (node) { title.appendChild(node); });
        button.appendChild(title);
        const chevron = document.createElement('span');
        chevron.className = 'footer-chevron';
        chevron.setAttribute('aria-hidden', 'true');
        button.appendChild(chevron);
        item.panel.id = 'mobile-footer-panel-' + (++nextPanelId);
        item.panel.hidden = true;
        button.setAttribute('aria-controls', item.panel.id);
        button.setAttribute('aria-expanded', 'false');
        button.addEventListener('click', function () {
          const open = button.getAttribute('aria-expanded') !== 'true';
          button.setAttribute('aria-expanded', String(open));
          item.panel.hidden = !open;
        });
        item.heading.appendChild(button);
      });
      column.replaceChildren(fragment);
      footerState.push(record);
    });
  }

  function unmountCompact() {
    if (menuButton) {
      closeMenu(false);
      menuButton.remove();
      menuButton = null;
      header.classList.remove('mobile-navigation');
      if (navOriginalId === null) nav.removeAttribute('id');
      else nav.id = navOriginalId;
    }
    footerState.forEach(function (record) {
      record.headings.forEach(function (item) { item.heading.replaceChildren.apply(item.heading, item.original); });
      record.column.replaceChildren.apply(record.column, record.nodes);
    });
    footerState.length = 0;
  }

  function syncLayout() { if (compact.matches) mountCompact(); else unmountCompact(); }
  if (compact.addEventListener) compact.addEventListener('change', syncLayout);
  else compact.addListener(syncLayout);
  document.addEventListener('click', function (event) {
    if (!compact.matches) return;
    if (header && (!header.contains(event.target) || event.target.closest('.top-nav a'))) closeMenu(false);
  });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeMenu(true); });

  // Native age selectors must receive their click/tap without the legacy popover preventDefault.
  document.addEventListener('click', function (event) {
    if (!compact.matches) return;
    if (event.target.closest('.search-v2 .child-age-v2 select')) {
      event.stopPropagation();
      return;
    }
    const field = event.target.closest('.search-v2 .v2-field--place');
    if (field && !event.target.closest('input,button,select,a,.search-suggest')) {
      event.stopPropagation();
      const input = field.querySelector('input');
      if (input) { input.focus(); input.click(); }
    }
  }, true);
  syncLayout();
})();

/* Carousel arrows sit on the carousel itself, centred on the cards at its
   left and right edges, rather than in the section heading. The buttons keep
   the handlers the page script bound to them; only their place changes. */
(function () {
  'use strict';
  document.querySelectorAll('.carousel-nav[data-carousel]').forEach(function (nav) {
    const row = document.getElementById(nav.dataset.carousel + '-row');
    if (!row || !row.parentElement) return;
    row.parentElement.classList.add('has-carousel-arrows');
    nav.classList.add('carousel-nav--overlay');
    row.parentElement.appendChild(nav);
  });

  /* Arrows show while at least two and a half route cards fit across the
     carousel; on narrower screens people swipe. Every carousel follows the
     route row, so all arrows appear and disappear at the same width, even
     on the reviews, whose cards are wider. */
  function fitsIn(row) {
    const card = row && row.firstElementChild;
    if (!card) return 0;
    const style = getComputedStyle(row);
    const gap = parseFloat(style.columnGap) || 0;
    const inner = row.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
    return (inner + gap) / (card.getBoundingClientRect().width + gap);
  }
  function syncArrows() {
    const reference = document.getElementById('routes-row');
    const wide = fitsIn(reference) >= 2.5;
    document.querySelectorAll('.has-carousel-arrows').forEach(function (wrap) {
      const row = wrap.querySelector('.row, [id$="-row"]');
      if (!row) return;
      wrap.classList.toggle('arrows-on', wide && row.scrollWidth > row.clientWidth + 4);
    });
  }
  window.addEventListener('resize', syncArrows);
  window.addEventListener('load', syncArrows);
  syncArrows();
})();

/* Every text plate on the tile sits the same distance below its card's top
   edge. The tilted plates' raised corners differ with their width, language
   and screen, so the plates are measured and nudged with `translate`; only
   the plates move, the copy and the cards stay as they are. */
(function () {
  'use strict';
  const cells = document.querySelectorAll('.bento .bento-cell');
  if (!cells.length) return;
  function inset() { return window.innerWidth < 600 ? 3 : 4; }
  function align() {
    const target = inset();
    cells.forEach(function (cell) {
      const plates = Array.prototype.filter.call(cell.querySelectorAll('.bento-sticker'), function (p) { return p.offsetParent; });
      if (!plates.length) return;
      plates.forEach(function (p) { p.style.removeProperty('translate'); });
      const top = Math.min.apply(null, plates.map(function (p) { return p.getBoundingClientRect().top; }));
      const dy = target - (top - cell.getBoundingClientRect().top);
      if (Math.abs(dy) < 0.5) return;
      plates.forEach(function (p) {
        const t = getComputedStyle(p).translate;
        const parts = t && t !== 'none' ? t.split(' ') : ['0px'];
        const x = parts[0], y = parseFloat(parts[1] || '0') || 0;
        p.style.translate = x + ' ' + (y + dy).toFixed(2) + 'px';
      });
    });
  }
  let frame = 0;
  function schedule() { clearTimeout(frame); frame = setTimeout(align, 30); }
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  if (window.ResizeObserver) { const ro = new ResizeObserver(schedule); cells.forEach(function (cell) { ro.observe(cell); cell.querySelectorAll('.bento-sticker, h3').forEach(function (el) { ro.observe(el); }); }); }
  document.querySelectorAll('.bento img').forEach(function (img) { img.addEventListener('load', schedule); });
  schedule();
})();
