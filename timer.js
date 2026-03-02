// Single active countdown timer controller
(function(global){
  let intervalId = null;
  let endAt = 0;

  function clear(){
    if(intervalId !== null){
      clearInterval(intervalId);
      intervalId = null;
    }
    endAt = 0;
  }

  function startCountdown(opts){
    // opts: { totalMs, onTick(remainingMs), onDone(), tickMs=1000 }
    clear();
    const totalMs = Math.max(0, Number(opts.totalMs||0));
    const tickMs = Math.max(16, Number(opts.tickMs||1000));
    const onTick = typeof opts.onTick === 'function' ? opts.onTick : ()=>{};
    const onDone = typeof opts.onDone === 'function' ? opts.onDone : ()=>{};
    const start = Date.now();
    endAt = start + totalMs;
    function tick(){
      const now = Date.now();
      const remaining = Math.max(0, endAt - now);
      try{ onTick(remaining); }catch(e){ console.error(e); }
      if(remaining <= 0){
        clear();
        try{ onDone(); }catch(e){ console.error(e); }
      }
    }
    tick();
    intervalId = setInterval(tick, tickMs);
    return { cancel: clear };
  }

  global.Timer = { startCountdown, cancel: clear };
})(window);
