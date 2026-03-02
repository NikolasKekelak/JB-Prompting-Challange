(function(){
  const countEl = document.getElementById('promptCountdown');
  const titleEl = document.getElementById('phaseTitle');
  const descEl = document.getElementById('phaseDesc');
  const { AppConfig, Timer, AppState } = window;
  const S = AppState?.States || {};

  function formatSeconds(s){
    const m = Math.floor(s/60);
    const sec = Math.floor(s%60);
    const mm = String(m).padStart(2,'0');
    const ss = String(sec).padStart(2,'0');
    return `${mm}:${ss}`;
  }

  function setTitle(t){ if(titleEl) titleEl.textContent = t; }
  function setDesc(t){ if(descEl) descEl.textContent = t; }

  async function runPrepare(){
    try{ AppState.set && AppState.set(S.PREPARE); }catch(_){}
    setTitle('Prepare yourself');
    setDesc('Get ready. The prompt will start automatically.');
    const prepSec = await AppConfig.getPrepareSeconds();
    return new Promise((resolve)=>{
      Timer.startCountdown({
        totalMs: prepSec * 1000,
        tickMs: 250,
        onTick:(ms)=>{ if(countEl) countEl.textContent = formatSeconds(ms/1000); },
        onDone:()=>{ resolve(); }
      });
    });
  }

  async function run321(){
    setTitle('Ready');
    setDesc('Starting the prompt...');
    return new Promise((resolve)=>{
      const totalMs = 3000; // 3..2..1
      Timer.startCountdown({
        totalMs,
        tickMs: 100,
        onTick:(ms)=>{
          const sec = Math.ceil(ms/1000);
          if(countEl) countEl.textContent = String(Math.max(1, sec));
        },
        onDone:()=>{ if(countEl) countEl.textContent = 'PROMPT'; resolve(); }
      });
    });
  }

  async function runPrompt(){
    try{ AppState.set && AppState.set(S.PROMPT); }catch(_){}
    setTitle('Prompt');
    setDesc('Focus on crafting your best solution. The timer will end automatically.');
    const mins = await AppConfig.getPromptMinutes();
    const totalMs = mins * 60 * 1000;
    return new Promise((resolve)=>{
      Timer.startCountdown({
        totalMs,
        tickMs: 250,
        onTick:(ms)=>{ if(countEl) countEl.textContent = formatSeconds(ms/1000); },
        onDone:()=>{
          if(countEl) countEl.textContent = '00:00';
          try{ AppState.set && AppState.set(S.FINISHED); }catch(_){}
          resolve();
        }
      });
    });
  }

  async function start(){
    // Prevent easy back navigation to spin page during competition
    try{
      history.pushState(null, '', location.href);
      window.addEventListener('popstate', function(){ history.pushState(null, '', location.href); });
    }catch(_){}

    await runPrepare();
    await run321();
    await runPrompt();
  }

  window.addEventListener('beforeunload', ()=>{ try{ Timer.cancel(); }catch(_){} });
  start();
})();
