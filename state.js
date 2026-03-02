// Finite State Machine for competition flow
// Allowed states per requirements
(function(global){
  const States = Object.freeze({
    READY: 'READY',
    SPINNING: 'SPINNING',
    RESULT_SHOWN: 'RESULT_SHOWN',
    WAITING_FOR_CONFIRMATION: 'WAITING_FOR_CONFIRMATION',
    SHOWCASE: 'SHOWCASE',
    PAUSE: 'PAUSE',
    PREPARE: 'PREPARE',
    PROMPT: 'PROMPT',
    FINISHED: 'FINISHED'
  });

  let current = States.READY;
  const listeners = new Set();

  function log(next){
    try{ console.log('STATE →', next); }catch(_){}
  }

  function get(){ return current; }

  function subscribe(fn){ listeners.add(fn); return ()=>listeners.delete(fn); }

  function set(next){
    if(!Object.values(States).includes(next)){
      console.warn('[state] Invalid target state', next); return;
    }
    if(current === next) return;
    current = next;
    log(next);
    for(const fn of listeners){ try{ fn(next); } catch(e){ console.error(e); } }
  }

  global.AppState = { States, get, set, subscribe };
})(window);
