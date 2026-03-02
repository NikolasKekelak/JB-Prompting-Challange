// Simple leading-edge debounce that ignores rapid subsequent clicks
(function(global){
  function debounce(fn, waitMs){
    let ready = true;
    const wait = Math.max(0, Number(waitMs||300));
    return function(...args){
      if(!ready) return;
      ready = false;
      try{ fn.apply(this, args); } finally {
        setTimeout(()=>{ ready = true; }, wait);
      }
    };
  }
  global.debounce = debounce;
})(window);
