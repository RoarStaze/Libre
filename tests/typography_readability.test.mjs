import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const tokens=fs.readFileSync('styles/tokens.css','utf8');
const app=fs.readFileSync('styles/app.css','utf8');
const index=fs.readFileSync('index.html','utf8');
const typographyPath='styles/typography.css';

test('Libre uses a screen-optimized display and reading font stack',()=>{
  assert.match(tokens,/--display-font:/);
  assert.match(tokens,/Segoe UI Variable Display/);
  assert.match(tokens,/--reading-font:/);
  assert.match(tokens,/Segoe UI Variable Text/);
});

test('global typography hardening stylesheet is loaded last',()=>{
  assert.ok(fs.existsSync(typographyPath));
  const typography=fs.readFileSync(typographyPath,'utf8');
  assert.match(index,/styles\/typography\.css/);
  assert.ok(index.lastIndexOf('styles/typography.css') > index.lastIndexOf('styles/header-profile.css'));
  assert.match(typography,/\.space-title[\s\S]*line-height:\s*1\.06/);
  assert.match(typography,/\.profile-name[\s\S]*line-height:\s*1\.06/);
  assert.match(typography,/\.page-heading h1[\s\S]*line-height:\s*1\.08/);
  assert.match(typography,/\.story-block h2[\s\S]*line-height:\s*1\.12/);
});

test('display typography avoids collision-prone metrics',()=>{
  const typography=fs.readFileSync(typographyPath,'utf8');
  assert.doesNotMatch(typography,/line-height:\s*\.(?:8|9)/);
  assert.doesNotMatch(typography,/letter-spacing:\s*-\.0[5-9]em/);
  assert.match(typography,/overflow-wrap:\s*anywhere/);
  assert.match(typography,/text-wrap:\s*balance/);
});

test('readability layer covers body, controls, cards, story text and headings',()=>{
  const typography=fs.readFileSync(typographyPath,'utf8');
  for(const selector of ['body','button, input, textarea, select','.signal-title','.story-block p','.library-item h3','.space-title']) {
    assert.ok(typography.includes(selector),`missing readability rule for ${selector}`);
  }
  assert.match(typography,/font-synthesis:\s*none/);
  assert.match(typography,/font-kerning:\s*normal/);
});

test('legacy ultra-tight large-title rules are superseded by typography layer',()=>{
  assert.match(app,/\.space-title/);
  const typography=fs.readFileSync(typographyPath,'utf8');
  assert.match(typography,/\.space-title[\s\S]*letter-spacing:\s*-\.025em/);
  assert.match(typography,/\.stream-intro-copy h1[\s\S]*line-height:\s*1\.04/);
});
