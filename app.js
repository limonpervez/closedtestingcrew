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

// ---------- analytics (GA4) ----------
// Funnel: view_pricing → select_plan → begin_checkout → generate_lead.
// generate_lead is the key/conversion event; audiences for retargeting
// are built in GA4 from these (see CLAUDE.md → Analytics).
const PLAN_PRICES = { standard: 19.99, pro: 34.99, lifetime: 69.99 };
function track(name, params) {
  if (typeof gtag === 'function') gtag('event', name, params || {});
}

// any WhatsApp / email link click, sitewide
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a) return;
  if (a.href.includes('wa.me')) track('whatsapp_click', { link_location: a.className || 'link' });
  else if (a.href.startsWith('mailto:')) track('email_click', { link_location: a.className || 'link' });
});

// pricing section seen (fires once)
const pricingSection = document.getElementById('pricing');
if (pricingSection) {
  const pio = new IntersectionObserver(entries => {
    if (entries.some(en => en.isIntersecting)) {
      track('view_pricing');
      pio.disconnect();
    }
  }, { threshold: 0.25 });
  pio.observe(pricingSection);
}

// ---------- order form: plan preselect + WhatsApp / email compose ----------
const WA_NUMBER = '8801795135743';
const planSelect = document.getElementById('of-plan');
document.querySelectorAll('[data-plan]').forEach(a =>
  a.addEventListener('click', () => {
    planSelect.value = a.dataset.plan;
    track('select_plan', { plan: a.dataset.plan, value: PLAN_PRICES[a.dataset.plan], currency: 'USD' });
  })
);

// first touch on the order form (fires once)
let orderStarted = false;
['of-plan', 'of-name', 'of-phone', 'of-email', 'of-app'].forEach(id =>
  document.getElementById(id).addEventListener('focus', () => {
    if (orderStarted) return;
    orderStarted = true;
    track('begin_checkout', { plan: planSelect.value, value: PLAN_PRICES[planSelect.value], currency: 'USD' });
  })
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
  track('generate_lead', { method: 'whatsapp', plan: planSelect.value, value: PLAN_PRICES[planSelect.value], currency: 'USD' });
  open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(body)}`, '_blank', 'noopener');
});

// "Send by email" posts the order to our inbox directly (no mail app
// needed on the visitor's device); falls back to mailto if the network
// request fails.
const EMAIL_ENDPOINT = 'https://formsubmit.co/ajax/hello@closedtestingcrew.com';

document.getElementById('order-email').addEventListener('click', async () => {
  if (!validateOrder()) return;
  const btn = document.getElementById('order-email');
  const val = id => document.getElementById(id).value.trim();
  const { planText, body } = orderMessage();
  btn.disabled = true;
  btn.textContent = 'Sending…';
  try {
    const res = await fetch(EMAIL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        _subject: 'New testing order: ' + planText,
        package: planText,
        name: val('of-name'),
        phone: val('of-phone'),
        email: val('of-email'),
        app: val('of-app')
      })
    });
    if (!res.ok) throw new Error('send failed');
    track('generate_lead', { method: 'email', plan: planSelect.value, value: PLAN_PRICES[planSelect.value], currency: 'USD' });
    btn.textContent = 'Sent ✓ We reply within the hour';
  } catch {
    btn.disabled = false;
    btn.textContent = 'Send by email';
    location.href = 'mailto:hello@closedtestingcrew.com'
      + '?subject=' + encodeURIComponent('New testing order: ' + planText)
      + '&body=' + encodeURIComponent(body);
  }
});

// ---------- FAQ: close others when one opens ----------
const faqs = [...document.querySelectorAll('.faq')];
faqs.forEach(d =>
  d.addEventListener('toggle', () => {
    if (d.open) faqs.forEach(o => { if (o !== d) o.open = false; });
  })
);

// ---------- chat toast (WhatsApp + email contact options) ----------
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
