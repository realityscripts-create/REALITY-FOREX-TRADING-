/* ============================================
   REALITY FX — Global JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {

  // ── Navigation Scroll Effect ──
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // ── Mobile Menu Toggle ──
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ── Scroll Reveal ──
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  revealElements.forEach(el => revealObserver.observe(el));

  // ── Testimonial Slider ──
  const slides = document.querySelectorAll('.testimonial-slide');
  const dots = document.querySelectorAll('.dot');
  const prevBtn = document.querySelector('.testimonial-prev');
  const nextBtn = document.querySelector('.testimonial-next');
  let currentSlide = 0;
  let slideInterval;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    currentSlide = index;
  }

  function nextSlide() {
    showSlide((currentSlide + 1) % slides.length);
  }

  function prevSlide() {
    showSlide((currentSlide - 1 + slides.length) % slides.length);
  }

  if (slides.length > 0) {
    showSlide(0);
    slideInterval = setInterval(nextSlide, 6000);

    if (prevBtn) prevBtn.addEventListener('click', () => { clearInterval(slideInterval); prevSlide(); slideInterval = setInterval(nextSlide, 6000); });
    if (nextBtn) nextBtn.addEventListener('click', () => { clearInterval(slideInterval); nextSlide(); slideInterval = setInterval(nextSlide, 6000); });
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => { clearInterval(slideInterval); showSlide(i); slideInterval = setInterval(nextSlide, 6000); });
    });
  }

  // ── Operation Meter ──
  const meterBoxes = document.querySelectorAll('.meter-box');
  if (meterBoxes.length > 0) {
    const startDate = new Date('2020-01-01T00:00:00');

    function updateMeter() {
      const now = new Date();
      const diff = now - startDate;
      const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
      const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
      const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');

      const values = [years, months, days, hours, minutes, seconds];
      const labels = ['Years', 'Months', 'Days', 'Hours', 'Minutes', 'Seconds'];

      meterBoxes.forEach((box, i) => {
        const valEl = box.querySelector('.meter-value');
        const labelEl = box.querySelector('.meter-label');
        if (valEl) valEl.textContent = values[i];
        if (labelEl) labelEl.textContent = labels[i];

        // Smooth tick on the seconds counter
        if (i === 5 && valEl) {
          valEl.classList.remove('tick');
          void valEl.offsetWidth;
          valEl.classList.add('tick');
        }
      });
    }

    updateMeter();
    setInterval(updateMeter, 1000);
  }

  // ── FAQ Accordion ──
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  // ── Multi-step Form ──
  const formSteps = document.querySelectorAll('.form-step');
  const progressSteps = document.querySelectorAll('.progress-step');
  let currentStep = 0;

  function showFormStep(index) {
    formSteps.forEach((step, i) => step.classList.toggle('active', i === index));
    progressSteps.forEach((step, i) => step.classList.toggle('active', i <= index));
    currentStep = index;
  }

  document.querySelectorAll('.next-step').forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentStep < formSteps.length - 1) showFormStep(currentStep + 1);
    });
  });

  document.querySelectorAll('.prev-step').forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentStep > 0) showFormStep(currentStep - 1);
    });
  });

  if (formSteps.length > 0) showFormStep(0);

  // ── Smooth Scroll for Anchor Links ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── Scroll Indicator — click to push the page down ──
  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (scrollIndicator) {
    const scrollDown = () => {
      const hero = document.querySelector('.hero');
      const next = hero ? hero.nextElementSibling : null;
      if (next) {
        // Offset by the fixed nav height so the section top isn't hidden underneath it
        const targetY = next.getBoundingClientRect().top + window.scrollY - 64;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      } else {
        window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
      }
    };
    scrollIndicator.addEventListener('click', scrollDown);
    scrollIndicator.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        scrollDown();
      }
    });
  }

  // ── Formspree Forms — submit in the background, users stay on the site ──
  const formSuccessMessages = {
    'job-application': {
      title: 'Application Received',
      message: 'Thank you for applying to Reality FX. Our recruitment team has received your application and will review it shortly — keep an eye on your inbox for next steps.'
    },
    'general-application': {
      title: 'Welcome to the Talent Pool',
      message: 'Thank you for your interest in Reality FX. Your details have been saved, and we will reach out as soon as a role that suits you opens up.'
    },
    'contact': {
      title: 'Message Sent',
      message: 'Thank you for reaching out to Reality FX. A member of our team will get back to you within 24 hours.'
    },
    'evaluation': {
      title: 'Assessment Received',
      message: 'Thank you for sharing your trading profile. Our team will review it and contact you within 24 hours with a personalised program recommendation.'
    }
  };

  function showSuccessModal(msg, onClose) {
    const overlay = document.createElement('div');
    overlay.className = 'form-overlay';
    overlay.innerHTML =
      '<div class="form-modal" role="dialog" aria-modal="true" aria-labelledby="form-modal-title">' +
      '<span class="modal-spark" style="left:16%;top:26%;animation-delay:0s;"></span>' +
      '<span class="modal-spark" style="left:80%;top:20%;animation-delay:0.7s;"></span>' +
      '<span class="modal-spark" style="left:24%;top:74%;animation-delay:1.4s;"></span>' +
      '<span class="modal-spark" style="left:74%;top:68%;animation-delay:2.1s;"></span>' +
      '<span class="modal-spark" style="left:50%;top:14%;animation-delay:2.8s;"></span>' +
      '<div class="modal-check">' +
      '<svg width="76" height="76" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle class="check-circle" cx="12" cy="12" r="10" pathLength="100" />' +
      '<polyline class="check-mark" points="8 12.5 11 15.5 16 9.5" pathLength="100" />' +
      '</svg></div>' +
      '<h3 id="form-modal-title">' + msg.title + '</h3>' +
      '<p>' + msg.message + '</p>' +
      '<button type="button" class="modal-close">Continue</button>' +
      '</div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('visible')));

    const closeBtn = overlay.querySelector('.modal-close');
    requestAnimationFrame(() => closeBtn.focus());

    let closed = false;
    function onKey(e) { if (e.key === 'Escape') close(); }
    function close() {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKey);
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 500);
      if (onClose) onClose();
    }
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
  }

  document.querySelectorAll('form[action*="formspree.io"]').forEach(form => {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          form.style.display = 'none';
          const msg = formSuccessMessages[form.name] || {
            title: 'Thank You',
            message: 'Your submission has been received. We will be in touch soon.'
          };
          showSuccessModal(msg, () => {
            form.style.display = '';
            form.reset();
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = originalText;
            }
            if (typeof showFormStep === 'function') showFormStep(0);
          });
        } else {
          throw new Error('Formspree rejected the submission');
        }
      } catch (err) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
        let errorBox = form.querySelector('.form-error');
        if (!errorBox) {
          errorBox = document.createElement('div');
          errorBox.className = 'form-error';
          form.prepend(errorBox);
        }
        errorBox.textContent = 'Something went wrong. Please try again, or message us directly on WhatsApp.';
      }
    });
  });

  // ── Active Nav Link ──
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

});
