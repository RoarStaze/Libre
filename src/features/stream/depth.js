const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarsePointer = window.matchMedia('(pointer: coarse)');
const MAX_TILT = 5.5;

function resetCard(card) {
  card.removeAttribute('data-depth-active');
  card.style.setProperty('--rx', '0deg');
  card.style.setProperty('--ry', '0deg');
  card.style.setProperty('--pointer-x', '50%');
  card.style.setProperty('--pointer-y', '50%');
}

function canTilt() {
  return !reduceMotion.matches && !coarsePointer.matches;
}

document.addEventListener('pointerover', (event) => {
  if (!canTilt()) return;
  const card = event.target.closest('[data-depth-card]');
  if (!card || card.contains(event.relatedTarget)) return;
  card.setAttribute('data-depth-active', 'true');
});

document.addEventListener('pointermove', (event) => {
  if (!canTilt()) return;
  const card = event.target.closest('[data-depth-card]');
  if (!card) return;

  const rect = card.getBoundingClientRect();
  const px = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  const py = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
  const x = (px - .5) * 2;
  const y = (py - .5) * 2;

  card.style.setProperty('--rx', `${(-y * MAX_TILT).toFixed(2)}deg`);
  card.style.setProperty('--ry', `${(x * MAX_TILT).toFixed(2)}deg`);
  card.style.setProperty('--pointer-x', `${(px * 100).toFixed(1)}%`);
  card.style.setProperty('--pointer-y', `${(py * 100).toFixed(1)}%`);
});

document.addEventListener('pointerout', (event) => {
  const card = event.target.closest('[data-depth-card]');
  if (!card || card.contains(event.relatedTarget)) return;
  resetCard(card);
});

document.addEventListener('focusin', (event) => {
  const card = event.target.closest('[data-depth-card]');
  if (card) card.setAttribute('data-depth-active', 'true');
});

document.addEventListener('focusout', (event) => {
  const card = event.target.closest('[data-depth-card]');
  if (card && !card.contains(event.relatedTarget)) resetCard(card);
});

reduceMotion.addEventListener?.('change', () => {
  if (reduceMotion.matches) document.querySelectorAll('[data-depth-card]').forEach(resetCard);
});
coarsePointer.addEventListener?.('change', () => {
  if (coarsePointer.matches) document.querySelectorAll('[data-depth-card]').forEach(resetCard);
});
