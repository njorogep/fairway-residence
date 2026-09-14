  const floatBook = document.getElementById('floatBook');
  const floatWhatsapp = document.getElementById('floatWhatsapp');
  const hero = document.querySelector('.hero');
  const io = new IntersectionObserver(([entry]) => {
    floatBook.classList.toggle('show', !entry.isIntersecting);
    floatWhatsapp.classList.toggle('show', !entry.isIntersecting);
  }, { threshold: 0.05 });
  io.observe(hero);

  // ---------- Mobile hamburger menu ----------
  (function(){
    const btn = document.getElementById('hamburgerBtn');
    const menu = document.getElementById('mobileNav');
    if(!btn || !menu) return;

    let scrollYAtOpen = 0;
    const SCROLL_CLOSE_THRESHOLD = 12; // px of real scroll before we treat it as "user scrolled away"

    function closeMenu(){
      btn.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');
    }
    function openMenu(){
      scrollYAtOpen = window.scrollY;
      btn.setAttribute('aria-expanded', 'true');
      menu.classList.add('open');
    }
    function isOpen(){
      return btn.getAttribute('aria-expanded') === 'true';
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      isOpen() ? closeMenu() : openMenu();
    });

    // Close when a nav link is clicked
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on outside click/tap
    document.addEventListener('click', (e) => {
      if(isOpen() && !menu.contains(e.target) && !btn.contains(e.target)){
        closeMenu();
      }
    });

    // Close on genuine user scrolling — but ignore the layout-shift "scroll"
    // that fires the instant the dropdown opens and pushes page content down.
    window.addEventListener('scroll', () => {
      if(isOpen() && Math.abs(window.scrollY - scrollYAtOpen) > SCROLL_CLOSE_THRESHOLD){
        closeMenu();
      }
    }, { passive: true });

    // Close if resized back to desktop width
    window.addEventListener('resize', () => {
      if(window.innerWidth > 1140 && isOpen()) closeMenu();
    });
  })();

  // ---------- Hero carousel ----------
  (function(){
    const slides = document.querySelectorAll('#heroSlider .hero-slide');
    const dots = document.querySelectorAll('#heroDots .hero-dot');
    const prevBtn = document.getElementById('heroPrev');
    const nextBtn = document.getElementById('heroNext');
    if(!slides.length) return;

    let current = 0;
    let timer = null;
    const INTERVAL = 6000;

    function goTo(index){
      slides[current].classList.remove('active');
      dots[current].classList.remove('active');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
    }
    function next(){ goTo(current + 1); }
    function prev(){ goTo(current - 1); }
    function start(){ timer = setInterval(next, INTERVAL); }
    function reset(){ clearInterval(timer); start(); }

    nextBtn.addEventListener('click', () => { next(); reset(); });
    prevBtn.addEventListener('click', () => { prev(); reset(); });
    dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i); reset(); }));

    hero.addEventListener('mouseenter', () => clearInterval(timer));
    hero.addEventListener('mouseleave', start);

    start();
  })();

  // ---------- Reserve / booking inquiry form ----------
  (function(){
    const form = document.getElementById('reserveForm');
    if(!form) return;

    const errorBox = document.getElementById('formError');
    const checkinInput = document.getElementById('checkin');
    const checkoutInput = document.getElementById('checkout');

    // Prevent picking dates in the past, and keep checkout after checkin
    const todayStr = new Date().toISOString().split('T')[0];
    checkinInput.min = todayStr;
    checkoutInput.min = todayStr;

    checkinInput.addEventListener('change', () => {
      if(!checkinInput.value) return;
      const nextDay = new Date(checkinInput.value + 'T00:00:00');
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];
      checkoutInput.min = nextDayStr;
      if(checkoutInput.value && checkoutInput.value <= checkinInput.value){
        checkoutInput.value = nextDayStr;
      }
    });

    function showError(message){
      errorBox.textContent = message;
      errorBox.classList.add('show');
      errorBox.scrollIntoView({ behavior:'smooth', block:'center' });
    }
    function clearError(){
      errorBox.textContent = '';
      errorBox.classList.remove('show');
    }

    const sendBtn = document.getElementById('sendInquiryBtn');

    form.addEventListener('submit', function(e){
      clearError();

      const data = new FormData(form);
      const fullName = (data.get('fullName') || '').trim();
      const email = (data.get('email') || '').trim();
      const phone = (data.get('phone') || '').trim();
      const checkin = data.get('checkin');
      const checkout = data.get('checkout');
      const roomType = data.get('roomType');

      if(!fullName || !email || !phone || !checkin || !checkout || !roomType){
        e.preventDefault();
        showError('Please fill in all required fields before sending your inquiry.');
        return;
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if(!emailPattern.test(email)){
        e.preventDefault();
        showError('Please enter a valid email address.');
        return;
      }

      const today = new Date(); today.setHours(0,0,0,0);
      const inDate = new Date(checkin + 'T00:00:00');
      const outDate = new Date(checkout + 'T00:00:00');
      if(inDate < today){
        e.preventDefault();
        showError("Check-in date can't be in the past.");
        return;
      }
      if(outDate <= inDate){
        e.preventDefault();
        showError('Check-out date must be after the check-in date.');
        return;
      }

      // All checks passed — let the form submit normally to FormSubmit.
      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending…';
    });
  })();

  // ---------- Amenities flip cards (tap-to-flip on touch devices) ----------
  (function(){
    const cards = document.querySelectorAll('.amenity');
    if(!cards.length) return;
    const supportsHover = window.matchMedia('(hover: hover)').matches;
    if(supportsHover) return; // desktop/hover devices use CSS :hover
    cards.forEach(c => {
      c.addEventListener('click', () => {
        const wasFlipped = c.classList.contains('flipped');
        cards.forEach(x => x.classList.remove('flipped'));
        if(!wasFlipped) c.classList.add('flipped');
      });
    });
  })();
