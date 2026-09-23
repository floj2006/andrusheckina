(() => {
  const links = [...document.querySelectorAll('[data-gallery-photo]')];
  const strip = document.querySelector('#gallery-strip');
  if (strip && links.length > 1) {
    const section = strip.closest('.gallery');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let hovered = false;
    let touching = false;
    let focused = false;
    let visible = false;
    let position = 0;
    let frame = 0;
    let lastTime = 0;
    let step = 0;

    strip.classList.add('is-rotating');
    function measure() {
      const items = strip.children;
      step = items[1].getBoundingClientRect().left - items[0].getBoundingClientRect().left;
      position = strip.scrollLeft;
    }
    // Rotate the real items, keeping one copy of each photo and a seamless loop.
    function render() {
      if (!step) return;
      while (position < 0) {
        strip.prepend(strip.lastElementChild);
        position += step;
      }
      while (position >= step) {
        strip.append(strip.firstElementChild);
        position -= step;
      }
      strip.scrollLeft = position;
    }
    function canRotate() {
      return visible && !document.hidden && !reducedMotion.matches && !hovered && !touching && !focused && !document.body.classList.contains('gallery-open');
    }
    function tick(time) {
      frame = 0;
      if (canRotate()) {
        position += Math.min(time - lastTime, 50) * 0.038;
        render();
      }
      lastTime = time;
      if (canRotate()) frame = requestAnimationFrame(tick);
    }
    function sync() {
      if (!canRotate()) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else if (!frame) {
        lastTime = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }
    strip.addEventListener('scroll', () => {
      if (!frame) position = strip.scrollLeft;
    }, { passive: true });
    strip.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; sync(); } });
    strip.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') { hovered = false; sync(); } });
    strip.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse') { touching = true; sync(); } });
    const endTouch = () => { touching = false; sync(); };
    window.addEventListener('pointerup', endTouch);
    window.addEventListener('pointercancel', endTouch);
    section.addEventListener('focusin', () => { focused = true; position = strip.scrollLeft; sync(); });
    section.addEventListener('focusout', () => queueMicrotask(() => { focused = section.contains(document.activeElement); sync(); }));
    strip.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const current = links.indexOf(document.activeElement);
      if (current < 0) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1
        : (current + (event.key === 'ArrowRight' ? 1 : -1) + links.length) % links.length;
      links[next].focus({ preventScroll: true });
      links[next].scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'nearest' });
      position = strip.scrollLeft;
    });
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        sync();
      }, { threshold: 0.1 });
      observer.observe(strip);
    } else visible = true;
    document.addEventListener('visibilitychange', sync);
    document.addEventListener('gallery:toggle', sync);
    reducedMotion.addEventListener('change', sync);
    window.addEventListener('resize', () => { measure(); sync(); });
    measure();
    sync();
  }
  const viewer = document.querySelector('#gallery-viewer');
  if (!links.length || !viewer || typeof viewer.showModal !== 'function') return;

  const photo = viewer.querySelector('.gallery-full-image');
  const counter = viewer.querySelector('.gallery-counter');
  const caption = viewer.querySelector('.gallery-caption');
  let index = 0;
  let opener = null;
  let touchStart = null;

  function showPhoto(nextIndex) {
    index = (nextIndex + links.length) % links.length;
    const source = links[index].querySelector('img');
    photo.src = links[index].href;
    photo.alt = source.alt;
    counter.textContent = `${index + 1} / ${links.length}`;
    caption.textContent = source.alt;
  }

  function notify(open) {
    document.body.classList.toggle('gallery-open', open);
    document.dispatchEvent(new CustomEvent('gallery:toggle', { detail: { open } }));
  }

  links.forEach((link, position) => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      opener = link;
      showPhoto(position);
      viewer.showModal();
      notify(true);
      viewer.querySelector('.gallery-close').focus({ preventScroll: true });
    });
  });

  viewer.querySelector('.gallery-close').addEventListener('click', () => viewer.close());
  viewer.querySelector('.gallery-prev').addEventListener('click', () => showPhoto(index - 1));
  viewer.querySelector('.gallery-next').addEventListener('click', () => showPhoto(index + 1));
  viewer.addEventListener('close', () => {
    touchStart = null;
    notify(false);
    opener?.focus({ preventScroll: true });
  });
  viewer.addEventListener('click', event => {
    if (event.target === viewer) viewer.close();
  });
  viewer.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Tab') {
      const buttons = [...viewer.querySelectorAll('button')];
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(index + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  photo.addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
      : null;
  }, { passive: true });
  photo.addEventListener('touchend', event => {
    if (!touchStart || event.touches.length || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) showPhoto(index + (dx < 0 ? 1 : -1));
  }, { passive: true });
  photo.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
})();
