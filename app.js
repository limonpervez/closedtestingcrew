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
