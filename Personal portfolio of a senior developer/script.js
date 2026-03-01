// Tab switching with ARIA updates
(function(){
  const tabs = document.querySelectorAll('.tab-btn[role="tab"]');
  const panels = document.querySelectorAll('.tab-panel[role="tabpanel"]');

  function activateTab(tab){
    tabs.forEach(t=>{
      const selected = t===tab;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
      const panelId = t.getAttribute('aria-controls');
      const panel = document.getElementById(panelId);
      if(panel){
        if(selected){
          panel.hidden = false;
          panel.classList.add('is-active');
        }else{
          panel.hidden = true;
          panel.classList.remove('is-active');
        }
      }
    });
  }

  tabs.forEach((t,i)=>{
    t.addEventListener('click', ()=>activateTab(t));
    t.addEventListener('keydown', (e)=>{
      // Keyboard navigation between tabs: Left/Right/Home/End
      const idx = Array.prototype.indexOf.call(tabs, t);
      let next = null;
      if(e.key==='ArrowRight') next = tabs[(idx+1)%tabs.length];
      if(e.key==='ArrowLeft') next = tabs[(idx-1+tabs.length)%tabs.length];
      if(e.key==='Home') next = tabs[0];
      if(e.key==='End') next = tabs[tabs.length-1];
      if(next){
        e.preventDefault();
        next.focus();
        activateTab(next);
      }
    });
    // Ensure only the first is in tab order by default
    if(i>0) t.tabIndex = -1;
  });

  // Initialize correct state from any pre-marked aria-selected
  const initiallySelected = Array.from(tabs).find(t=>t.getAttribute('aria-selected')==='true') || tabs[0];
  if(initiallySelected) activateTab(initiallySelected);
})();

// Footer year
(function(){
  const y = document.getElementById('year');
  if(y) y.textContent = String(new Date().getFullYear());
})();

// Subtle spark/ember effect over orange-accented zones
(function(){
  const zones = document.querySelectorAll('.spark-zone');

  zones.forEach(zone => {
    let emberTimer = null;

    function spawnEmber(){
      const ember = document.createElement('span');
      ember.className = 'ember';
      const rect = zone.getBoundingClientRect();
      const x = Math.random()*rect.width;
      const y = rect.height - Math.random()*8 - 2; // near bottom edge
      const driftX = (Math.random()*20-10);
      const rise = 20 + Math.random()*30;
      const duration = 900 + Math.random()*600;
      ember.style.left = x + 'px';
      ember.style.top = y + 'px';
      ember.style.opacity = '0.9';
      zone.appendChild(ember);
      const start = performance.now();
      function tick(now){
        const t = Math.min(1, (now-start)/duration);
        const ease = t*t*(3-2*t); // smoothstep
        ember.style.transform = `translate(${driftX*ease}px, ${-rise*ease}px)`;
        ember.style.opacity = String(0.9*(1-t));
        if(t<1){
          requestAnimationFrame(tick);
        }else{
          ember.remove();
        }
      }
      requestAnimationFrame(tick);
    }

    function start(){
      if(emberTimer) return;
      // Create a few quick sparks, then taper off
      let bursts = 0;
      emberTimer = setInterval(()=>{
        spawnEmber();
        if(Math.random() < 0.6) spawnEmber();
        bursts++;
        if(bursts>6){ // run briefly to stay subtle
          stop();
        }
      }, 140);
    }

    function stop(){
      if(emberTimer){
        clearInterval(emberTimer);
        emberTimer = null;
      }
    }

    zone.addEventListener('mouseenter', start);
    zone.addEventListener('focusin', start);
    zone.addEventListener('mouseleave', stop);
    zone.addEventListener('focusout', stop);
  });
})();
