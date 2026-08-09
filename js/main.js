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
  // Content is visible by default; the hidden state only applies once JS is confirmed
  // running (so listings/text can never be stuck invisible on slow or broken mobile JS).
  document.documentElement.classList.add('js');
  const revealElements = document.querySelectorAll('.reveal');

  // Simple, universally-compatible reveal check: add .visible to anything on screen.
  // Runs on load and on every scroll/resize, so content can never stay hidden even if
  // IntersectionObserver misbehaves on some mobile browsers (tall sections, rootMargin
  // quirks, etc.).
  const revealInView = () => {
    const vh = window.innerHeight;
    revealElements.forEach(el => {
      if (el.classList.contains('visible')) return;
      const r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        el.classList.add('visible');
      }
    });
  };

  if ('IntersectionObserver' in window) {
    // Fast path for modern browsers: fire the moment any part of an element enters view.
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0 });
    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // Old browsers without IntersectionObserver: skip the animation, show everything.
    revealElements.forEach(el => el.classList.add('visible'));
  }

  window.addEventListener('scroll', revealInView, { passive: true });
  window.addEventListener('resize', revealInView);
  revealInView();

  // Periodic sweep: a guaranteed safety net so content can never stay hidden, even
  // if scroll events are missed or IntersectionObserver stalls on a device.
  // Stops itself once every reveal has fired.
  const revealSweep = setInterval(() => {
    revealInView();
    if (revealElements.length === document.querySelectorAll('.reveal.visible').length) {
      clearInterval(revealSweep);
    }
  }, 600);

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
    if (anchor.hasAttribute('data-os-login')) return; // OS link — handled by its own listener
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

  // ── Enrol Now — the website → System A pipeline (FOR-LEE 9.15) ──
  // Production: email-first capture → PayPal/Stripe checkout → server-side
  // verified webhook → System A POST /api/enroll → invoice + registration
  // emails fire automatically. Demo: same UX; the "webhook" is simulated and
  // hands the approved-payment facts to System A through its own admin page
  // (hidden iframe + postMessage), so a REAL enrollment lands in the
  // registrar's console — zero duplicated logic, same code path as the
  // webhook. Point at your running System A with:
  //   window.RFX_SYSTEM_A_URL = 'http://127.0.0.1:8124'   (or ?rfx-sa=URL)
  const SYSTEM_A_URL = (function () {
    const q = new URLSearchParams(location.search).get('rfx-sa');
    return (window.RFX_SYSTEM_A_URL || q || 'http://127.0.0.1:8124').replace(/\/+$/, '');
  })();
  const ENROLL_SECRET = 'rfx-demo-website-bridge';

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Email-first capture: the moment payment is confirmed, System A fires the
  // invoice + registration emails to this address — no human in the loop.
  function readCardPrice(el) {
    const m = (el.textContent || '').match(/[\d.,]+/);
    return m ? parseFloat(m[0].replace(/,/g, '')) : null;
  }

  function sendPaymentToSystemA(payment, cb) {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'display:none;';
    iframe.src = SYSTEM_A_URL + '/admin.html';
    document.body.appendChild(iframe);
    let replied = false;
    const onMsg = function (ev) {
      const d = ev.data || {};
      if (d.type !== 'RFX_ENROLL_OK') return;
      replied = true;
      window.removeEventListener('message', onMsg);
      cb(d);
    };
    window.addEventListener('message', onMsg);
    const tryPost = function (n) {
      if (replied) return;
      try { iframe.contentWindow.postMessage({ type: 'RFX_ENROLL', secret: ENROLL_SECRET, payment: payment }, '*'); } catch (e) {}
      if (n < 10) { setTimeout(function () { tryPost(n + 1); }, 500); }
      else if (!replied) { cb(null); }
    };
    iframe.addEventListener('load', function () { tryPost(0); });
    setTimeout(function () { tryPost(0); }, 1500);
    setTimeout(function () { if (!replied) { replied = true; cb(null); } }, 14000);
  }

  // ── Abandoned-cart recovery ──
  // The moment a student reaches the checkout step (email entered, payment
  // not yet completed), a draft is saved on this device. If they leave and
  // come back, a gold recovery bar invites them to resume with everything
  // pre-filled — no second round of typing, no lost course. Paying clears it.
  const CART_KEY = 'rfx_enroll_draft';
  const CART_WAIT_MS = 30 * 60 * 1000; // show the recovery bar only after 30 min

  function saveCartDraft(d) {
    try {
      d.savedAt = Date.now();
      localStorage.setItem(CART_KEY, JSON.stringify(d));
    } catch (e) {}
  }
  function clearCartDraft() {
    try { localStorage.removeItem(CART_KEY); } catch (e) {}
  }
  function loadCartDraft() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function cartDraftFor(card, method) {
    const h3 = card.querySelector('.program-header h3');
    const course = h3 ? h3.textContent.trim() : 'Reality Academy Program';
    const priceEl = card.querySelector('.program-price');
    const price = priceEl ? readCardPrice(priceEl) : null;
    return { course: course, price: price, method: method || 'PayPal' };
  }

  // Reopen the exact checkout a student left behind, with their details in place.
  function resumeCart(d) {
    const card = document.createElement('div');
    card.innerHTML = '<div class="program-card"><div class="program-header"><h3>' + escHtml(d.course) + '</h3></div>' +
      '<div class="program-price">' + (d.price != null ? 'R ' + d.price.toLocaleString('en-ZA') : 'R —') + '</div></div>';
    const real = card.firstElementChild;
    openEnroll(real, d.method || 'PayPal', { name: d.name || '', email: d.email || '' });
  }

  // The recovery bar — gold, quiet, dismissible; appears only when a draft is
  // old enough that the student genuinely walked away.
  function checkAbandonedCart() {
    const d = loadCartDraft();
    if (!d || !d.email) return;
    if (Date.now() - (d.savedAt || 0) < CART_WAIT_MS) return;
    const bar = document.createElement('div');
    bar.className = 'rfx-cart-bar';
    bar.innerHTML =
      '<div class="rfx-cart-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></div>' +
      '<div class="rfx-cart-txt"><b>Your enrolment is waiting — ' + escHtml(d.course) + '</b>' +
      '<span>' + escHtml(d.email) + (d.price != null ? ' · ' + 'R ' + d.price.toLocaleString('en-ZA') : '') + ' · your details are saved on this device</span></div>' +
      '<button type="button" class="btn btn-primary rfx-cart-resume">Resume enrolment</button>' +
      '<button type="button" class="rfx-cart-x" aria-label="Dismiss">✕</button>';
    document.body.appendChild(bar);
    requestAnimationFrame(function () { requestAnimationFrame(function () { bar.classList.add('show'); }); });
    bar.querySelector('.rfx-cart-resume').addEventListener('click', function () {
      bar.classList.remove('show');
      setTimeout(function () { bar.remove(); resumeCart(d); }, 350);
    });
    bar.querySelector('.rfx-cart-x').addEventListener('click', function () {
      clearCartDraft();
      bar.classList.remove('show');
      setTimeout(function () { bar.remove(); }, 350);
    });
  }

  function openEnroll(card, method, prefill) {
    prefill = prefill || {};
    const h3 = card.querySelector('.program-header h3');
    const course = h3 ? h3.textContent.trim() : 'Reality Academy Program';
    const priceEl = card.querySelector('.program-price');
    const price = priceEl ? readCardPrice(priceEl) : null;
    const priceStr = price != null ? 'R ' + price.toLocaleString('en-ZA') : 'R —';

    const overlay = document.createElement('div');
    overlay.className = 'form-overlay';
    overlay.innerHTML =
      '<div class="form-modal rfx-enroll-modal" role="dialog" aria-modal="true" aria-labelledby="rfx-enroll-title">' +
      '<button type="button" class="rfx-enroll-x" aria-label="Close">✕</button>' +
      '<div class="rfx-enroll-step rfx-enroll-step-1">' +
      '<div class="rfx-enroll-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22 6 12 13 2 6"/></svg></div>' +
      '<h3 id="rfx-enroll-title">Begin your enrolment</h3>' +
      '<div class="rfx-enroll-summary">' +
      '<div class="rfx-enroll-line"><span>' + escHtml(course) + '</span><b>' + priceStr + '</b></div>' +
      '<div class="rfx-enroll-line small"><span>Payment method</span><b>' + escHtml(method) + '</b></div>' +
      '</div>' +
      '<p class="rfx-enroll-hint">Email comes first — your Reality FX invoice and secure registration link are delivered there the moment payment is confirmed.</p>' +
      '<input class="rfx-enroll-input" id="rfx-enroll-name" placeholder="Full name" autocomplete="name" value="' + escHtml(prefill.name || '') + '">' +
      '<input class="rfx-enroll-input" id="rfx-enroll-email" type="email" placeholder="Email address" autocomplete="email" value="' + escHtml(prefill.email || '') + '">' +
      '<div class="rfx-enroll-err" id="rfx-enroll-err"></div>' +
      '<button type="button" class="btn btn-primary rfx-enroll-next" style="width:100%;">Continue to secure checkout</button>' +
      '</div>' +
      '<div class="rfx-enroll-step rfx-enroll-step-2" hidden>' +
      '<div class="rfx-enroll-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>' +
      '<h3 id="rfx-enroll-title">Secure checkout</h3>' +
      '<div class="rfx-checkout-box">' +
      '<div class="rfx-enroll-line"><span>' + escHtml(course) + '</span><b>' + priceStr + '</b></div>' +
      '<div class="rfx-enroll-line small"><span>Method</span><b>' + escHtml(method) + ' (demo)</b></div>' +
      '<div class="rfx-enroll-line small"><span>Student</span><b id="rfx-enroll-who"></b></div>' +
      '</div>' +
      '<p class="rfx-enroll-hint">Demo checkout — a stand-in for the real ' + escHtml(method) + ' flow. In production you pay ' + escHtml(method) + ' here and Reality FX verifies the payment server-side before enrolling you.</p>' +
      '<button type="button" class="btn btn-primary rfx-enroll-pay" style="width:100%;">Complete payment — ' + priceStr + ' (demo)</button>' +
      '</div>' +
      '<div class="rfx-enroll-step rfx-enroll-step-3" hidden>' +
      '<div class="modal-check">' +
      '<svg width="76" height="76" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle class="check-circle" cx="12" cy="12" r="10" pathLength="100" />' +
      '<polyline class="check-mark" points="8 12.5 11 15.5 16 9.5" pathLength="100" />' +
      '</svg></div>' +
      '<h3 id="rfx-enroll-title">Check your email</h3>' +
      '<p>Payment confirmed. Your Reality FX invoice and secure registration link are on their way to <b class="rfx-enroll-email-out"></b>.</p>' +
      '<div class="rfx-demo-inbox" id="rfx-enroll-inbox"><div class="rfx-enroll-wait">Contacting the registrar…</div></div>' +
      '<button type="button" class="modal-close rfx-enroll-done">Done</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { requestAnimationFrame(function () { overlay.classList.add('visible'); }); });

    const steps = [overlay.querySelector('.rfx-enroll-step-1'), overlay.querySelector('.rfx-enroll-step-2'), overlay.querySelector('.rfx-enroll-step-3')];
    const go = function (i) { steps.forEach(function (s, k) { s.hidden = k !== i; }); };
    const closeModal = function () {
      overlay.classList.remove('visible');
      setTimeout(function () { overlay.remove(); }, 500);
    };
    overlay.querySelector('.rfx-enroll-x').addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', function onKey(e) { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onKey); } });

    const nameEl = overlay.querySelector('#rfx-enroll-name');
    const emailEl = overlay.querySelector('#rfx-enroll-email');
    const errEl = overlay.querySelector('#rfx-enroll-err');
    overlay.querySelector('.rfx-enroll-next').addEventListener('click', function () {
      const name = nameEl.value.trim();
      const email = emailEl.value.trim();
      if (!name) { errEl.textContent = 'Please enter your full name.'; return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { errEl.textContent = 'Please enter a valid email address.'; return; }
      errEl.textContent = '';
      overlay.querySelector('#rfx-enroll-who').textContent = name + ' · ' + email;
      go(1);
      // reached the checkout step → remember it so we can recover if they leave
      saveCartDraft({ course: course, price: price, method: method, name: name, email: email });
    });

    overlay.querySelector('.rfx-enroll-pay').addEventListener('click', function () {
      const name = nameEl.value.trim();
      const email = emailEl.value.trim();
      const btn = overlay.querySelector('.rfx-enroll-pay');
      btn.disabled = true;
      btn.textContent = 'Processing payment…';
      const ref = new URLSearchParams(location.search).get('ref') || '';
      const payment = {
        customerName: name,
        email: email,
        course: course,
        price: price != null ? price : 0,
        currency: 'R',
        paymentMethod: method,
        transactionId: (method === 'Stripe' ? 'STRIPE-' : 'PP-') + Date.now() + '-' + Math.floor(Math.random() * 1e6),
        referralCode: ref
      };
      sendPaymentToSystemA(payment, function (res) {
        clearCartDraft(); // paid — nothing to recover
        overlay.querySelector('.rfx-enroll-email-out').textContent = email;
        const inbox = overlay.querySelector('#rfx-enroll-inbox');
        if (res && res.ok) {
          inbox.innerHTML =
            '<div class="rfx-mail-row">' +
            '<div class="rfx-mail-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>' +
            '<div><div class="rfx-mail-subject">Invoice ' + escHtml(res.invoice || '') + ' — payment received</div>' +
            '<div class="rfx-mail-note">Demo inbox · in production this arrives by email</div></div></div>' +
            '<div class="rfx-mail-row">' +
            '<div class="rfx-mail-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>' +
            '<div><div class="rfx-mail-subject">Complete your Reality FX registration</div>' +
            '<a class="rfx-mail-link" href="' + escHtml(res.link) + '">' + escHtml(res.link) + '</a>' +
            '<div class="rfx-mail-note">Single-use · ' + (ref ? 'referral ' + escHtml(ref) + ' attached' : 'no referral') + ' · opens the secure registration wizard</div></div></div>';
        } else {
          inbox.innerHTML =
            '<div class="rfx-mail-row">' +
            '<div class="rfx-mail-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>' +
            '<div><div class="rfx-mail-subject">Registrar not reachable</div>' +
            '<div class="rfx-mail-note">The payment is recorded on this device, but System A is not running at ' + escHtml(SYSTEM_A_URL) + '. Start it (perl system-a-fork-server.pl …) and try again — the demo needs the registrar online.</div></div></div>';
        }
        go(2);
      });
    });
    overlay.querySelector('.rfx-enroll-done').addEventListener('click', closeModal);
    setTimeout(function () { try { nameEl.focus(); } catch (e) {} }, 350);
  }

  document.querySelectorAll('.btn-enroll').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const card = btn.closest('.program-card') || btn.parentElement;
      openEnroll(card, btn.getAttribute('data-method') || 'PayPal');
    });
  });

  // ── Abandoned-cart recovery: welcome wanderers back ──
  checkAbandonedCart();

  // ── Student Login → the Academy (RFX OS) ──
  // The "Student Login" link (every page's nav + mobile menu) opens the OS.
  // Defaults to the local academy server; point it at the live academy with:
  //   window.RFX_OS_URL = 'https://academy.realityfx.co.za'  (or ?rfx-os=URL)
  const OS_URL = (function () {
    const q = new URLSearchParams(location.search).get('rfx-os');
    return (window.RFX_OS_URL || q || 'http://127.0.0.1:49270/os/index.html').replace(/\/+$/, '');
  })();
  document.querySelectorAll('[data-os-login]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      window.open(OS_URL, '_blank', 'noopener');
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
