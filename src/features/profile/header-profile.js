import { escapeHTML, avatarMarkup } from '../../shared/dom.js';
import { icon } from '../../shared/icons.js';

export function profileMenuMarkup(account) {
  if (!account) return '';
  const displayName = account.displayName || account.title || account.email || 'Libre member';
  const email = account.email || '';
  return `<div class="header-profile-menu" data-profile-menu role="menu" aria-label="Account menu">
    <div class="profile-menu-identity">
      ${avatarMarkup(account,'avatar--menu')}
      <div class="profile-menu-copy">
        <strong>${escapeHTML(displayName)}</strong>
        ${email ? `<span>${escapeHTML(email)}</span>` : '<span>Libre knowledge identity</span>'}
      </div>
    </div>
    <div class="profile-menu-divider"></div>
    <button class="profile-menu-item" type="button" role="menuitem" data-route="/profile/${escapeHTML(account.id || '')}">${icon('user',18)}<span><strong>View profile</strong><small>Your public knowledge identity</small></span>${icon('chevron',15)}</button>
    <button class="profile-menu-item" type="button" role="menuitem" data-route="/library">${icon('library',18)}<span><strong>Library</strong><small>Saved knowledge and collections</small></span>${icon('chevron',15)}</button>
    <button class="profile-menu-item" type="button" role="menuitem" data-route="/algorithm">${icon('settings',18)}<span><strong>My Algorithm</strong><small>Control what Libre recommends</small></span>${icon('chevron',15)}</button>
    <div class="profile-menu-divider"></div>
    <button class="profile-menu-item profile-menu-item--danger" type="button" role="menuitem" data-profile-signout>${icon('logout',18)}<span><strong>Sign out</strong><small>End this local session</small></span></button>
  </div>`;
}

export function profileControlMarkup(account) {
  if (!account) return '';
  const displayName = account.displayName || account.title || account.email || 'Libre member';
  return `<div class="header-profile" data-header-profile>
    <button class="header-profile-button" type="button" data-profile-trigger aria-label="Open ${escapeHTML(displayName)} account menu" aria-haspopup="menu" aria-expanded="false">
      ${avatarMarkup(account,'avatar--header')}
      <span class="profile-presence" aria-hidden="true"></span>
    </button>
    ${profileMenuMarkup(account)}
  </div>`;
}
