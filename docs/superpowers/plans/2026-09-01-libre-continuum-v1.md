# Libre Continuum V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production-shaped local version of Libre Continuum that proves the new interaction model: heterogeneous Knowledge Signals in The Stream expand into route-backed Knowledge Spaces with Story, Evidence, Claims, Timeline, and Discussion lenses, supported by typed Knowledge Objects, Trails, Rabbit Hole navigation, a graph-aware Libre Studio, profiles, search, My Algorithm, collections, and anonymous contextual discussion.

**Architecture:** A dependency-light local-first SPA uses semantic HTML, modular ES modules, CSS design tokens, History API routing, and an in-browser repository layer persisted in localStorage. Domain data is modeled around stable Knowledge Objects plus typed relationships so the local repository can later be replaced by Supabase/Postgres without rewriting UI features. Route-backed overlays preserve deep links while enabling the signature Stream-to-Space morph interaction.

**Tech Stack:** HTML5, CSS3, JavaScript ES modules, History API, localStorage, Web Components-free modular DOM rendering, Playwright/Chromium smoke testing when available, future Supabase adapter boundary.

**Spec:** `docs/superpowers/specs/2026-09-01-libre-continuum-design.md`

## Global Constraints

- Libre's atomic unit is the Knowledge Object, not an article.
- The dominant home surface is The Stream with heterogeneous native Signal layouts; a uniform card grid is prohibited.
- Selecting a Signal must expand into a route-backed Knowledge Space and return to the exact Stream position on close/back.
- Knowledge Space lenses: Story, Evidence, Claims, Timeline, Discussion.
- Claims and Sources are first-class objects with typed relationships and provenance.
- No numeric truth score. Evidence state is contextual and explicitly labeled.
- Reading/searching require no account; anonymous comments are allowed and visibly marked anonymous.
- Publishing requires a signed-in local account in V1.
- Recommendation controls must be inspectable through My Algorithm.
- Dark and light modes are first-class.
- Mobile is purpose-designed rather than a compressed desktop layout.
- V1 uses local persistence, but repository interfaces must be replaceable by Supabase later.
- Atlas graph visualization is intentionally deferred, while graph-ready object and relation models are implemented now.

---

## File Structure

- `index.html` — single document shell and accessibility landmarks.
- `styles/tokens.css` — Libre design tokens, typography, color semantics, spacing, motion.
- `styles/app.css` — application shell, Stream, Space, Studio, responsive layouts.
- `styles/components.css` — shared controls, evidence chips, drawers, comments, dialogs.
- `src/app.js` — bootstraps repository, router, shell, keyboard shortcuts.
- `src/router.js` — History API routes and route-backed Space overlay behavior.
- `src/domain/types.js` — runtime enums/constants for object and relationship types.
- `src/domain/seed.js` — development Knowledge Objects and relationships.
- `src/data/repository.js` — local repository interface and persistence implementation.
- `src/data/selectors.js` — graph-aware queries used by UI and recommendations.
- `src/features/stream/stream.js` — heterogeneous Signal composition and stream modes.
- `src/features/stream/signals.js` — semantic Signal renderers by object type.
- `src/features/space/space.js` — transforming Knowledge Space shell.
- `src/features/space/lenses.js` — Story/Evidence/Claims/Timeline/Discussion lens rendering.
- `src/features/search/search.js` — Omnibar, grouped results, keyboard navigation.
- `src/features/trails/trails.js` — Trail progress, Rabbit Hole branches, fork metadata.
- `src/features/studio/studio.js` — graph-oriented construction workspace and Reader Path.
- `src/features/profile/profile.js` — Knowledge Identity creator surface.
- `src/features/library/library.js` — saved objects, Trails, collections, history.
- `src/features/algorithm/algorithm.js` — recommendation controls and ranking explanation.
- `src/features/auth/auth.js` — local-only signup/login/logout state.
- `src/features/moderation/moderation.js` — reporting/moderation queue foundation.
- `src/shared/dom.js` — safe DOM helpers and delegated events.
- `src/shared/icons.js` — inline SVG icon factory.
- `tests/domain.test.mjs` — object/relationship and selector tests.
- `tests/repository.test.mjs` — persistence/auth/discussion tests.
- `tests/recommendation.test.mjs` — ranking/diversity tests.
- `tests/smoke.py` — browser-level primary journey smoke tests.
- `Start-Libre.bat` — Windows local launcher.
- `Serve-Libre.bat` — optional localhost server launcher.
- `README.md` — local run instructions, architecture, cloud migration notes.

---

### Task 1: Domain Model + Repository Foundation

**Files:** domain types, seed graph, repository, selectors, domain/repository tests.

**Interfaces:** stable Knowledge Object IDs, typed relationships, `createRepository()`, graph selectors, comments, saves, follows, and persistence.

- [x] Write failing tests for IDs/types, typed bidirectional relationships, source provenance, comments, and library mutations.
- [x] Verify failures were due to missing implementation.
- [x] Implement runtime domain enums, seeded graph, localStorage repository, and selectors.
- [x] Re-run tests green and keep UI dependent on selectors rather than seed arrays.

