import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const space=fs.readFileSync('src/features/space/space.js','utf8');
const navigator=fs.readFileSync('src/features/navigator/navigator.js','utf8');
const runtime=fs.readFileSync('src/features/navigator/navigator-runtime.js','utf8');
const shellRuntime=fs.readFileSync('src/features/space/space-shell-runtime.js','utf8');
const index=fs.readFileSync('index.html','utf8');

const shellPath='styles/space-shell.css';

test('Space uses browser-style back and forward controls instead of a close X',()=>{
  assert.match(space,/data-space-back/);
  assert.match(space,/data-space-forward/);
  const toolbar=space.match(/<div class="space-toolbar">[\s\S]*?<\/div>\n\s*<div class="space-content-shell/);
  assert.ok(toolbar,'Space toolbar should be followed by the content shell');
  assert.doesNotMatch(toolbar[0],/data-close-space/);
  assert.match(shellRuntime,/\[data-space-back\]/);
  assert.match(shellRuntime,/\[data-space-forward\]/);
  assert.match(shellRuntime,/history\.back\(\)/);
  assert.match(shellRuntime,/history\.forward\(\)/);
  assert.match(index,/space-shell-runtime\.js/);
});

test('Space structure keeps Navigator outside reading content as a right dock',()=>{
  assert.match(space,/space-content-shell/);
  assert.match(space,/data-nav-toggle/);
  assert.match(space,/\$\{knowledgeNavigatorMarkup\(\{spaceId:space\.id,graph\}\)\}\s*<\/section>/);
});

test('dedicated shell stylesheet preserves global left sidebar and docks Navigator right',()=>{
  assert.ok(fs.existsSync(shellPath),'space-shell.css must exist');
  const css=fs.readFileSync(shellPath,'utf8');
  assert.match(index,/styles\/space-shell\.css/);
  assert.ok(index.lastIndexOf('styles/space-shell.css') > index.lastIndexOf('styles/sidebar.css'));
  assert.match(css,/\.space-overlay\s*\{[\s\S]*top:\s*var\(--header-h\)[\s\S]*left:\s*var\(--libre-sidebar-width\)/);
  assert.match(css,/\.sidebar-closed\s+\.space-overlay\s*\{[\s\S]*left:\s*0/);
  assert.match(css,/\.knowledge-navigator:not\(\.is-atlas\)[\s\S]*position:\s*fixed[\s\S]*right:\s*0/);
});

test('Atlas is a centered viewport workspace with one close control and internal scrolling',()=>{
  const css=fs.readFileSync(shellPath,'utf8');
  assert.match(navigator,/navigator-atlas-layout/);
  assert.match(navigator,/Close Atlas/);
  assert.doesNotMatch(navigator,/data-nav-visible="false"/);
  assert.match(css,/\.knowledge-navigator\.is-atlas[\s\S]*position:\s*fixed[\s\S]*transform:\s*translate\(-50%,\s*-50%\)/);
  assert.match(css,/\.navigator-atlas-context[\s\S]*overflow-y:\s*auto/);
  assert.match(css,/\.navigator-atlas-graph[\s\S]*min-height:\s*0/);
});

test('long Space titles use a restrained readable scale',()=>{
  const css=fs.readFileSync(shellPath,'utf8');
  assert.match(space,/space-title--long/);
  assert.match(css,/\.space-title\s*\{[\s\S]*font-size:\s*clamp\([^;]+4\.6rem\)/);
  assert.match(css,/\.space-title--long\s*\{[\s\S]*font-size:\s*clamp\([^;]+3\.45rem\)/);
});

test('Navigator runtime owns a single toolbar visibility toggle',()=>{
  assert.match(runtime,/data-nav-toggle/);
  assert.match(runtime,/toggleNavigatorVisible\(\)/);
});

test('graph framing uses actual current and origin positions and avoids permanent edge-label clutter',()=>{
  assert.match(navigator,/currentPos=p\.get\(session\.currentId\)/);
  assert.match(navigator,/originPos=p\.get\(session\.originId\)/);
  assert.doesNotMatch(navigator,/nav-edge[^\n]+<text/);
});
