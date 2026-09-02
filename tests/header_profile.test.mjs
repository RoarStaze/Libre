import test from 'node:test';
import assert from 'node:assert/strict';
import { avatarMarkup } from '../src/shared/dom.js';
import { profileControlMarkup, profileMenuMarkup } from '../src/features/profile/header-profile.js';

test('account avatar derives initials from displayName instead of generic Libre fallback', () => {
  const markup = avatarMarkup({ displayName:'Roar Staze' }, 'avatar--header');
  assert.match(markup,/>RS</);
  assert.match(markup,/avatar--header/);
});

test('signed-in header uses a compact avatar control without the old username pill', () => {
  const markup = profileControlMarkup({ id:'user-1', displayName:'roarstaze', email:'r@example.com' });
  assert.match(markup,/data-profile-trigger/);
  assert.match(markup,/header-profile-button/);
  assert.doesNotMatch(markup,/login-copy/);
  assert.doesNotMatch(markup,/>roarstaze<\/span>/);
  assert.match(markup,/aria-haspopup="menu"/);
});

test('profile menu exposes account identity and primary account destinations', () => {
  const markup = profileMenuMarkup({ id:'user-1', displayName:'roarstaze', email:'r@example.com' });
  assert.match(markup,/data-profile-menu/);
  assert.match(markup,/View profile/);
  assert.match(markup,/Library/);
  assert.match(markup,/My Algorithm/);
  assert.match(markup,/Sign out/);
  assert.match(markup,/data-profile-signout/);
});
