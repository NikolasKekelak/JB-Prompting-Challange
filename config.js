// Minimal YAML config loader for timings
// - Loads config.yaml once and caches
// - Parses only a simple mapping under `timings`
// - Provides typed getters with safe defaults
(function(global){
  const CONFIG_URL = 'config.yaml';
  let cachedPromise = null;
  let cachedConfig = null;

  function parseYamlTimings(yaml){
    // extremely small parser for the specific expected structure
    // Supports lines like:
    // timings:
    //   spinMs: 7000
    //   showcaseSeconds: 30
    //   pauseSeconds: 5
    //   prepareSeconds: 30
    //   promptMinutes: 5
    const lines = yaml.split(/\r?\n/);
    const result = { timings: {} };
    let inTimings = false;
    for(const raw of lines){
      const line = raw.replace(/#.*$/, '').trimEnd(); // strip comments but keep indentation
      if(!line.trim()) continue;
      if(!inTimings){
        if(/^timings:\s*$/.test(line.trim())){
          inTimings = true;
        }
        continue;
      } else {
        // expect indented key: value under timings
        const m = line.match(/^\s{2,}([A-Za-z][A-Za-z0-9_]*)\s*:\s*(.+)?$/);
        if(m){
          const key = m[1];
          const valRaw = (m[2]||'').trim();
          // parse integers if numeric, else keep string
          let value;
          if(/^[-+]?[0-9]+$/.test(valRaw)) value = parseInt(valRaw, 10);
          else if(/^[-+]?[0-9]*\.[0-9]+$/.test(valRaw)) value = parseFloat(valRaw);
          else if(valRaw === '' || valRaw === 'null') value = null;
          else if(/^(true|false)$/i.test(valRaw)) value = /^true$/i.test(valRaw);
          else value = valRaw;
          result.timings[key] = value;
        } else if(/^\S/.test(line)) {
          // de-indented -> left timings section
          break;
        }
      }
    }
    return result;
  }

  async function loadConfig(){
    if(cachedPromise) return cachedPromise;
    cachedPromise = (async ()=>{
      try{
        const res = await fetch(CONFIG_URL, { cache: 'no-store' });
        if(!res.ok) throw new Error('HTTP '+res.status);
        const yaml = await res.text();
        cachedConfig = parseYamlTimings(yaml);
      }catch(e){
        console.warn('[config] Could not load config.yaml, using defaults. Reason:', e.message||e);
        cachedConfig = { timings: {} };
      }
      return cachedConfig;
    })();
    return cachedPromise;
  }

  function ensure(){ return cachedConfig || { timings: {} }; }

  // Single source of truth: compute spinMs value
  // - If YAML timings.spinMs exists and is a positive number, return it
  // - Else, fallbackFn should return the CURRENT baseline (existing implementation duration),
  //   then we add +2000 ms to it.
  async function getSpinMs(fallbackFn){
    await loadConfig();
    const cfg = ensure();
    const yamlVal = Number(cfg.timings.spinMs);
    if(Number.isFinite(yamlVal) && yamlVal > 0){ return yamlVal; }
    const base = Math.max(0, Number(fallbackFn ? fallbackFn() : 0) || 0);
    return base + 2000; // exact +2s as required
  }

  // Other timing getters with defaults
  async function getShowcaseSeconds(){ await loadConfig(); const v = Number(ensure().timings.showcaseSeconds); return Number.isFinite(v) && v>0 ? v : 30; }
  async function getPauseSeconds(){ await loadConfig(); const v = Number(ensure().timings.pauseSeconds); return Number.isFinite(v) && v>0 ? v : 5; }
  async function getPrepareSeconds(){ await loadConfig(); const v = Number(ensure().timings.prepareSeconds); return Number.isFinite(v) && v>0 ? v : 30; }
  async function getPromptMinutes(){ await loadConfig(); const v = Number(ensure().timings.promptMinutes); return Number.isFinite(v) && v>0 ? v : 5; }

  global.AppConfig = {
    load: loadConfig,
    getSpinMs,
    getShowcaseSeconds,
    getPauseSeconds,
    getPrepareSeconds,
    getPromptMinutes
  };
})(window);
