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
