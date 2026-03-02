/* Random Website Wheel — simplified, wheel-only UI
   - Full-viewport single wheel, like wheelofnames style (multi-colored slices)
   - In-wheel overlay shows the selected result with a single Go button
*/
(function(){
  const canvas = document.getElementById('wheel');
  const ctx = canvas.getContext('2d');
  const spinBtn = document.getElementById('spin');
  const overlay = document.getElementById('resultOverlay');
  const goBtn = document.getElementById('go');
  const closeBtn = document.getElementById('closeOverlay');
  const chosenNameEl = document.getElementById('chosenName');
  const announceEl = document.getElementById('announcement');
  const overlayTitle = document.getElementById('resultTitle');
  const overlayActions = overlay.querySelector('.overlay-actions');

  const { AppState, AppConfig, Timer } = window;
  const S = AppState?.States || {};

  // Define destinations (label and relative path)
  const DESTS = [
    { label: 'AI tool website', path: 'AI tool website/index.html' },
    { label: 'Arcade games', path: 'Arcade games/index.html' },
    { label: 'Charitative Orhanization', path: 'Charitative Orhanization/index.html' },
    { label: 'Event Landing page', path: 'Event Landing page/index.html' },
    { label: 'Gaming studio page', path: 'Gaming studio page/index.html' },
    { label: 'Gym Page', path: 'Gym Page/index.html' },
    { label: 'Personal portfolio of a senior developer', path: 'Personal portfolio of a senior developer/index.html' },
    { label: 'University webpage', path: 'University webpage/index.html' },
    { label: 'Website for creation of DND character', path: 'Website for creation of DND character/index.html' },
    { label: 'Website for practicing Programming', path: 'Website for practicing Programming/index.html' }
  ];

  // Dynamic canvas sizing (crisp on HiDPI)
  let W = 0, H = 0, cx = 0, cy = 0, r = 0;
  let n = DESTS.length;
  let slice = (Math.PI * 2) / n;
  let rotation = -Math.PI/2; // 12 o'clock pointer
  let spinning = false;
  let selectedIndex = -1;

  function sizeCanvas(){
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(200, Math.floor(rect.width));
    const h = Math.max(200, Math.floor(rect.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    W = w; H = h; cx = W/2; cy = H/2; r = Math.min(W, H)/2 - 8;
  }

  // Multi-color palette per slice (HSL around the wheel)
  function colorFor(i){
    const hue = (i * 360 / n + 10) % 360; // evenly spaced hues
    const sat = 75; // vibrant but readable
    const light = 50; // mid lightness like wheelofnames
    return `hsl(${hue} ${sat}% ${light}%)`;
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    for(let i=0;i<n;i++){
      const a0 = i*slice;
      const a1 = a0 + slice;
      // sector fill
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.arc(0,0,r,a0,a1,false);
      ctx.closePath();
      ctx.fillStyle = colorFor(i);
      ctx.fill();
      // thin border for separation
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0,0,0,.35)';
      ctx.stroke();

      // label (rotated along the radius)
      ctx.save();
      const mid = a0 + slice/2;
      ctx.rotate(mid);
      ctx.textAlign = 'right';
      // Dynamically size font so the full label fits without ellipsis
      const maxFont = 22;
      const minFont = 10;
      const label = DESTS[i].label;
      // Available radial width from inner hub to near rim
      const innerRadius = 62 + 16; // hub (62) + padding
      const available = (r - 18) - innerRadius;
      let fontSize = maxFont;
      ctx.font = `700 ${fontSize}px "Oswald", system-ui, sans-serif`;
      let w = ctx.measureText(label).width;
      while (w > available && fontSize > minFont) {
        fontSize -= 1;
        ctx.font = `700 ${fontSize}px "Oswald", system-ui, sans-serif`;
        w = ctx.measureText(label).width;
      }
      ctx.translate(r - 18, 0);
      // stroke for contrast, then fill in white
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,0,0,.5)';
      ctx.strokeText(label, 0, 5);
      ctx.fillStyle = '#fff';
      ctx.fillText(label, 0, 5);
      ctx.restore();
    }

    // inner hub for visual balance
    ctx.beginPath();
    ctx.arc(0,0,62,0,Math.PI*2);
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fill();

    ctx.restore();
  }

  function fitLabel(text, maxChars){
    if(text.length <= maxChars) return text;
    return text.slice(0, Math.max(1, maxChars-1)) + '…';
  }

  // Spin logic (FSM + YAML-configurable duration)
  async function spin(){
    if(AppState.get() !== S.READY) return; // allowed only in READY
    AppState.set(S.SPINNING);
    spinning = true;
    goBtn.disabled = true;
    chosenNameEl.textContent = '—';
    hideOverlay();
    announce('Spinning…');

    // Choose a random index uniformly
    const idx = Math.floor(Math.random()*n);
    selectedIndex = idx;

    // Compute the target angle so that the center of chosen slice aligns to pointer at 12 o'clock
    const targetSliceCenter = idx*slice + slice/2; // in wheel space
    const turns = 5 + Math.floor(Math.random()*4); // 5..8 full rotations
    const targetRotation = -targetSliceCenter + turns*(Math.PI*2);

    const startRot = rotation;
    const delta = normalizeAngle(targetRotation - startRot);

    // Baseline (current implementation) duration range: 3.8s .. 5s
    const baseline = 3800 + Math.random()*1200;
    const duration = await AppConfig.getSpinMs(()=>baseline);
    const start = performance.now();

    function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

    function frame(now){
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOutCubic(t);
      rotation = startRot + delta * eased;
      draw();
      if(t < 1){
        requestAnimationFrame(frame);
      }else{
        spinning = false;
        const dest = DESTS[selectedIndex];
        chosenNameEl.textContent = dest.label;
        announce(`${dest.label} selected. Use Go to Website to open it.`);
        goBtn.disabled = false;
        AppState.set(S.RESULT_SHOWN);
        showOverlay();
        goBtn.focus();
      }
    }
    requestAnimationFrame(frame);
  }

  function normalizeAngle(a){
    const tau = Math.PI*2;
    a = a % tau;
    if(a < 0) a += tau;
    if(a < tau*3) a += tau*3; // ensure enough spins
    return a;
  }

  function announce(msg){ if(announceEl) announceEl.textContent = msg; }

  function showOverlay(){ overlay.hidden = false; }
  function hideOverlay(){ overlay.hidden = true; }

  function setActionsVisible(v){ overlayActions.style.display = v ? '' : 'none'; }

  function formatSeconds(s){
    const m = Math.floor(s/60);
    const sec = Math.floor(s%60);
    const mm = String(m).padStart(2,'0');
    const ss = String(sec).padStart(2,'0');
    return `${mm}:${ss}`;
  }

  function updateUIByState(state){
    // Spin button enabled only in READY
    spinBtn.disabled = state !== S.READY;
    switch(state){
      case S.SPINNING:
        // ensure overlay hidden while spinning
        hideOverlay();
        break;
      case S.RESULT_SHOWN:
        overlayTitle.textContent = 'Selected';
        setActionsVisible(true);
        showOverlay();
        break;
      case S.SHOWCASE:
        overlayTitle.textContent = 'Website showcase';
        setActionsVisible(false);
        showOverlay();
        break;
      case S.PAUSE:
        overlayTitle.textContent = 'Pause';
        setActionsVisible(false);
        showOverlay();
        break;
      case S.PREPARE:
        overlayTitle.textContent = 'Prepare yourself';
        setActionsVisible(false);
        showOverlay();
        break;
      case S.PROMPT:
        // we navigate away right after entering PROMPT
        break;
      case S.FINISHED:
        setActionsVisible(false);
        break;
    }
  }

  // Sequence after Go → SHOWCASE → PAUSE → PREPARE → PROMPT (redirect)
  async function startCompetitionFlow(){
    if(AppState.get() !== S.RESULT_SHOWN) return;
    // Navigate in the same tab to a showcase wrapper that loads the site and shows the timer overlay
    const dest = selectedIndex >= 0 ? DESTS[selectedIndex] : null;
    AppState.set(S.SHOWCASE);
    try{ Timer.cancel(); }catch(_){ }
    const path = dest ? dest.path : '';
    const url = `showcase.html?path=${encodeURIComponent(path)}`;
    window.location.href = url;
  }

  // Events
  spinBtn.addEventListener('click', debounce(spin, 400));
  spinBtn.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); spin(); }
  });

  goBtn.addEventListener('click', debounce(()=>{
    if(AppState.get() === S.RESULT_SHOWN){ startCompetitionFlow(); }
  }, 400));

  closeBtn.addEventListener('click', ()=>{
    // Do not change state; remain RESULT_SHOWN so spin stays disabled
    hideOverlay();
  });

  overlay.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){ e.preventDefault(); hideOverlay(); }
  });

  // React to state changes for UI
  AppState.subscribe(updateUIByState);

  window.addEventListener('resize', ()=>{ sizeCanvas(); draw(); });
  window.addEventListener('beforeunload', ()=>{ try{ Timer.cancel(); }catch(_){} });

  // initial setup
  sizeCanvas();
  draw();
  updateUIByState(AppState.get());
})();
