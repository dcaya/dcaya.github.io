/* ==========================================================================
   Crumb & Croissant: interactivity
   1. Mobile hamburger menu
   2. Dark / light mode switch (remembers the visitor's choice)
   3. Highlight the nav link for the section being viewed
   4. Header shadow on scroll, and a live footer year
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------- 1. Mobile menu ---------- */
  var menuButton = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  var DESKTOP_MIN = 861; // matches the CSS breakpoint (max-width: 860px = mobile)

  function setMenu(open) {
    if (!menuButton || !nav) return;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    nav.classList.toggle('is-open', open);
  }

  if (menuButton && nav) {
    menuButton.addEventListener('click', function () {
      setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
    });

    // Choosing a link closes the menu
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });

    // Escape closes the menu and returns focus to the button
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setMenu(false);
        menuButton.focus();
      }
    });

    // Clicking outside the header closes it
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !e.target.closest('.site-header')) setMenu(false);
    });

    // Reset when the window grows to desktop width
    window.addEventListener('resize', function () {
      if (window.innerWidth >= DESKTOP_MIN) setMenu(false);
    });
  }

  /* ---------- 2. Dark / light mode ---------- */
  var themeButton = document.querySelector('.theme-toggle');
  var themeText = themeButton && themeButton.querySelector('.theme-toggle-text');
  var STORAGE_KEY = 'cc-theme';
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function readSaved() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (err) { return null; }
  }
  function save(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (err) { /* storage blocked: ignore */ }
  }

  function applyTheme(theme) {
    var dark = theme === 'dark';
    if (dark) root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');

    if (themeButton) {
      themeButton.setAttribute('aria-pressed', String(dark));
      themeButton.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      if (themeText) themeText.textContent = dark ? 'Light mode' : 'Dark mode';
    }
  }

  // Saved choice wins; otherwise follow the visitor's system setting
  var saved = readSaved();
  applyTheme(saved || (media && media.matches ? 'dark' : 'light'));

  if (themeButton) {
    themeButton.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      save(next);
    });
  }

  // If they never chose, keep following the system setting live
  if (media && media.addEventListener) {
    media.addEventListener('change', function (e) {
      if (!readSaved()) applyTheme(e.matches ? 'dark' : 'light');
    });
  }

  /* ---------- 3. Active section highlighting ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
  var sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach(function (link) {
      var active = link.getAttribute('href') === '#' + id;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, {
      // a section counts as "current" while it crosses the upper-middle of the screen
      rootMargin: '-35% 0px -55% 0px',
      threshold: 0
    });
    sections.forEach(function (section) { observer.observe(section); });
  }

  /* ---------- 4. FAQ accordion ---------- */
  var faqItems = Array.prototype.slice.call(document.querySelectorAll('.faq-item'));

  if (faqItems.length) {
    // Prepare the FAQ controls before enabling the collapsed accordion styles.
    faqItems.forEach(function (item) {
      var trigger = item.querySelector('.faq-trigger');
      var panel = item.querySelector('.faq-panel');
      if (!trigger || !panel) return;

      trigger.setAttribute('aria-expanded', 'false');
      panel.classList.remove('is-open');
      item.classList.remove('is-open');

      trigger.addEventListener('click', function () {
        var shouldOpen = trigger.getAttribute('aria-expanded') !== 'true';

        // Keep the accordion to one open answer at a time.
        faqItems.forEach(function (otherItem) {
          var otherTrigger = otherItem.querySelector('.faq-trigger');
          var otherPanel = otherItem.querySelector('.faq-panel');
          if (!otherTrigger || !otherPanel) return;

          otherTrigger.setAttribute('aria-expanded', 'false');
          otherPanel.classList.remove('is-open');
          otherItem.classList.remove('is-open');
        });

        if (shouldOpen) {
          trigger.setAttribute('aria-expanded', 'true');
          panel.classList.add('is-open');
          item.classList.add('is-open');
        }
      });
    });

    // Enable collapsed-by-default styles only after the controls are initialized.
    root.classList.add('js-accordion');
    window.requestAnimationFrame(function () {
      root.classList.add('faq-ready');
    });
  }

  /* ---------- 5. Header shadow + footer year ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
