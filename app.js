// Closed Testing Crew — page interactions
document.documentElement.classList.add('js');

// ---------- sticky nav state + mobile menu ----------
const nav = document.querySelector('.nav');
const burger = document.querySelector('.nav-burger');

addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', scrollY > 8);
}, { passive: true });

burger.addEventListener('click', () => {
  const open = nav.classList.toggle('menu-open');
  burger.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.mobile-menu a').forEach(a =>
  a.addEventListener('click', () => {
    nav.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
  })
);

// ---------- reveal on scroll ----------
const io = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  }
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ---------- order form: plan preselect + WhatsApp / email compose ----------
const WA_NUMBER = '8801795135743';
const planSelect = document.getElementById('of-plan');
document.querySelectorAll('[data-plan]').forEach(a =>
  a.addEventListener('click', () => { planSelect.value = a.dataset.plan; })
);

const orderFields = ['of-name', 'of-phone', 'of-email', 'of-app'];
orderFields.forEach(id =>
  document.getElementById(id).addEventListener('input', e => {
    e.target.classList.remove('field-error');
    if (!document.querySelector('.field-error'))
      document.getElementById('order-error').hidden = true;
  })
);

function validateOrder() {
  let firstEmpty = null;
  orderFields.forEach(id => {
    const el = document.getElementById(id);
    const empty = !el.value.trim();
    el.classList.toggle('field-error', empty);
    if (empty && !firstEmpty) firstEmpty = el;
  });
  document.getElementById('order-error').hidden = !firstEmpty;
  if (firstEmpty) firstEmpty.focus();
  return !firstEmpty;
}

function orderMessage() {
  const val = id => document.getElementById(id).value.trim();
  const planText = planSelect.options[planSelect.selectedIndex].text;
  return {
    planText,
    body: [
      `New testing order: ${planText}`,
      `Name: ${val('of-name')}`,
      `Mobile / WhatsApp: ${val('of-phone')}`,
      `Email: ${val('of-email')}`,
      '',
      'App link / description:',
      val('of-app')
    ].join('\n')
  };
}

document.getElementById('order-form').addEventListener('submit', e => {
  e.preventDefault();
  if (!validateOrder()) return;
  const { body } = orderMessage();
  open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(body)}`, '_blank', 'noopener');
});

document.getElementById('order-email').addEventListener('click', () => {
  if (!validateOrder()) return;
  const { planText, body } = orderMessage();
  location.href = 'mailto:hello@closedtestingcrew.com'
    + '?subject=' + encodeURIComponent('New testing order: ' + planText)
    + '&body=' + encodeURIComponent(body);
});

// ---------- FAQ: close others when one opens ----------
const faqs = [...document.querySelectorAll('.faq')];
faqs.forEach(d =>
  d.addEventListener('toggle', () => {
    if (d.open) faqs.forEach(o => { if (o !== d) o.open = false; });
  })
);

// ---------- chat toast ----------
const toast = document.getElementById('chat-toast');
const fab = document.getElementById('chat-fab');

function toggleChat(force) {
  toast.hidden = force !== undefined ? !force : !toast.hidden;
}
fab.addEventListener('click', () => toggleChat());
document.getElementById('chat-footer')?.addEventListener('click', () => {
  toggleChat(true);
  toast.scrollIntoView({ block: 'nearest' });
});
document.getElementById('chat-cta')?.addEventListener('click', () => toggleChat(true));
document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleChat(false); });