### Task 2: Libre Design System + Application Shell

**Files:** `index.html`, token/application/component CSS, shared DOM/icons, app bootstrap, router.

- [x] Implement semantic shell, Libre brand, Omnibar, content/overlay roots, and mobile navigation.
- [x] Implement first-class light/dark design tokens, accessible focus states, and reduced-motion support.
- [x] Implement deep-linkable hash routes suitable for static local/cloud hosting.

### Task 3: The Stream + Native Knowledge Signals

**Files:** Stream, Signal renderers, ranking, app wiring, recommendation tests.

- [x] Test candidate ranking, negative feedback, source-rich boost, and type diversity.
- [x] Implement For You / Following / Latest / Deep Dive / Discover / Trending modes.
- [x] Implement distinct Signal anatomies for investigations, claims, documents, video, Trails, debates, datasets, and collections.
- [x] Add Why this?, Save, Rabbit Hole, and open-context actions.

### Task 4: Transforming Knowledge Space + Lenses

**Files:** Space shell, lenses, router, CSS.

- [x] Implement route-backed overlay expansion with View Transitions API enhancement and reduced-motion fallback.
- [x] Preserve Stream scroll position on opening/closing a Space.
- [x] Implement Story, Evidence, Claims, Timeline, and Discussion lenses over one underlying graph.
- [x] Implement desktop contextual rail and responsive mobile layout.

### Task 5: Claims, Evidence, Contextual Discussion

**Files:** lenses, moderation, repository, tests.

- [x] Implement evidence classifications without numeric truth scoring.
- [x] Implement provenance chains and source/claim-specific discussion entry points.
- [x] Implement persistent anonymous aliases, nested replies, voting, and reporting.
- [x] Add moderation queue foundation.

### Task 6: Trails, Rabbit Hole, Fork Lineage

**Files:** Trails, selectors, repository, tests.

- [x] Implement cross-format Trail objects and temporary Space rendering.
- [x] Implement Rabbit Hole branches from typed graph relations plus topic-neighborhood fallback.
- [x] Implement Fork Knowledge drafts that retain original Reader Path object IDs and explicit `forked_from` lineage instead of duplicating provenance.

### Task 7: Libre Studio — Knowledge Construction + Reader Path

**Files:** Studio, repository, app, tests.

- [x] Implement Studio as Object Shelf + relationship workspace + Reader Path, not a rich-text-editor-first UI.
- [x] Support creation of claims, sources, documents, notes, timeline events, and questions.
- [x] Support typed object relationships, Reader Path ordering, draft persistence, and local publishing.
- [x] Require a signed-in local identity for publishing/forking so provenance has an owner.

### Task 8: Search, Profiles, Library, Collections, My Algorithm

**Files:** search, profile, library, algorithm, auth, app.

- [x] Implement Ctrl/Cmd+K Omnibar search across topics, creators, Spaces, claims, documents, Trails, collections, videos, and datasets.
- [x] Implement Knowledge Identity profiles emphasizing contribution neighborhoods rather than generic post grids.
- [x] Implement saved objects, history, collections, local signup/login, and algorithm controls.
- [x] Wire My Algorithm controls into recommendation scoring.

### Task 9: Mobile Interaction, Accessibility, Performance

**Files:** responsive styles and feature modules.

- [x] Implement deliberate mobile navigation and mobile Space/Studio behavior.
- [x] Add semantic labels, keyboard navigation, Escape behavior, focus states, and reduced-motion fallback.
- [x] Use `content-visibility` for long Stream performance.
- [ ] Execute browser smoke assertions in a browser-capable environment. Current ChatGPT Chromium is administrator-blocked from local/file navigation; the smoke suite remains committed for normal Playwright environments.

### Task 10: Packaging, Verification, and GitHub Handoff

**Files:** Windows launchers, README, ignore rules, plan/status.

- [x] Add Windows static-server launcher and local run instructions.
- [x] Document local-only security limitations and Supabase migration boundaries.
- [x] Push implementation to `feature/libre-continuum-v1` rather than directly changing `main`.
- [ ] Run fresh final tests and compare feature branch against `main` before completion claim.

---

## Plan Self-Review

- Spec coverage: V1 covers Continuum interaction, Knowledge Objects, typed relationships, Stream, Spaces/lenses, Trails, Rabbit Hole, Forks, provenance, Studio/Reader Path, search, profiles, Library, My Algorithm, anonymous contextual discussion, moderation foundation, responsive design, and Supabase-ready boundaries.
- Intentionally deferred: full Atlas visualization, semantic/vector search, automated source extraction, AI-generated summaries, collaborative multi-user Studio, native large-file media hosting, monetization, federation, and production email/OAuth.
- Placeholder scan: no implementation step depends on undefined behavior; deferred features are explicitly outside V1.
- Type consistency: all later features consume stable Knowledge Object IDs and typed relationships through repository/selectors rather than direct seed access.
