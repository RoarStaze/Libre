let onChange = () => {};
let restoreScroll = 0;

export function parseRoute(hash=location.hash) {
  const raw = hash.replace(/^#\/?/,'');
  const [pathPart, queryString=''] = raw.split('?');
  const parts = pathPart.split('/').filter(Boolean);
  const query = new URLSearchParams(queryString);
  if (!parts.length) return { name:'home', params:{}, query };
  if (parts[0] === 'space') return { name:'space', params:{ id:parts[1], lens:parts[2] || 'story' }, query };
  if (parts[0] === 'profile') return { name:'profile', params:{ id:parts[1] }, query };
  if (parts[0] === 'topic') return { name:'topic', params:{ id:parts[1] }, query };
  if (parts[0] === 'studio') return { name:'studio', params:{ id:parts[1] || null }, query };
  if (parts[0] === 'library') return { name:'library', params:{}, query };
  if (parts[0] === 'algorithm') return { name:'algorithm', params:{}, query };
  if (parts[0] === 'explore') return { name:'explore', params:{}, query };
  if (parts[0] === 'login') return { name:'login', params:{ mode:parts[1] || 'login' }, query };
  return { name:'not-found', params:{}, query };
}

export function navigate(path, { replace=false, preserveScroll=false }={}) {
  if (preserveScroll) restoreScroll = window.scrollY;
  const hash = path.startsWith('#') ? path : `#${path.startsWith('/')?'':'/'}${path}`;
  if (replace) history.replaceState({},'',hash); else history.pushState({},'',hash);
  onChange(parseRoute());
}

export function back() { history.back(); }
export function setRouterHandler(handler) { onChange = handler; }
export function initRouter() {
  window.addEventListener('popstate', () => onChange(parseRoute()));
  window.addEventListener('hashchange', () => onChange(parseRoute()));
  onChange(parseRoute());
}
export function rememberScroll() { restoreScroll = window.scrollY; }
export function consumeRestoreScroll() { const value = restoreScroll; restoreScroll = 0; return value; }
