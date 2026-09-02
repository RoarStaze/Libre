export const qs = (selector, root=document) => root.querySelector(selector);
export const qsa = (selector, root=document) => [...root.querySelectorAll(selector)];

export function escapeHTML(value='') {
  return String(value).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

export function html(strings, ...values) {
  return strings.reduce((out, string, index) => out + string + (values[index] ?? ''), '');
}

export function setHTML(target, markup) {
  if (!target) return;
  target.innerHTML = markup;
}

export function delegate(root, eventName, selector, handler) {
  root.addEventListener(eventName, (event) => {
    const target = event.target.closest(selector);
    if (target && root.contains(target)) handler(event, target);
  });
}

export function formatDate(timestamp) {
  if (!timestamp) return '';
  return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(timestamp));
}

export function formatNumber(value=0) {
  return new Intl.NumberFormat(undefined,{notation:'compact',maximumFractionDigits:1}).format(value);
}

export function evidencePill(state='unverified') {
  return `<span class="evidence-pill" data-state="${escapeHTML(state)}">${escapeHTML(state)}</span>`;
}

export function typePill(type='object') {
  return `<span class="type-pill">${escapeHTML(type.replaceAll('_',' '))}</span>`;
}

export function avatarMarkup(person, size='') {
  const source = person?.avatar || person?.displayName || person?.title || person?.email?.split('@')[0] || 'Libre';
  const letters = person?.avatar || String(source).trim().split(/\s+/).filter(Boolean).map((word)=>word[0]).join('').slice(0,2).toUpperCase() || 'L';
  return `<span class="avatar ${size}">${escapeHTML(letters)}</span>`;
}
