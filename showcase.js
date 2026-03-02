(function(){
  const countdownEl = document.getElementById('showcaseCountdown');
  const frame = document.getElementById('siteFrame');
  const fallback = document.getElementById('fallback');
  const { AppConfig, Timer, AppState } = window;
  const S = AppState?.States || {};

  function formatSeconds(s){
    const m = Math.floor(s/60);
    const sec = Math.floor(s%60);
    const mm = String(m).padStart(2,'0');
    const ss = String(sec).padStart(2,'0');
    return `${mm}:${ss}`;
  }

  function getQueryParam(name){
    const m = new RegExp(`[?&]${name}=([^&]+)`).exec(location.search);
    return m ? decodeURIComponent(m[1]) : '';
  }

  async function start(){
    try{ AppState.set && AppState.set(S.SHOWCASE); }catch(_){ }

    const path = getQueryParam('path');
    if(path){
      try{ frame.src = path; }catch(_){ }
    } else {
      // show fallback panel if missing path
      if(fallback) fallback.hidden = false;
    }

    // Prevent quick back during competition
    try{
      history.pushState(null, '', location.href);
      window.addEventListener('popstate', function(){ history.pushState(null, '', location.href); });
    }catch(_){ }

    const sec = await AppConfig.getShowcaseSeconds();
    Timer.startCountdown({
      totalMs: sec * 1000,
      tickMs: 250,
      onTick:(ms)=>{ if(countdownEl) countdownEl.textContent = formatSeconds(ms/1000); },
      onDone:()=>{
        try{ AppState.set && AppState.set(S.PAUSE); }catch(_){ }
        // Immediately continue to prompt page where PREPARE starts
        window.location.href = 'prompt.html';
      }
    });
  }

  window.addEventListener('beforeunload', ()=>{ try{ Timer.cancel(); }catch(_){} });
  start();
})();
