/* ================================================================
   FORGE — shared behavior (every page loads this)
   Sections: Nav, Mobile menu, Custom cursor, Reveal-on-scroll,
   Stat counters, Tilt cards, Gallery 3D parallax, Marquee dupe,
   FAQ (native, no JS), Forms, Smooth anchor scroll.
   ================================================================ */
(function(){
  "use strict";
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer:fine)').matches;

  /* ---------------------------------------------------------
     NAV: scroll state + mobile menu
  --------------------------------------------------------- */
  var nav = document.getElementById('siteNav');
  if(nav){
    var onScroll = function(){
      if(window.scrollY > 40){ nav.classList.add('scrolled'); }
      else{ nav.classList.remove('scrolled'); }
    };
    document.addEventListener('scroll', onScroll, { passive:true });
    onScroll();
  }

  var menuToggle = document.getElementById('menuToggle');
  var mobileMenu = document.getElementById('mobileMenu');
  if(menuToggle && mobileMenu){
    menuToggle.addEventListener('click', function(){
      var open = mobileMenu.classList.toggle('open');
      menuToggle.classList.toggle('open', open);
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        mobileMenu.classList.remove('open');
        menuToggle.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------------------------------------------------------
     CUSTOM CURSOR
  --------------------------------------------------------- */
  var cursorDot = document.getElementById('cursorDot');
  if(cursorDot && finePointer){
    window.addEventListener('mousemove', function(e){
      cursorDot.style.transform = 'translate('+e.clientX+'px,'+e.clientY+'px) translate(-50%,-50%)';
    });
    document.querySelectorAll('a, button, .tilt-card').forEach(function(el){
      el.addEventListener('mouseenter', function(){ cursorDot.classList.add('is-active'); });
      el.addEventListener('mouseleave', function(){ cursorDot.classList.remove('is-active'); });
    });
  }

  /* ---------------------------------------------------------
     REVEAL ON SCROLL (.reveal and .reveal-3d)
  --------------------------------------------------------- */
  var revealEls = document.querySelectorAll('.reveal, .reveal-3d');
  var revealObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold:0.15, rootMargin:'0px 0px -60px 0px' });
  revealEls.forEach(function(el){ revealObserver.observe(el); });

  var processLine = document.getElementById('processLine');
  if(processLine){
    var lineObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          processLine.classList.add('in-view');
          lineObserver.unobserve(processLine);
        }
      });
    }, { threshold:0.4 });
    lineObserver.observe(processLine);
  }

  /* ---------------------------------------------------------
     STAT COUNTERS
  --------------------------------------------------------- */
  function easeOutExpo(t){ return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
  function animateCount(el){
    var target = parseInt(el.getAttribute('data-target'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1600;
    var start = null;
    function step(ts){
      if(!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var value = Math.round(easeOutExpo(progress) * target);
      el.textContent = value.toLocaleString('en-US') + suffix;
      if(progress < 1){ requestAnimationFrame(step); }
    }
    if(reduceMotion){ el.textContent = target.toLocaleString('en-US') + suffix; }
    else{ requestAnimationFrame(step); }
  }
  var statEls = document.querySelectorAll('.stat-num');
  var statObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        animateCount(entry.target);
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold:0.5 });
  statEls.forEach(function(el){ statObserver.observe(el); });

  /* ---------------------------------------------------------
     TILT CARDS (mouse-driven 3D)
  --------------------------------------------------------- */
  if(finePointer && !reduceMotion){
    document.querySelectorAll('.tilt-card').forEach(function(card){
      card.addEventListener('mousemove', function(e){
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(700px) rotateX('+(-py*8)+'deg) rotateY('+(px*8)+'deg) translateY(-4px)';
      });
      card.addEventListener('mouseleave', function(){
        card.style.transform = 'perspective(700px) rotateX(0) rotateY(0) translateY(0)';
      });
    });
  }

  /* ---------------------------------------------------------
     GALLERY 3D SCROLL PARALLAX ("The Grind" tiles)
     Each tile drifts + tilts in Z-space based on how far it is
     from the vertical center of the viewport as you scroll.
  --------------------------------------------------------- */
  var galleryTiles = document.querySelectorAll('.gallery-tile');
  if(galleryTiles.length && !reduceMotion){
    var ticking = false;
    function updateGalleryParallax(){
      var vh = window.innerHeight;
      galleryTiles.forEach(function(tile){
        var r = tile.getBoundingClientRect();
        var center = r.top + r.height / 2;
        var offset = (center - vh / 2) / vh; // -0.5 .. 0.5 roughly
        var img = tile.querySelector('img');
        var translateY = offset * 26;
        var rotateX = offset * -6;
        if(img){ img.style.transform = 'scale(1.14) translateY('+translateY+'px)'; }
        tile.style.transform = 'perspective(1400px) rotateX('+rotateX+'deg)';
      });
      ticking = false;
    }
    document.addEventListener('scroll', function(){
      if(!ticking){ requestAnimationFrame(updateGalleryParallax); ticking = true; }
    }, { passive:true });
    window.addEventListener('resize', updateGalleryParallax);
    updateGalleryParallax();
  }

  /* ---------------------------------------------------------
     MARQUEE: duplicate track content for seamless loop
  --------------------------------------------------------- */
  var track = document.getElementById('marqueeTrack');
  if(track){ track.innerHTML += track.innerHTML; }

  /* ---------------------------------------------------------
     FAKE-SUBMIT FORMS (newsletter + contact — no backend)
  --------------------------------------------------------- */
  document.querySelectorAll('[data-fake-submit]').forEach(function(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      if(!btn) return;
      var original = btn.textContent;
      var successText = btn.getAttribute('data-success') || 'Sent ✓';
      btn.textContent = successText;
      btn.disabled = true;
      setTimeout(function(){
        btn.textContent = original;
        btn.disabled = false;
        form.reset();
      }, 2200);
    });
  });

  /* ---------------------------------------------------------
     SMOOTH ANCHOR SCROLL (same-page anchors only, offset for nav)
  --------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href');
      if(id.length < 2) return;
      var target = document.querySelector(id);
      if(!target) return;
      e.preventDefault();
      var y = target.getBoundingClientRect().top + window.pageYOffset - 76;
      window.scrollTo({ top:y, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

})();
