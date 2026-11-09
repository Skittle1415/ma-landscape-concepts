/* M & A Landscape Services, Concept A. Page-local behaviour.
   The Scroll Craft engine is untouched; everything bespoke lives here and reads
   scroll position directly (same formula the engine uses for pinned acts). */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  root.classList.add('js');
  if (!reduce) root.classList.add('mow-live');

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function actTop(el) { return el.getBoundingClientRect().top + scrollY; }
  function pinnedP(el) {
    var travel = Math.max(el.offsetHeight - innerHeight, 1);
    return clamp01((scrollY - actTop(el)) / travel);
  }
  function scrollToP(el, p) {
    var travel = Math.max(el.offsetHeight - innerHeight, 1);
    window.scrollTo({ top: Math.round(actTop(el) + travel * p), behavior: 'instant' });
  }

  /* ------------------------------------------------------- hero planes -- */
  var hero = doc.querySelector('.hero');
  var planes = {};
  hero.querySelectorAll('[data-plane]').forEach(function (el) { planes[el.getAttribute('data-plane')] = el; });
  var hedgeEl = hero.querySelector('.hero__hedge');
  var ptr = { x: 0, y: 0, tx: 0, ty: 0 };

  function drawHero() {
    if (reduce) return;
    var p = pinnedP(hero);
    var vh = innerHeight / 100;
    ptr.x += (ptr.tx - ptr.x) * 0.08; ptr.y += (ptr.ty - ptr.y) * 0.08;
    var px = ptr.x, py = ptr.y;
    planes.sky.style.transform  = 'translate3d(' + (px * -3).toFixed(2) + 'px,' + (p * 3 * vh + py * -2).toFixed(2) + 'px,0) scale(' + (1.03 + p * 0.02).toFixed(4) + ')';
    planes.type.style.transform = 'translate3d(0,' + (-p * 3 * vh).toFixed(2) + 'px,0)';
    planes.mid.style.transform  = 'translate3d(' + (px * -8).toFixed(2) + 'px,' + (-p * 18 * vh + py * -5).toFixed(2) + 'px,0) scale(' + (1 + p * 0.06).toFixed(4) + ')';
    planes.haze.style.transform = 'translate3d(0,' + (-p * 7 * vh).toFixed(2) + 'px,0)';
    planes.haze.style.opacity = (0.95 - p * 0.55).toFixed(3);
    planes.near.style.transform = 'translate3d(' + (px * -16).toFixed(2) + 'px,' + (-p * 100 * vh + py * -6).toFixed(2) + 'px,0)';
    hedgeEl.style.setProperty('--dip-k', Math.max(0.001, 1 - p * 2.2).toFixed(3));
    hero.querySelector('[data-hero-stage]').setAttribute('data-sc-verify-state', p.toFixed(2));
  }
  if (finePointer && !reduce) {
    hero.addEventListener('pointermove', function (e) {
      ptr.tx = (e.clientX / innerWidth - 0.5) * 2;
      ptr.ty = (e.clientY / innerHeight - 0.5) * 2;
      kick();
    });
    hero.addEventListener('pointerleave', function () { ptr.tx = 0; ptr.ty = 0; kick(); });
  }

  /* --------------------------------------------- the mow line (peak) -- */
  var mow = doc.querySelector('.mow');
  var mowStage = mow.querySelector('[data-mow-stage]');
  var frame = mow.querySelector('[data-mow-frame]');
  var passesEl = mow.querySelector('[data-mow-passes]');
  var deck = mow.querySelector('[data-mow-deck]');
  var stateEl = mow.querySelector('[data-mow-state]');
  var goBtns = mow.querySelectorAll('[data-mow-go]');
  var N = 8, START = 0.1, END = 0.86;
  var passes = [];
  for (var i = 0; i < N; i++) {
    var d = doc.createElement('div');
    d.className = 'pass';
    d.style.left = (i * 100 / N) + '%';
    d.style.width = 'calc(' + (100 / N) + '% + 1px)';
    d.style.backgroundSize = (N * 100) + '% 100%';
    d.style.backgroundPosition = (i / (N - 1) * 100) + '% 0';
    // Finished passes keep a faint light/dark stripe, like a mowed lawn.
    d.style.setProperty('--stripe', i % 2 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)');
    d.style.clipPath = 'inset(0 0 100% 0)';
    passesEl.appendChild(d);
    passes.push(d);
  }
  var lastQ = -1;
  function drawMow(force) {
    if (reduce) return;
    var p = pinnedP(mow);
    var q = clamp01((p - START) / (END - START));
    if (!force && Math.abs(q - lastQ) < 0.0005) return;
    lastQ = q;
    var total = q * N;
    for (var k = 0; k < N; k++) {
      var s = clamp01(total - k);
      var cut = ((1 - s) * 100).toFixed(2) + '%';
      passes[k].style.clipPath = (k % 2 === 0) ? 'inset(0 0 ' + cut + ' 0)' : 'inset(' + cut + ' 0 0 0)';
    }
    var w = frame.clientWidth, h = frame.clientHeight;
    var active = Math.min(Math.floor(total), N - 1);
    var sa = clamp01(total - active);
    var y = (active % 2 === 0) ? sa * h : (1 - sa) * h;
    deck.style.width = (w / N + 2) + 'px';
    deck.style.transform = 'translate3d(' + (active * w / N - 1).toFixed(1) + 'px,' + (y - 6).toFixed(1) + 'px,0)';
    deck.style.opacity = (q > 0.002 && q < 0.998) ? '1' : '0';
    var label = q <= 0.002 ? 'Before' : q >= 0.998 ? 'After' : 'Mowing in, pass ' + (active + 1) + ' of ' + N;
    if (stateEl.textContent !== label) stateEl.textContent = label;
    goBtns[0].setAttribute('aria-pressed', q <= 0.002 ? 'true' : 'false');
    goBtns[1].setAttribute('aria-pressed', q >= 0.998 ? 'true' : 'false');
    mowStage.setAttribute('data-sc-verify-state', q.toFixed(3));
  }
  goBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      if (reduce) return;
      scrollToP(mow, b.getAttribute('data-mow-go') === 'before' ? 0.03 : 0.97);
      b.focus({ preventScroll: true });
    });
  });

  /* ------------------------------------------- services rail settle -- */
  var railAct = doc.querySelector('.rail-act');
  var rail = railAct.querySelector('[data-rail]');
  var entries = Array.prototype.slice.call(rail.querySelectorAll('.entry'));
  function drawRail() {
    if (reduce) return;
    var p = pinnedP(railAct);
    var over = rail.scrollWidth - innerWidth;
    var shift = over * 1.04 * p;
    entries.forEach(function (e) {
      // How far into the viewport this entry has travelled, 0 to 1.
      var left = e.offsetLeft - shift;
      var t = clamp01((innerWidth - left) / (innerWidth * 0.35));
      e.style.setProperty('--settle', t.toFixed(3));
    });
  }
  // Keyboard: focusing an entry's button pulls the rail so the entry is in view.
  rail.addEventListener('focusin', function (e) {
    if (reduce || !e.target.matches(':focus-visible')) return;
    var entry = e.target.closest('.entry, .rail__lead, .rail__note');
    if (!entry) return;
    var over = rail.scrollWidth - innerWidth;
    if (over <= 0) return;
    var desired = entry.offsetLeft - (innerWidth - entry.offsetWidth) / 2;
    var p = clamp01(desired / (over * 1.04));
    scrollToP(railAct, p);
  });

  /* ------------------------------------------------- frame loop -- */
  var queued = false;
  function frameLoop() {
    queued = false;
    drawHero(); drawMow(false); drawRail();
    if (Math.abs(ptr.tx - ptr.x) > 0.002 || Math.abs(ptr.ty - ptr.y) > 0.002) kick();
  }
  function kick() { if (!queued) { queued = true; requestAnimationFrame(frameLoop); } }
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', function () { lastQ = -1; kick(); });
  addEventListener('load', function () { lastQ = -1; kick(); });
  kick();

  /* ----------------------------------------- estimate selection state -- */
  var KEY = 'ma-estimate-services';
  var chosen = [];
  try { chosen = JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch (e) { chosen = []; }
  var addBtns = doc.querySelectorAll('[data-add]');
  var checks = doc.querySelectorAll('[data-ledger-checks] input[name="service"]');
  var tallies = doc.querySelectorAll('[data-tally]');
  function sync() {
    addBtns.forEach(function (b) {
      var on = chosen.indexOf(b.getAttribute('data-add')) > -1;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.querySelector('.add__label').textContent = on ? 'Added to my estimate' : 'Add to my estimate';
    });
    checks.forEach(function (c) { c.checked = chosen.indexOf(c.value) > -1; });
    tallies.forEach(function (t) {
      t.textContent = String(chosen.length);
      t.hidden = chosen.length === 0;
      t.setAttribute('aria-label', chosen.length + (chosen.length === 1 ? ' service' : ' services') + ' added');
    });
    try { sessionStorage.setItem(KEY, JSON.stringify(chosen)); } catch (e) {}
  }
  function toggle(name, on) {
    var at = chosen.indexOf(name);
    if (on === undefined) on = at === -1;
    if (on && at === -1) chosen.push(name);
    if (!on && at > -1) chosen.splice(at, 1);
    sync();
  }
  addBtns.forEach(function (b) { b.addEventListener('click', function () { toggle(b.getAttribute('data-add')); }); });
  checks.forEach(function (c) { c.addEventListener('change', function () { toggle(c.value, c.checked); }); });
  sync();

  /* ------------------------------------------- ledger: hand off to mail/sms -- */
  var form = doc.getElementById('ledger');
  var status = form.querySelector('[data-ledger-status]');
  function compose() {
    var f = form.elements;
    var services = chosen.length ? chosen.join(', ') : 'Not sure yet';
    var lines = [
      'Hi M & A, I would like a free estimate.',
      '',
      'Service: ' + services,
      'Name: ' + (f.name.value.trim() || '(not given)'),
      'Where: ' + (f.where.value.trim() || '(not given)'),
      'What the yard needs: ' + (f.notes.value.trim() || '(not given)')
    ];
    return { subject: 'Estimate request' + (chosen.length ? ': ' + services : ''), body: lines.join('\n') };
  }
  // Tests set window.__maCapture = [] to record the hand-off URL instead of leaving the page.
  function handoff(url) {
    if (Array.isArray(window.__maCapture)) { window.__maCapture.push(url); return; }
    window.location.href = url;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var m = compose();
    handoff('mailto:malandscapeservices@gmail.com?subject=' + encodeURIComponent(m.subject) + '&body=' + encodeURIComponent(m.body));
    status.textContent = 'Your email app should now be open with this entry filled in. Nothing is sent until you press send there. If nothing opened, email malandscapeservices@gmail.com or call (253) 363-2877.';
  });
  form.querySelector('[data-send="sms"]').addEventListener('click', function () {
    var m = compose();
    handoff('sms:+12533632877?&body=' + encodeURIComponent(m.body));
    status.textContent = 'Your messages app should now be open with this entry filled in. Nothing is sent until you press send there.';
  });

  /* ---------------------------------------------------- bar: index -- */
  var bar = doc.getElementById('bar');
  var menuBtn = bar.querySelector('.bar__menu');
  var indexNav = doc.getElementById('index');
  function setMenu(open) { bar.classList.toggle('bar--open', open); menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
  menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
  indexNav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && bar.classList.contains('bar--open')) { setMenu(false); menuBtn.focus(); } });

  // In-page links: smooth travel for pointer clicks, then move focus to the target.
  doc.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    var t = doc.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    var top = a.getAttribute('href') === '#top' ? 0 : actTop(t) - (parseFloat(getComputedStyle(root).scrollPaddingTop) || 0);
    window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
    t.focus({ preventScroll: true });
    history.replaceState(null, '', a.getAttribute('href'));
  });

  // Current section in the index.
  var links = Array.prototype.slice.call(indexNav.querySelectorAll('a'));
  var targets = links.map(function (a) { return doc.querySelector(a.getAttribute('href')); });
  function markCurrent() {
    var y = scrollY + innerHeight * 0.4, cur = -1;
    targets.forEach(function (t, k) { if (t && actTop(t) <= y) cur = k; });
    if (doc.getElementById('estimate') && actTop(doc.getElementById('estimate')) <= y) cur = -1;
    links.forEach(function (a, k) { if (k === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }
  addEventListener('scroll', function () { requestAnimationFrame(markCurrent); }, { passive: true });
  markCurrent();
})();
