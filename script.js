/* ==========================================================================
   Crumb & Croissant: interactivity
   1. Mobile hamburger menu
   2. Dark / light mode switch (remembers the visitor's choice)
   3. Highlight the nav link for the section being viewed
   4. Header shadow on scroll, and a live footer year
   5. FAQ accordion (one answer open at a time, keyboard friendly)
   6. Grand opening popup, shown once per visit a few seconds after arrival
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

  /* ---------- 4. Header shadow + footer year ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 5. FAQ accordion ---------- */
  var triggers = Array.prototype.slice.call(document.querySelectorAll('.faq-trigger'));

  function setFaq(trigger, open) {
    var panel = document.getElementById(trigger.getAttribute('aria-controls'));
    if (!panel) return;
    trigger.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('is-open', open);
    trigger.closest('.faq-item').classList.toggle('is-open', open);
  }

  if (triggers.length) {
    // Collapse answers only now, so the page stays readable if JavaScript fails
    root.classList.add('js-accordion');
    // Turn animations on only after the collapsed state has painted
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { root.classList.add('faq-ready'); });
    });

    triggers.forEach(function (trigger, index) {
      trigger.addEventListener('click', function () {
        var willOpen = trigger.getAttribute('aria-expanded') !== 'true';
        triggers.forEach(function (other) { setFaq(other, false); }); // one open at a time
        setFaq(trigger, willOpen);
      });

      // Arrow keys, Home and End move between questions
      trigger.addEventListener('keydown', function (e) {
        var target = null;
        if (e.key === 'ArrowDown') target = triggers[(index + 1) % triggers.length];
        else if (e.key === 'ArrowUp') target = triggers[(index - 1 + triggers.length) % triggers.length];
        else if (e.key === 'Home') target = triggers[0];
        else if (e.key === 'End') target = triggers[triggers.length - 1];
        if (target) { e.preventDefault(); target.focus(); }
      });
    });
  }

  /* ---------- 6. Grand opening popup ---------- */
  var modal = document.getElementById('opening-modal');
  var MODAL_DELAY = 5000;           // milliseconds after the page loads
  var MODAL_KEY = 'cc-opening-seen';

  function modalSeen() {
    try { return sessionStorage.getItem(MODAL_KEY) === '1'; } catch (err) { return false; }
  }
  function markModalSeen() {
    try { sessionStorage.setItem(MODAL_KEY, '1'); } catch (err) { /* storage blocked: ignore */ }
  }

  if (modal && typeof modal.showModal === 'function') {
    // Any close (X button, "Maybe later", link, Escape key) ends up here
    modal.addEventListener('close', function () {
      document.body.classList.remove('modal-open');
      markModalSeen();
    });

    // Buttons and links marked data-modal-close dismiss the popup
    modal.addEventListener('click', function (e) {
      if (e.target.closest('[data-modal-close]')) modal.close();
      // A click on the dimmed backdrop (the dialog element itself) also dismisses it
      else if (e.target === modal) modal.close();
    });

    if (!modalSeen()) {
      window.setTimeout(function () {
        if (modal.open) return;
        setMenu(false);                        // don't stack it on top of the mobile menu
        modal.showModal();
        document.body.classList.add('modal-open');
      }, MODAL_DELAY);
    }
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
