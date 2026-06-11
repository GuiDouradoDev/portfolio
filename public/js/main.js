document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-menu');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('active');
      toggle.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('active');
        toggle.classList.remove('active');
      });
    });
  }

  const successMsg = new URLSearchParams(window.location.search).get('success');
  const errorMsg = new URLSearchParams(window.location.search).get('error');

  if (successMsg && document.querySelector('.contact-form')) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.textContent = decodeURIComponent(successMsg);
    document.querySelector('.contact-form').prepend(alert);
    setTimeout(() => alert.remove(), 5000);
    window.history.replaceState({}, '', window.location.pathname);
  }

  if (errorMsg && document.querySelector('.contact-form')) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-error';
    alert.textContent = decodeURIComponent(errorMsg);
    document.querySelector('.contact-form').prepend(alert);
    window.history.replaceState({}, '', window.location.pathname);
  }

  const scrollLinks = document.querySelectorAll('a[href^="#"]');
  scrollLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.project-card, .skill-card, .section-header').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
});
