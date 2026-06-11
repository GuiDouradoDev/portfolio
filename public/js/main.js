document.addEventListener('DOMContentLoaded', function() {
  // Theme toggle
  var themeToggle = document.getElementById('theme-toggle');
  var html = document.documentElement;
  var storedTheme = localStorage.getItem('theme') || 'dark';
  html.setAttribute('data-theme', storedTheme);
  updateThemeIcon(storedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      var current = html.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      updateThemeIcon(next);
    });
  }

  function updateThemeIcon(theme) {
    if (!themeToggle) return;
    var icon = themeToggle.querySelector('i');
    if (icon) {
      icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
  }

  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.querySelector('.nav-menu');

  if (toggle && menu) {
    toggle.addEventListener('click', function() {
      menu.classList.toggle('active');
      toggle.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(function(link) {
      link.addEventListener('click', function() {
        menu.classList.remove('active');
        toggle.classList.remove('active');
      });
    });
  }

  // Contact form alerts
  var params = new URLSearchParams(window.location.search);
  var successMsg = params.get('success');
  var errorMsg = params.get('error');

  if (successMsg && document.querySelector('.contact-form')) {
    var alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.textContent = decodeURIComponent(successMsg);
    document.querySelector('.contact-form').prepend(alert);
    setTimeout(function() { alert.remove(); }, 5000);
    window.history.replaceState({}, '', window.location.pathname);
  }

  if (errorMsg && document.querySelector('.contact-form')) {
    var alert = document.createElement('div');
    alert.className = 'alert alert-error';
    alert.textContent = decodeURIComponent(errorMsg);
    document.querySelector('.contact-form').prepend(alert);
    window.history.replaceState({}, '', window.location.pathname);
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      var targetId = link.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Scroll reveal animations
  var revealObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(function(el) {
    revealObserver.observe(el);
  });

  // Also observe project cards and skill cards
  document.querySelectorAll('.project-card, .skill-card').forEach(function(el) {
    if (!el.classList.contains('reveal') && !el.classList.contains('reveal-scale')) {
      el.classList.add('reveal');
      revealObserver.observe(el);
    }
  });

  // Section headers
  document.querySelectorAll('.section-header').forEach(function(el) {
    el.classList.add('reveal');
    revealObserver.observe(el);
  });

  // Hero content
  document.querySelectorAll('.hero-content > *').forEach(function(el, i) {
    el.classList.add('reveal');
    el.style.transitionDelay = (i * 0.2) + 's';
    revealObserver.observe(el);
    el.classList.add('revealed');
  });
});
