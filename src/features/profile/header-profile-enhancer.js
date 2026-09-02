import { profileControlMarkup } from './header-profile.js';

const header = document.querySelector('#global-header');
let upgrading = false;

function account() {
  return window.__LIBRE__?.repository?.getState?.().account || null;
}

function upgradeProfileControl() {
  if (!header || upgrading) return;
  const legacy = header.querySelector('[data-account-menu]');
  const currentAccount = account();
  if (!legacy || !currentAccount) return;
  upgrading = true;
  legacy.outerHTML = profileControlMarkup(currentAccount);
  upgrading = false;
}

function closeProfileMenu(except = null) {
  document.querySelectorAll('[data-header-profile][data-open="true"]').forEach((profile) => {
    if (profile === except) return;
    profile.dataset.open = 'false';
    profile.querySelector('[data-profile-trigger]')?.setAttribute('aria-expanded','false');
  });
}

header?.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-profile-trigger]');
  if (trigger) {
    event.preventDefault();
    event.stopPropagation();
    const profile = trigger.closest('[data-header-profile]');
    const open = profile?.dataset.open === 'true';
    closeProfileMenu(profile);
    if (profile) profile.dataset.open = open ? 'false' : 'true';
    trigger.setAttribute('aria-expanded', open ? 'false' : 'true');
    return;
  }

  const signout = event.target.closest('[data-profile-signout]');
  if (signout) {
    event.preventDefault();
    window.__LIBRE__?.repository?.signOut?.();
    closeProfileMenu();
    location.hash = '#/';
    location.reload();
  }
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('[data-header-profile]')) closeProfileMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeProfileMenu();
});

const observer = new MutationObserver(upgradeProfileControl);
if (header) observer.observe(header,{childList:true,subtree:true});
upgradeProfileControl();
