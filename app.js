'use strict';
document.documentElement.classList.add('js');
const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
}

const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Открыть меню');
  mobileNav.hidden = true;
  document.body.classList.remove('menu-open');
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  mobileNav.hidden = !open;
  document.body.classList.toggle('menu-open', open);
});
mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !mobileNav.hidden) {
    closeMenu();
    menuToggle.focus();
  }
});
document.addEventListener('click', e => {
  if (!mobileNav.hidden && !e.target.closest('.header')) closeMenu();
});
window.matchMedia('(min-width: 761px)').addEventListener('change', e => {
  if (e.matches) closeMenu();
});

document.querySelectorAll('.event-item').forEach(item => {
  item.addEventListener('toggle', () => {
    if (item.open) document.querySelectorAll('.event-item').forEach(other => {
      if (other !== item) other.open = false;
    });
  });
});
const form = document.querySelector('#event-form');
const vkUrl = 'https://vk.me/anna_vedu_chel';
function setFormStep(messageReady, focus = true) {
  document.querySelector('#form-details').hidden = messageReady;
  document.querySelector('#message-result').hidden = !messageReady;
  document.querySelector('#step-one').classList.toggle('current', !messageReady);
  document.querySelector('#step-two').classList.toggle('current', messageReady);
  document.querySelector(messageReady ? '#step-two' : '#step-one').setAttribute('aria-current', 'step');
  document.querySelector(messageReady ? '#step-one' : '#step-two').removeAttribute('aria-current');
  document.querySelector('#form-title').innerHTML = messageReady ? 'Осталось сказать <span class="serif">«привет».</span>' : 'Каким будет <span class="serif">ваш день?</span>';
  document.querySelector('#form-subtitle').textContent = messageReady ? 'Проверьте текст — его можно изменить прямо здесь.' : 'Выберите повод. Остальное — по желанию.';
  if (focus) {
    document.querySelector('#form-title').focus({ preventScroll: true });
    form.scrollIntoView({ behavior: motionReduced ? 'instant' : 'smooth', block: 'start' });
  }
  requestAnimationFrame(updateScroll);
}
document.querySelectorAll('[data-event]').forEach(link => {
  link.addEventListener('click', () => {
    const input = Array.from(form.elements.event).find(radio => radio.value === link.dataset.event);
    if (input) input.checked = true;
    setFormStep(false, false);
  });
});
const dateInput = document.querySelector('#date');
const today = new Date();
dateInput.min = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
document.querySelector('#edit-details').addEventListener('click', () => setFormStep(false));
form.addEventListener('submit', e => {
  e.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const date = data.get('date');
  const formattedDate = date ? new Date(date + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : 'пока выбираем';
  const lines = [
    'Анна, здравствуйте! Хочу обсудить проведение события.',
    '',
    'Формат: ' + data.get('event'),
    'Дата: ' + formattedDate,
    'Гостей: ' + (data.get('guests') || 'пока уточняем'),
  ];
  if (data.get('wishes').trim()) lines.push('Пожелания: ' + data.get('wishes').trim());
  lines.push('', 'Подскажите, пожалуйста, доступность даты и стоимость.');
  const message = lines.join('\n');
  document.querySelector('#message-preview').value = message;
  document.querySelector('#copy-status').textContent = '';
  setFormStep(true);
});
async function copyMessage() {
  const preview = document.querySelector('#message-preview');
  const status = document.querySelector('#copy-status');
  try {
    if (!navigator.clipboard) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(preview.value);
    status.textContent = 'Текст скопирован. Вставьте его в сообщение Анне во ВКонтакте.';
  } catch {
    preview.focus();
    preview.select();
    status.textContent = 'Текст выделен. Скопируйте его через меню устройства или Ctrl+C.';
  }
}
document.querySelector('#copy-message').addEventListener('click', copyMessage);
document.querySelector('#vk-send').addEventListener('click', () => {
  copyMessage();
  window.open(vkUrl, '_blank', 'noopener,noreferrer');
});
document.querySelector('#year').textContent = String(today.getFullYear());
const floatingCta = document.querySelector('.mobile-cta');
const hero = document.querySelector('.hero');
const contact = document.querySelector('#contact');
let ticking = false;
function updateScroll() {
  const show = hero.getBoundingClientRect().bottom < 0 && contact.getBoundingClientRect().top > window.innerHeight;
  floatingCta.classList.toggle('is-visible', show);
  floatingCta.hidden = !show || window.innerWidth > 760;
  floatingCta.tabIndex = show ? 0 : -1;
  document.querySelector('.hero-photo').style.transform = !motionReduced && window.innerWidth > 760 && window.scrollY < hero.offsetHeight
    ? 'translateY(' + (window.scrollY * 0.13) + 'px)'
    : '';
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) { requestAnimationFrame(updateScroll); ticking = true; }
}, { passive: true });
window.addEventListener('resize', updateScroll);
updateScroll();
