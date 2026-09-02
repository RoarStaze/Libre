from pathlib import Path
from bs4 import BeautifulSoup

root=Path(__file__).resolve().parents[1]
soup=BeautifulSoup((root/'index.html').read_text(), 'html.parser')
assert soup.select_one('#global-header') is not None
assert soup.select_one('#main-content') is not None
assert soup.select_one('#mobile-nav') is not None
assert soup.select_one('#overlay-root') is not None
assert soup.select_one('script[type="module"][src="./src/app.js"]') is not None
assert soup.select_one('link[rel="stylesheet"][href="./styles/floating-signals.css"]') is not None
assert soup.select_one('link[rel="stylesheet"][href="./styles/evidence-system.css"]') is not None

required=[
 'src/features/stream/stream.js','src/features/stream/signals.js','src/features/space/space.js',
 'src/features/space/lenses.js','src/features/studio/studio.js','src/features/search/search.js',
 'src/features/algorithm/algorithm.js','src/features/trails/trails.js','src/data/repository.js',
 'src/domain/evidence.js','styles/floating-signals.css','styles/evidence-system.css'
]
for path in required:
    assert (root/path).exists(), path

css=''.join((root/'styles'/name).read_text() for name in ['tokens.css','app.css','components.css'])
for token in ['--accent','signal--claim','space-overlay','studio-page','mobile-nav']:
    assert token in css, token

floating=(root/'styles'/'floating-signals.css').read_text()
for token in [
    '.knowledge-stream',
    '.signal {',
    'border-radius:',
    'box-shadow:',
    'translateZ(34px)',
    'background:',
    '@media (prefers-reduced-motion: reduce)'
]:
    assert token in floating, token

stream=(root/'src'/'features'/'stream'/'stream.js').read_text()
assert 'stream-topic-chip' in stream
assert 'Knowledge discovery' in stream

evidence_css=(root/'styles'/'evidence-system.css').read_text()
assert 'select[name="evidenceState"]' in evidence_css
assert 'display: none !important' in evidence_css
assert 'Libre assigns evidence status automatically' in evidence_css

repository=(root/'src'/'data'/'repository.js').read_text()
assert 'recalculateDraftEvidence' in repository
assert 'derivePublicationEvidence' in repository
assert '_ignoredEvidenceState' in repository

print('static-check: PASS')
