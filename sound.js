/* ================================================================
   FORGE — UI sound module
   Subtle click sounds for buttons + a distinct one for nav links.
   Uses the Web Audio API so playback has near-zero latency and
   rapid clicks never stack or get "annoying".

   TO REPLACE THE SOUNDS: drop your own file in assets/audio/ and
   update the two paths below — any .mp3 or .wav works, no other
   code needs to change.
   ================================================================ */
(function(){
  "use strict";

  var SOUND_SOURCES = {
    click: 'assets/audio/click.wav',      // primary CTA buttons (Join Now, Book a Session, etc.)
    nav:   'assets/audio/nav-click.wav'   // nav links / mobile menu
  };

  var MIN_INTERVAL_MS = 90; // ignore retriggers faster than this, per sound — prevents rapid-click spam
  var VOLUME = 0.55;        // overall gain, kept low/subtle on top of each clip's own softness

  var AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if(!AudioContextClass){ return; } // no Web Audio support — silently do nothing, page still works fine

  var ctx = null;
  var buffers = {};
  var lastPlayed = {};
  var unlocked = false;

  function getContext(){
    if(!ctx){
      try{ ctx = new AudioContextClass(); }
      catch(e){ return null; }
    }
    return ctx;
  }

  // Fetching/decoding doesn't need a user gesture, so we preload immediately
  // on script load — by the time someone actually clicks something, the
  // buffer is already sitting in memory ready to play with no delay.
  function preload(name, url){
    var context = getContext();
    if(!context) return;
    fetch(url)
      .then(function(res){
        if(!res.ok) throw new Error('sound file missing: ' + url);
        return res.arrayBuffer();
      })
      .then(function(data){ return context.decodeAudioData(data); })
      .then(function(decoded){ buffers[name] = decoded; })
      .catch(function(){ /* file not present yet — play() just no-ops until it is */ });
  }

  Object.keys(SOUND_SOURCES).forEach(function(name){
    preload(name, SOUND_SOURCES[name]);
  });

  // iOS/Safari require resume() to happen synchronously inside a real user
  // gesture. We try on the very first pointer/key interaction anywhere on
  // the page, so the context is already running by the time a button
  // is actually clicked.
  function unlock(){
    if(unlocked) return;
    var context = getContext();
    if(context && context.state === 'suspended'){
      context.resume().catch(function(){});
    }
    unlocked = true;
    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
  }
  document.addEventListener('pointerdown', unlock, { once:true, passive:true });
  document.addEventListener('keydown', unlock, { once:true });

  function play(name){
    var context = getContext();
    var buffer = buffers[name];
    if(!context || !buffer) return;

    var now = performance.now();
    if(lastPlayed[name] && now - lastPlayed[name] < MIN_INTERVAL_MS) return; // debounce rapid clicks
    lastPlayed[name] = now;

    if(context.state === 'suspended'){ context.resume().catch(function(){}); }

    try{
      var source = context.createBufferSource();
      source.buffer = buffer;
      var gain = context.createGain();
      gain.gain.value = VOLUME;
      source.connect(gain).connect(context.destination);
      source.start(0);
    }catch(e){ /* fail silently — a missed click sound is never worth surfacing an error */ }
  }

  // Primary CTAs: every .btn (Join Now, Book a Session, View Plans, etc.)
  document.querySelectorAll('.btn').forEach(function(el){
    el.addEventListener('click', function(){ play('click'); });
  });

  // Navigation: top nav links, mobile menu links, and the menu toggle itself
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(function(el){
    el.addEventListener('click', function(){ play('nav'); });
  });
  var menuToggle = document.getElementById('menuToggle');
  if(menuToggle){
    menuToggle.addEventListener('click', function(){ play('nav'); });
  }

})();
