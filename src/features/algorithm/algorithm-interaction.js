function clamp(value,min,max){ return Math.min(max,Math.max(min,value)); }

// Capture the range input event before app.js's legacy bubbling handler can
// replace the entire Algorithm page. Keeping the original <input> node alive
// preserves the browser's pointer drag until the user releases it.
document.addEventListener('input',(event)=>{
  const target=event.target.closest?.('[data-algorithm-key]');
  if(!target) return;
  event.stopImmediatePropagation();

  const repository=window.__LIBRE__?.repository;
  if(!repository) return;

  const key=target.dataset.algorithmKey;
  const value=clamp(Number(target.value)||0,0,100);
  repository.updateAlgorithm({[key]:value});

  const readout=document.querySelector(`[data-algorithm-value="${CSS.escape(key)}"]`);
  if(readout) readout.textContent=String(value);

  const vector=document.querySelector(`[data-algorithm-vector-key="${CSS.escape(key)}"]`);
  if(vector) vector.style.height=`${Math.max(8,value)}%`;
},true);
