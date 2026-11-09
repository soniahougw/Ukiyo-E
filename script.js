// Interactions recreated from the Figma prototype:
//  - Toggle switch: swap between the "pop color" and "original color" pages (dissolve)
//  - Cards: click to flip between English and 日本語 (component variants)
//  - Hiroshige portrait: swap image while hovering (pop color page)

(function () {
  const DESIGN_WIDTH = 1280;
  const MAX_SCALE = 1.5;
  const root = document.documentElement;

  // ----- Scale the 1280px design to fit the window -----
  let scale = 1;
  function fit() {
    const w = document.documentElement.clientWidth;
    scale = Math.min(MAX_SCALE, w / DESIGN_WIDTH);
    root.style.setProperty('--scale', scale);
    placeToggle();
  }

  // ----- Always-available color toggle -----
  // Sits at its Figma position (y = 727 in the design) and pins to the top when scrolled past.
  const TOGGLE_DESIGN_TOP = 727;
  const PIN_TOP = 16;
  const toggle = document.getElementById('color-toggle');
  function placeToggle() {
    // keep the switch at least ~44px wide on small screens so it's easy to tap
    const s = Math.max(scale, 0.75);
    toggle.style.setProperty('--toggle-scale', s);
    const inPlace = TOGGLE_DESIGN_TOP * scale - window.scrollY;
    toggle.style.top = Math.max(PIN_TOP, inPlace) + 'px';
    toggle.classList.toggle('floating', inPlace < PIN_TOP);
  }
  window.addEventListener('resize', fit);
  window.addEventListener('scroll', placeToggle, { passive: true });

  // ----- Page switching (pop / original) -----
  const frames = [...document.querySelectorAll('.frame')];
  let current = 'pop';
  toggle.addEventListener('click', () => showFrame(current === 'pop' ? 'original' : 'pop', 300));
  function showFrame(key, dur) {
    current = key;
    toggle.classList.toggle('on', key === 'original');
    toggle.setAttribute('aria-checked', String(key === 'original'));
    frames.forEach((f) => {
      const on = f.dataset.frame === key;
      f.style.setProperty('--dur', dur + 'ms');
      f.classList.toggle('active', on);
      f.toggleAttribute('aria-hidden', !on);
      f.inert = !on;
      if (on) document.body.style.background = f.dataset.bg;
    });
  }

  // ----- Component variants -----
  function setVariant(instance, id, dur) {
    instance.style.setProperty('--dur', (dur || 0) + 'ms');
    let focusNext = false;
    for (const v of instance.children) {
      const on = v.dataset.variant === id;
      if (!on && v.contains(document.activeElement)) focusNext = true;
      v.classList.toggle('active', on);
      v.toggleAttribute('aria-hidden', !on);
      if (v.hasAttribute('tabindex')) v.tabIndex = on ? 0 : -1;
    }
    if (focusNext) {
      const next = [...instance.children].find((v) => v.dataset.variant === id);
      if (next && next.hasAttribute('tabindex')) next.focus({ preventScroll: true });
    }
  }

  function activate(el) {
    const nav = el.closest('[data-navigate]');
    if (nav) {
      const target = nav.dataset.navigate;
      showFrame(target, +nav.dataset.dur || 300);
      return true;
    }
    const v = el.closest('.variant[data-click-to]');
    if (v && v.classList.contains('active')) {
      // don't flip a card when the user is selecting text in it
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && v.contains(sel.anchorNode)) return false;
      setVariant(v.parentElement, v.dataset.clickTo, +v.dataset.dur);
      return true;
    }
    return false;
  }

  document.addEventListener('click', (e) => { activate(e.target); });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.variant[role="button"]')) {
      e.preventDefault();
      activate(e.target);
    }
  });

  // Hover swaps: show the hover variant while the pointer is over it, revert on leave
  document.querySelectorAll('.instance.has-hover').forEach((inst) => {
    const start = inst.querySelector('.variant.active');
    const hoverTo = start && start.dataset.hoverTo;
    if (!hoverTo) return;
    const dur = +start.dataset.dur;
    inst.addEventListener('mouseenter', () => setVariant(inst, hoverTo, dur));
    inst.addEventListener('mouseleave', () => setVariant(inst, start.dataset.variant, dur));
  });

  // The prototype starts on the pop color page
  fit();
  showFrame('pop', 0);
})();
