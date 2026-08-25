/* ================================================================
   FORGE — 3D scene module (Three.js)
   Renders a rotating cluster of metallic plates + rising ember
   particles behind the hero photo. Looks for an element carrying
   [data-scene="full"] (home hero) or [data-scene="compact"]
   (interior page headers) and boots a scene inside its canvas.

   "full"    — larger particle field, mouse parallax, and extra
               rotation driven by scroll progress through the
               container's height (used once, on the home hero).
   "compact" — lighter particle field, gentle constant rotation,
               used on every interior page header for continuity.
   ================================================================ */
(function(){
  "use strict";
  if(typeof THREE === 'undefined') return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.innerWidth < 768;

  document.querySelectorAll('[data-scene]').forEach(function(container){
    bootScene(container, container.getAttribute('data-scene') || 'compact');
  });

  function bootScene(container, mode){
    var canvas = container.querySelector('canvas');
    if(!canvas) return;

    var full = mode === 'full';
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, full ? 9 : 10.5);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha:true, antialias:true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    function sizeRenderer(){
      var w = container.clientWidth, h = container.clientHeight;
      if(w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    sizeRenderer();

    // lighting: warm red key + cool fill + ambient + close glow
    scene.add(new THREE.AmbientLight(0x3a3a3a, 0.65));
    var keyLight = new THREE.DirectionalLight(0xff4d4d, full ? 1.2 : 0.9);
    keyLight.position.set(5, 6, 5);
    scene.add(keyLight);
    var fillLight = new THREE.DirectionalLight(0x552222, 0.5);
    fillLight.position.set(-6, -3, -4);
    scene.add(fillLight);
    var pointGlow = new THREE.PointLight(0xe5171d, full ? 1.1 : 0.8, 18);
    pointGlow.position.set(0, 0, 3);
    scene.add(pointGlow);

    // plate cluster
    var plateGroup = new THREE.Group();
    var specsFull = [
      { r: 2.1, tube: 0.35, x: 1.4, y: 0.6, z: -1, rx: 0.4, ry: 0.2 },
      { r: 1.5, tube: 0.28, x: -1.6, y: -0.4, z: 0.5, rx: -0.3, ry: 0.6 },
      { r: 1.1, tube: 0.22, x: 0.4, y: -1.4, z: -0.4, rx: 0.9, ry: -0.4 },
      { r: 0.8, tube: 0.18, x: -0.6, y: 1.5, z: 0.8, rx: -0.6, ry: 0.8 }
    ];
    var specsCompact = [
      { r: 1.7, tube: 0.3, x: 1.1, y: 0.3, z: -0.8, rx: 0.4, ry: 0.2 },
      { r: 1.1, tube: 0.22, x: -1.3, y: -0.3, z: 0.4, rx: -0.3, ry: 0.6 }
    ];
    (full ? specsFull : specsCompact).forEach(function(spec){
      var geo = new THREE.TorusGeometry(spec.r, spec.tube, 20, 48);
      var mat = new THREE.MeshStandardMaterial({
        color: 0x232323, metalness: 0.88, roughness: 0.32,
        emissive: 0x3a0808, emissiveIntensity: 0.55
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(spec.x, spec.y, spec.z);
      mesh.rotation.set(spec.rx, spec.ry, 0);
      plateGroup.add(mesh);
    });
    scene.add(plateGroup);

    // ember particles
    var particleCount = full ? (isMobile ? 220 : 550) : (isMobile ? 90 : 200);
    var positions = new Float32Array(particleCount * 3);
    var speeds = new Float32Array(particleCount);
    for(var i = 0; i < particleCount; i++){
      positions[i*3]     = (Math.random() - 0.5) * 16;
      positions[i*3 + 1] = (Math.random() - 0.5) * 10;
      positions[i*3 + 2] = (Math.random() - 0.5) * 8;
      speeds[i] = 0.004 + Math.random() * 0.012;
    }
    var particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var particleMat = new THREE.PointsMaterial({
      color: 0xff6a4d, size: 0.045, transparent:true, opacity:0.85,
      blending: THREE.AdditiveBlending, depthWrite:false
    });
    var particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    var posAttr = particleGeo.getAttribute('position');

    // mouse parallax
    var mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    window.addEventListener('mousemove', function(e){
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    });

    // scroll-driven extra rotation within the container's bounds (full mode only)
    var scrollRotation = 0;
    function updateScrollRotation(){
      if(!full) return;
      var rect = container.getBoundingClientRect();
      var progress = 1 - Math.min(Math.max(rect.bottom / (rect.height + window.innerHeight), 0), 1);
      scrollRotation = progress * 1.4;
    }
    document.addEventListener('scroll', updateScrollRotation, { passive:true });
    updateScrollRotation();

    var clock = new THREE.Clock();

    function renderFrame(){
      var dt = clock.getDelta();

      targetX += (mouseX - targetX) * 0.04;
      targetY += (mouseY - targetY) * 0.04;
      camera.position.x = targetX * (full ? 1.1 : 0.5);
      camera.position.y = -targetY * (full ? 0.7 : 0.3);
      camera.lookAt(0, 0, 0);

      plateGroup.rotation.y += dt * (full ? 0.18 : 0.12);
      plateGroup.rotation.x = Math.sin(scrollRotation) * 0.15;
      plateGroup.rotation.y += scrollRotation * 0.02;

      for(var i = 0; i < particleCount; i++){
        var idx = i * 3 + 1;
        posAttr.array[idx] += speeds[i];
        if(posAttr.array[idx] > 5.5){ posAttr.array[idx] = -5.5; }
      }
      posAttr.needsUpdate = true;
      particles.rotation.y += dt * 0.02;

      renderer.render(scene, camera);
    }

    if(reduceMotion){
      renderFrame();
    } else {
      var rafId;
      var loop = function(){
        renderFrame();
        rafId = requestAnimationFrame(loop);
      };
      loop();
      document.addEventListener('visibilitychange', function(){
        if(document.hidden){ cancelAnimationFrame(rafId); }
        else{ loop(); }
      });
    }

    window.addEventListener('resize', sizeRenderer);
  }
})();
