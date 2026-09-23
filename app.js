'use strict';
document.documentElement.classList.add('js');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let motionReduced = motionPreference.matches;
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
const messagePreview = document.querySelector('#message-preview');
const draftDecision = document.querySelector('#draft-decision');
const sendButton = document.querySelector('#vk-send');
const copyButton = document.querySelector('#copy-message');
// Drafts belong to this page only; nothing is written to browser storage.
let preparedDetails = null;
let generatedMessage = '';
let pendingMessage = null;

function setPendingMessage(pending) {
  pendingMessage = pending;
  const choosing = pending !== null;
  draftDecision.hidden = !choosing;
  messagePreview.readOnly = choosing;
  sendButton.disabled = choosing;
  copyButton.disabled = choosing;
}

function setFormStep(messageReady, focus = true) {
  if (!messageReady) setPendingMessage(null);
  document.querySelector('#form-details').hidden = messageReady;
  document.querySelector('#message-result').hidden = !messageReady;
  document.querySelector('#step-one').classList.toggle('current', !messageReady);
  document.querySelector('#step-two').classList.toggle('current', messageReady);
  document.querySelector(messageReady ? '#step-two' : '#step-one').setAttribute('aria-current', 'step');
  document.querySelector(messageReady ? '#step-one' : '#step-two').removeAttribute('aria-current');
  document.querySelector('#form-title').innerHTML = messageReady ? 'Проверьте <span class="serif">сообщение</span>' : 'Расскажите <span class="serif">о празднике</span>';
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
function buildMessage(data) {
  const date = data.get('date');
  const formattedDate = date ? new Date(date + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : 'пока выбираем';
  const lines = [
    'Анна, здравствуйте! Хочу пригласить вас ведущей.',
    '',
    'Формат: ' + data.get('event'),
    'Дата: ' + formattedDate,
    'Гостей: ' + (data.get('guests') || 'пока уточняем'),
  ];
  if (data.get('clientName').trim()) lines.push('Имя: ' + data.get('clientName').trim());
  if (data.get('clientContact').trim()) lines.push('Контакт: ' + data.get('clientContact').trim());
  if (data.get('wishes').trim()) lines.push('Пожелания: ' + data.get('wishes').trim());
  lines.push('', 'Расскажите, пожалуйста, об условиях и стоимости.');
  return lines.join('\n');
}

form.addEventListener('submit', e => {
  e.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const details = JSON.stringify(Array.from(data.entries()));
  const message = buildMessage(data);
  const manuallyEdited = preparedDetails !== null && messagePreview.value !== generatedMessage;
  if (details !== preparedDetails && manuallyEdited) {
    // Keep the previous draft intact until the visitor chooses a version.
    setPendingMessage({ details, message });
  } else {
    if (details !== preparedDetails) {
      messagePreview.value = message;
      generatedMessage = message;
      preparedDetails = details;
    }
    setPendingMessage(null);
  }
  document.querySelector('#copy-status').textContent = '';
  setFormStep(true);
  if (pendingMessage) document.querySelector('#draft-decision-title').focus({ preventScroll: true });
});

function resolveMessageUpdate(useForm) {
  if (!pendingMessage) return;
  if (useForm) messagePreview.value = pendingMessage.message;
  preparedDetails = pendingMessage.details;
  generatedMessage = pendingMessage.message;
  setPendingMessage(null);
  document.querySelector('#copy-status').textContent = useForm
    ? 'Готово, собрали сообщение с новыми деталями.'
    : 'Оставили ваш текст. Проверьте дату и контакты перед отправкой.';
  messagePreview.focus({ preventScroll: true });
}

document.querySelector('#update-message').addEventListener('click', () => resolveMessageUpdate(true));
document.querySelector('#keep-message').addEventListener('click', () => resolveMessageUpdate(false));

async function copyMessage() {
  if (pendingMessage || document.querySelector('#message-result').hidden) return;
  const preview = messagePreview;
  const status = document.querySelector('#copy-status');
  try {
    if (!navigator.clipboard) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(preview.value);
    status.textContent = 'Текст скопирован. Теперь вставьте его в переписку с Анной.';
  } catch {
    preview.focus();
    preview.select();
    status.textContent = 'Текст выделен. Скопируйте его через меню устройства или Ctrl+C.';
  }
}
copyButton.addEventListener('click', copyMessage);
sendButton.addEventListener('click', () => {
  if (pendingMessage || document.querySelector('#message-result').hidden) return;
  copyMessage();
  window.open(vkUrl, '_blank', 'noopener,noreferrer');
});
document.querySelector('#year').textContent = String(today.getFullYear());
const floatingCta = document.querySelector('.mobile-cta');
const hero = document.querySelector('.hero');
const contact = document.querySelector('#contact');
let ticking = false;
let floatingCtaVisible = false;
function updateScroll() {
  const heroBottom = hero.getBoundingClientRect().bottom;
  const contactGap = contact.getBoundingClientRect().top - window.innerHeight;
  // Separate entry and exit thresholds prevent flicker near section boundaries.
  const show = window.innerWidth <= 760 && !document.body.classList.contains('gallery-open') && (floatingCtaVisible
    ? heroBottom < 0 && contactGap > 24
    : heroBottom <= -48 && contactGap >= 96);
  if (show !== floatingCtaVisible) {
    floatingCtaVisible = show;
    if (!show && document.activeElement === floatingCta) floatingCta.blur();
    floatingCta.classList.toggle('is-visible', show);
    floatingCta.inert = !show;
    floatingCta.setAttribute('aria-hidden', String(!show));
    floatingCta.tabIndex = show ? 0 : -1;
  }
  document.querySelector('.hero-photo').style.transform = !motionReduced && window.innerWidth > 760 && window.scrollY < hero.offsetHeight
    ? 'translateY(' + (window.scrollY * 0.13) + 'px)'
    : '';
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) { requestAnimationFrame(updateScroll); ticking = true; }
}, { passive: true });
window.addEventListener('resize', updateScroll);
document.addEventListener('gallery:toggle', updateScroll);
motionPreference.addEventListener('change', event => {
  motionReduced = event.matches;
  updateScroll();
});
updateScroll();
