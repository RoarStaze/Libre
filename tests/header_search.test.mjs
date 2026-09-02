import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeedGraph } from '../src/domain/seed.js';
import { headerSearchMarkup, headerSearchResultsMarkup } from '../src/features/search/header-search.js';

test('header Omnibar is a real search input, not a modal trigger', () => {
  const markup = headerSearchMarkup('');
  assert.match(markup, /data-header-search-input/);
  assert.match(markup, /<input/);
  assert.doesNotMatch(markup, /data-open-command/);
  assert.doesNotMatch(markup, /command-backdrop/);
});

test('header search results render as an anchored dropdown without a dialog backdrop', () => {
  const graph = createSeedGraph();
  const markup = headerSearchResultsMarkup(graph, 'Stargate');
  assert.match(markup, /header-search-dropdown-content/);
  assert.match(markup, /Stargate/);
  assert.match(markup, /data-command-open/);
  assert.doesNotMatch(markup, /command-backdrop/);
  assert.doesNotMatch(markup, /aria-modal="true"/);
});
