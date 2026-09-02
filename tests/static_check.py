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
 'src/domain/evidence.js','src/domain/source-discovery.js','styles/floating-signals.css','styles/evidence-system.css'
]
for path in required:
    assert (root/path).exists(), path

css=''.join((root/'styles'/name).read_text() for name in ['tokens.css','app.css','components.css'])
for token in ['--accent','signal--claim','space-overlay','studio-page','mobile-nav']:
    assert token in css, token

floating=(root/'styles'/'floating-signals.css').read_text()
for token in [
    '.knowledge-stream',
    '.signal.signal-card',
    'border-radius:',
    'box-shadow:',
    '--card-z: 34px;',
    'translate3d(0,-2px,34px)',
    'background:',
    '@media (prefers-reduced-motion: reduce)'
]:
    assert token in floating, token

stream=(root/'src'/'features'/'stream'/'stream.js').read_text()
assert 'stream-topic-chip' in stream
assert 'Knowledge Stream' in stream

evidence_css=(root/'styles'/'evidence-system.css').read_text()
for token in ['select[name="evidenceState"]','display: none !important','.source-discovery-banner','.libre-assessment-metrics','assessment-caveat']:
    assert token in evidence_css, token

repository=(root/'src'/'data'/'repository.js').read_text()
for token in ['recalculateDraftEvidence','derivePublicationEvidence','_ignoredEvidenceState','importDiscoveredSources','libre-auto-v2','metadataLocked']:
    assert token in repository, token

evidence=(root/'src'/'domain'/'evidence.js').read_text()
for token in ['scoreSourceQuality','canonicalSourceGroup','independentSourceGroups','retractedSources','libre-auto-v2','confidence']:
    assert token in evidence, token

source_discovery=(root/'src'/'domain'/'source-discovery.js').read_text()
for token in ['discoverSourcesForDraft','crossref','datacite','europe-pmc','internet-archive','federal-register','dedupeSourceCandidates']:
    assert token in source_discovery, token

app=(root/'src'/'app.js').read_text()
assert 'discoverSourcesForDraft' in app
assert 'Finding sources' in app
assert 'Classifying evidence' in app
# The creation modal itself must no longer expose the old evidence-state field.
assert '<select name="evidenceState">' not in app

print('static-check: PASS')