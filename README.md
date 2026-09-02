# Libre Continuum

**Knowledge should be examined, not buried.**

Libre Continuum is a local-first prototype of a new knowledge-network interface. The atomic unit is not an article or video; it is a reusable **Knowledge Object** connected to other objects by explicit relationships.

## What makes this version different

- **The Stream** renders heterogeneous Knowledge Signals instead of a uniform post/card feed.
- **Expand, don't navigate**: Signals open into route-backed Knowledge Spaces while preserving browsing context.
- **Knowledge Space lenses**: Story, Evidence, Claims, Timeline, and Discussion render the same underlying graph differently.
- **Claims are inspectable objects**, with contextual evidence classifications rather than numeric truth scores.
- **Sources preserve provenance**, including document/passage chains.
- **Trails** are cross-format guided research paths.
- **Rabbit Hole** exposes why each deeper branch is connected.
- **Fork Knowledge** creates a lineage-linked draft and reuses original object IDs instead of copying disconnected evidence.
- **Libre Studio** is a knowledge-construction workspace: object shelf + relationship workspace + Reader Path.
- **My Algorithm** exposes major personalization controls directly.
- **Anonymous contextual discussion** works without requiring an account.

## Run locally on Windows

1. Download or clone the repository.
2. Double-click `Start-Libre.bat`.
3. Libre opens at `http://127.0.0.1:4173/#/`.

`Start-Libre.bat` requires Python 3 only to serve the static ES-module files. There are no npm dependencies and no build step.

You can also run:

```bash
python -m http.server 4173 --bind 127.0.0.1
```

Then open `http://127.0.0.1:4173/#/`.

## Local V1 limitations

This branch deliberately uses a browser-local repository adapter so the product interaction can be proven before cloud infrastructure is introduced.

Local-only components that **must be replaced before public hosting**:

- credentials/password storage → Supabase Auth
- localStorage graph state → Supabase/Postgres
- anonymous identity → Supabase anonymous authentication
- media/document persistence → Supabase Storage
- moderation authorization → server/RLS-enforced roles
- anti-spam → server-side rate limiting + Turnstile
- production source ingestion → server-side fetch/extraction pipeline

Do not deploy this local authentication adapter as a public production auth system.

## Data architecture

Core entities are represented as stable Knowledge Objects plus typed relationships:

- publication / Knowledge Space
- claim
- source
- document / document passage
- video / audio and segments
- topic
- person / organization
- timeline event
- dataset
- collection
- Trail

Relationship examples include `supports`, `contradicts`, `derived_from`, `explains`, `questions`, `cites`, `part_of`, `forked_from`, and `related_to`.

The UI consumes a repository/selectors boundary instead of direct seed arrays, making a Supabase adapter possible without rewriting the feature surfaces.

## Tests

Domain/repository/ranking tests:

```bash
node --test tests/*.test.mjs
```

Browser smoke automation is stored in `tests/smoke.py`. This environment's Chromium is policy-blocked from local/file navigation, so the browser suite cannot execute inside the current ChatGPT sandbox; run it on a normal machine with Playwright installed.

## Branch

The current implementation target is:

`feature/libre-continuum-v1`

The approved product spec is in:

`docs/superpowers/specs/2026-09-01-libre-continuum-design.md`

The implementation plan is in:

`docs/superpowers/plans/2026-09-01-libre-continuum-v1.md`
