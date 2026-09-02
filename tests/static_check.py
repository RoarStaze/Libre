from pathlib import Path
from bs4 import BeautifulSoup

root=Path(__file__).resolve().parents[1]
soup=BeautifulSoup((root/'index.html').read_text(), 'html.parser')
assert soup.select_one('#global-header') is not None
assert soup.select_one('#main-content') is not None
assert soup.select_one('#mobile-nav') is not None
assert soup.select_one('#overlay-root') is not None
assert soup.select_one('script[type="module"][src="./src/app.js"]') is not None
assert soup.select_one('script[type="module"][src="./src/features/stream/depth.js"]') is not None
assert soup.select_one('link[rel="stylesheet"][href="./styles/floating-signals.css"]') is not None

required=[
 'src/features/stream/stream.js','src/features/stream/signals.js','src/features/stream/depth.js','src/features/space/space.js',
 'src/features/space/lenses.js','src/features/studio/studio.js','src/features/search/search.js',
 'src/features/algorithm/algorithm.js','src/features/trails/trails.js','src/data/repository.js',
 'styles/floating-signals.css'
]
for path in required:
    assert (root/path).exists(), path

css=''.join((root/'styles'/name).read_text() for name in ['tokens.css','app.css','components.css'])
for token in ['--accent','signal--claim','space-overlay','studio-page','mobile-nav']:
    assert token in css, token

floating=(root/'styles'/'floating-signals.css').read_text()
for token in [
    'grid-template-columns:',
    '.signal-card-visual',
    '.signal-card-body',
    'perspective(',
    'translate3d(',
    'rotateX(',
    'rotateY(',
    '--pointer-x',
    'box-shadow:',
    '@media (prefers-reduced-motion: reduce)'
]:
    assert token in floating, token

signals=(root/'src'/'features'/'stream'/'signals.js').read_text()
for token in ['signal-card-visual','signal-card-body','signal-card-actions','data-open-object']:
    assert token in signals, token

stream=(root/'src'/'features'/'stream'/'stream.js').read_text()
assert 'stream-topic-chip' in stream
assert 'Knowledge Stream' in stream

print('static-check: PASS')
