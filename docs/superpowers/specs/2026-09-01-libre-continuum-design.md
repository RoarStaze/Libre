# Libre Continuum — Product & System Design Specification

**Status:** Approved product direction

**Date:** 2026-09-01

**Project:** Libre

**Repository:** `RoarStaze/Libre`

## 1. Product thesis

Libre is not an article website, forum, social feed, or video clone. Libre is a **knowledge network** whose atomic unit is a **Knowledge Object** and whose defining behavior is the ability to connect, traverse, challenge, source, remix, fork, and re-render knowledge without losing provenance.

The product goal is to create a new category of public knowledge-sharing platform that combines:

- frictionless personalized discovery,
- source-grounded knowledge construction,
- structured claims and counterclaims,
- cross-format publishing,
- human-curated research paths,
- transparent recommendation controls,
- contextual discussion,
- and future graph-based exploration.

The founding principle is:

> **Knowledge should be examined, not buried.**

Libre is especially welcoming to forgotten knowledge, unconventional research, conspiracy theories, declassified material, disputed history, public records, independent investigations, obscure scientific ideas, alternative explanations, speculative theories, counterarguments, debunking, and mainstream research. Unconventionality itself is not a removal criterion. Libre must, however, clearly separate evidence, allegation, inference, interpretation, speculation, and established findings.

## 2. Product principles

### 2.1 Freedom

Users may investigate controversial or fringe ideas without the platform treating unpopularity as disqualifying.

### 2.2 Evidence

Sources, provenance, counterevidence, corrections, and uncertainty are first-class interface objects rather than footnotes.

### 2.3 Discovery

Libre should make it exceptionally easy to move from one useful object to another through algorithmic relevance, explicit relationships, Trails, and Rabbit Hole navigation.

### 2.4 Clarity

The system may be deep, but the first interaction must remain understandable to a first-time visitor.

### 2.5 User control

The recommendation system serves the user. Users can inspect and alter its behavior through **My Algorithm**.

### 2.6 No false certainty

Libre must not calculate or imply a universal "truth score." Evidence classifications are contextual and may distinguish author classification from community assessment.

## 3. Core product primitive: Knowledge Object

A **Knowledge Object** is the canonical reusable unit in Libre.

Supported object types for the core architecture:

- publication
- claim
- source
- document
- document passage
- video
- video segment
- audio
- audio segment
- image
- quote
- question
- timeline event
- dataset
- topic
- person
- organization
- collection
- trail
- comment/discussion reference

Every Knowledge Object has a stable identity and may be referenced from multiple contexts without duplication.

### 3.1 Core object fields

All Knowledge Objects share:

- stable ID
- type
- title or canonical label
- creator/owner where applicable
- created timestamp
- updated timestamp
- visibility
- canonical URL/slug where applicable
- provenance metadata
- moderation state
- optional topic associations
- optional evidence classification
- optional media metadata

### 3.2 Relationships

Objects can be connected by typed relationships. Initial relationship vocabulary:

- `supports`
- `contradicts`
- `derived_from`
- `mentions`
- `explains`
- `questions`
- `responds_to`
- `caused_by`
- `preceded_by`
- `same_source_as`
- `alternative_interpretation_of`
- `part_of`
- `cites`
- `forked_from`
- `related_to`

Relationships must be represented explicitly in the data model rather than inferred solely from page structure.

## 4. The Continuum interaction model

Libre uses three conceptual depths.

### Depth 1 — Signal

Fast discovery through **The Stream**. A Signal is a compact native representation of a Knowledge Object or Knowledge Space.

### Depth 2 — Space

Selecting a Signal expands it into an immersive **Knowledge Space** without conceptually abandoning the user's browsing context.

### Depth 3 — Atlas

Advanced spatial exploration of object relationships. Atlas is not required for the first implementation milestone, but the underlying object/relationship model must support it cleanly.

### 4.1 Expand, do not abruptly navigate

The defining desktop and mobile interaction is continuity:

- selecting a Stream object morphs/expands it into its Knowledge Space;
- surrounding content recedes rather than being discarded;
- closing/back returns the user to the exact Stream position;
- shared-element transitions reinforce object persistence;
- deep links still work as normal URLs for refresh, sharing, and SEO.

This behavior should be implemented with route-backed overlays/transforming layouts rather than purely client-only modal state.

## 5. The Stream

The homepage is **The Stream**, not a uniform article feed.

### 5.1 Native object presentation

Different content types must render differently according to their semantics.

Examples:

- investigations emphasize thesis, source count, claims, and reading depth;
- claims emphasize supporting/contradicting evidence;
- documents emphasize provenance, page-level citations, and connected investigations;
- videos emphasize playable media plus transcript/claims/sources;
- Trails emphasize sequence and current progress;
- debates emphasize opposing branches;
- datasets emphasize schema/scope and connected claims.

Uniform rectangular cards are prohibited as the dominant layout language.

### 5.2 Stream modes

The initial product supports:

- **For You** — personalized ranking
- **Following** — followed creators/topics
- **Latest** — chronological
- **Deep Dive** — longer/source-rich material
- **Discover** — unfamiliar but relevant material
- **Trending** — activity-weighted discovery with anti-repetition safeguards

Modes should be accessible without six visually dominant top-level tabs.

### 5.3 Recommendation explanations

Every recommended Signal can expose **Why this?** with one or more plain-language reasons.

Examples:

- follows a topic you follow
- connected to a source you saved
- continuation of a Trail you started
- outside your usual topics for discovery
- similar to an investigation you completed

## 6. Knowledge Spaces

A **Knowledge Space** is Libre's replacement for a conventional article page.

A Space may be creator-authored, collaboratively structured later, or derived from a collection of connected objects.

### 6.1 Lenses

Core lenses:

- **Story** — creator-defined narrative path
- **Evidence** — sources, provenance, and evidence relationships
- **Claims** — structured claims and their support/challenges
- **Timeline** — chronological relationships when applicable
- **Discussion** — contextual conversation

Future lens:

- **Map / Atlas** — spatial relationship view

The same underlying knowledge is re-rendered through different lenses rather than duplicated into separate posts.

### 6.2 Story lens

The Story lens renders the creator's chosen Reader Path through Knowledge Objects.

It supports mixed media:

- text
- headings
- quotes
- images
- galleries
- videos
- audio
- documents/PDFs
- code
- tables
- equations
- claims
- evidence blocks
- counterevidence blocks
- source citations
- callouts
- timelines

### 6.3 Evidence lens

The Evidence lens prioritizes:

- primary sources
- secondary sources
- source provenance
- cited passages/timestamps/pages
- supporting relationships
- contradicting relationships
- source reuse across claims

It must allow users to inspect evidence without losing their current location in the Space.

### 6.4 Claims lens

Claims are independently inspectable objects.

A claim can include:

- canonical text
- author classification
- supporting sources
- contradicting sources
- neutral/context sources
- related claims
- discussion count
- challenge/support actions

No numeric truth score is shown.

### 6.5 Timeline lens

Timeline entries are Knowledge Objects or references to them, not plain strings. Events can link to people, documents, claims, and related Spaces.

### 6.6 Discussion lens

Discussion may occur at multiple scopes:

- whole Space
- exact paragraph/block
- claim
- source
- document page/passage
- video/audio timestamp

Anonymous commenting is supported with clearly marked anonymous identity.

## 7. Trails

A **Trail** is a curated cross-format path through Knowledge Objects.

Example:

1. declassified memo
2. historical overview
3. claim
4. hearing transcript
5. skeptical analysis
6. modern interpretation

Trails can be:

- authored by users
- followed
- saved
- forked
- resumed
- recommended by the ranking system

The product should track a user's progress through a Trail.

Trails differ from playlists because objects can be any supported knowledge type and steps may contain explicit explanatory transitions.

## 8. Rabbit Hole

**Rabbit Hole** is guided deep exploration from the current object.

The system proposes intentional branches such as:

- primary source
- earlier program/event
- disputed connection
- opposing view
- deeper background
- related person/organization
- continuation Trail

Rabbit Hole navigation should optimize meaningful traversal rather than endless engagement.

## 9. Fork Knowledge

A user may **Fork** an eligible Knowledge Space or Trail.

Forking creates a new lineage-linked version that can:

- preserve selected objects
- remove objects
- add sources
- add counterevidence
- alter Reader Path
- alter conclusions
- add new relationships

Fork lineage is explicit and visible.

The original is not overwritten.

Forks preserve provenance for reused source and claim objects.

## 10. Provenance

Provenance must survive every transformation.

Examples:

`claim -> quoted passage -> page 17 -> source PDF -> archive record`

`claim -> timestamp 14:22 -> video -> original uploader`

`forked claim -> parent claim -> original Space`

The product must avoid silently copying source material into disconnected duplicates.

## 11. Libre Studio

Libre Studio is not primarily a rich-text editor. It is a **knowledge construction environment**.

### 11.1 Studio workspace

The default conceptual model is a structured canvas/workspace where creators can add:

- source URLs
- documents
- videos
- audio
- images
- text notes
- claims
- questions
- timeline events
- relationships

Studio must remain usable without requiring the creator to understand graph theory.

### 11.2 Source ingestion

For V1, ingestion may be manual/local-first in implementation, but the architecture must support later automated metadata/transcript/document extraction.

### 11.3 Knowledge graph construction

Creators can connect objects using typed relationships.

The interface should make common relationships easy:

- supports
- contradicts
- derived from
- related to
- part of

Advanced relationship types can be progressively disclosed.

### 11.4 Reader Path

Creators construct a **Reader Path** from their object workspace.

The Reader Path defines the Story lens.

A creator can reorder objects without rewriting the underlying graph.

### 11.5 Preview

Preview must render the actual Knowledge Space experience, not a simplified article preview.

### 11.6 Publishing states

- draft
- private preview
- published
- unlisted
- archived

Revision history architecture is required.

## 12. Search and Omnibar

Search is a primary product surface.

### 12.1 Search targets

- Knowledge Spaces
- claims
- sources
- documents
- people
- organizations
- creators
- topics
- Trails
- collections
- media

### 12.2 Result organization

Search should return structured clusters rather than a flat list when confidence permits.

For a topic query, show sections such as:

- overview
- primary sources
- Spaces
- claims
- people
- organizations/programs
- timeline
- related topics
- skeptical/opposing material

### 12.3 Search implementation strategy

Initial implementation:

- PostgreSQL full-text search
- trigram/fuzzy matching
- indexed filters

Later:

- semantic/vector candidate retrieval
- hybrid ranking

Conventional keyword search remains available even after semantic search is introduced.

## 13. Recommendation architecture

The recommendation engine is modular and separated from presentation.

### 13.1 Stage 1 — Candidate retrieval

Candidate pools may include:

- followed creators
- followed topics
- recently engaged objects
- semantic neighbors
- connected relationships
- active Trails
- source affinity
- creator affinity
- trending material
- new publications
- unexplored neighborhoods

### 13.2 Stage 2 — Ranking

Initial score components may include:

- relevance
- completion
- saves
- source engagement
- meaningful discussion
- novelty
- source richness
- creator affinity
- freshness
- Trail continuity
- explicit positive feedback
- explicit negative feedback penalty
- repetition penalty

Raw engagement is never the sole ranking criterion.

### 13.3 Stage 3 — Diversity mixer

Before presentation:

- limit repeated creators
- limit repeated topics
- reduce duplicate source clusters
- inject adjacent subjects
- periodically inject unfamiliar viewpoints/material
- preserve user safety controls such as mute/hide/not interested

## 14. My Algorithm

**My Algorithm** is a signature user-facing control surface.

The user can adjust dimensions such as:

- familiar <-> discover
- quick <-> deep
- recent <-> foundational
- aligned <-> opposing viewpoints
- popular <-> obscure

Content-type preferences may include:

- articles
- documents
- video
- debates
- datasets
- Trails

The system must expose inferred interests separately from explicitly followed interests.

The user can reset personalization.

## 15. Compare Mode

The architecture should support selecting two objects and comparing:

- shared sources
- unique sources
- contradicting claims
- shared people/organizations
- timeline overlap
- topic overlap
- relationship paths

Compare Mode may be partially implemented after the first core milestone, but the object model must not block it.

## 16. Creator identity

A creator profile is a **Knowledge Identity**, not merely a post list.

It may expose:

- topic distribution
- Spaces
- claims
- sources contributed
- Trails
- collections
- forks
- followers/following
- bio

Users can follow creators and topics.

## 17. Collections

Collections are unordered or lightly ordered groupings of Knowledge Objects.

They differ from Trails:

- Collection = grouping
- Trail = intentional sequence/journey

Collections support public, private, and unlisted visibility.

## 18. Library

Logged-in users receive a Library containing:

- saved objects
- read/watch later
- history
- liked objects
- collections
- followed Trails
- Trail progress

Saving must be low-friction.

## 19. Authentication and anonymous participation

### 19.1 Reading

Reading, search, source inspection, and public discussion viewing never require an account.

### 19.2 Publishing

Publishing requires a persistent authenticated account.

### 19.3 Anonymous comments

Anonymous comments use anonymous authenticated sessions rather than unrestricted database writes.

Requirements:

- generated session identity
- temporary display alias
- clear `Anonymous` marker
- rate limiting
- CAPTCHA/Turnstile-compatible protection
- duplicate-content controls
- URL limits
- report capability
- no publishing privilege

### 19.4 Permanent accounts

Architecture supports:

- email/password
- magic link
- Google
- GitHub

## 20. Moderation and safety model

Libre moderates conduct and clearly harmful content rather than mere unconventionality.

Moderation categories include:

- targeted harassment
- doxxing
- credible threats
- incitement of violence
- non-consensual intimate imagery
- child sexual abuse material
- malicious personal-data publication
- malware
- spam
- impersonation
- fraud
- illegal marketplace activity

Required tools:

- report
- block
- mute
- moderation queue
- moderator notes
- action history
- appeals architecture

Serious allegations about identifiable people should be represented as allegations/inferences unless supported as documented fact. The creation experience should encourage sourcing and neutral wording.

## 21. Evidence classification

Initial labels:

- ESTABLISHED
- SUPPORTED
- PRELIMINARY
- DISPUTED
- UNVERIFIED
- THEORY
- SPECULATION

These labels describe evidence context, not platform-declared truth.

Where community assessment exists, display separately from the author's classification.

## 22. Visual and interaction design system

### 22.1 Design concept

Libre should feel like an **impossible digital library built in the near future**, not a sci-fi game and not a stereotypical conspiracy site.

### 22.2 Visual principles

- information creates the spectacle
- layouts are editorial and spatial, not uniform card grids
- almost-flat surfaces
- thin structural boundaries
- restrained depth
- purposeful shared-element motion
- strong typography
- calm density
- progressive disclosure

### 22.3 Prohibited defaults

Avoid as dominant visual language:

- permanent giant left sidebar
- dashboard template anatomy
- endless equal-size cards
- glassmorphism everywhere
- neon hacker motifs
- redacted-document decoration
- fake classified stamps
- Matrix styling
- excessive gradients/glows
- generic shadcn demo appearance
- generic SaaS bento grids

### 22.4 Typography

Use two typography roles:

- **UI:** precise, highly legible modern sans-serif
- **Knowledge:** high-end editorial serif or similarly optimized long-form face

### 22.5 Color

Both light and dark modes are first-class.

Dark base may use near-black/void tones. Light mode uses true paper-like white or restrained neutral surfaces.

One primary accent system is used for navigation/focus. Semantic colors are reserved for evidence relationships such as support, contradiction, and uncertainty.

### 22.6 Motion

Motion communicates continuity:

- Signal -> Space expansion
- lens changes
- contextual rail opening
- Trail progression
- object selection

Motion must respect `prefers-reduced-motion`.

## 23. Desktop navigation concept

Primary chrome remains minimal:

- Libre brand
- persistent Omnibar
- Create action
- account/profile control

Primary destinations:

- Home / Stream
- Explore
- Create / Studio
- Library

Secondary modes and filters are contextually exposed rather than permanently occupying navigation.

## 24. Mobile navigation concept

Mobile is designed independently rather than compressed from desktop.

Core behavior:

- omnibar easy to reach
- single-column Stream
- Space expands to full viewport
- horizontal lens movement may be used where accessible
- downward collapse/back returns to exact Stream location
- one-handed save/comment/follow actions

A bottom navigation may contain:

- Home
- Explore
- Create
- Library
- You

if browser testing demonstrates it improves ergonomics.

## 25. Contextual rails and drawers

Desktop Knowledge Space may expose a contextual rail for:

- Sources
- Claims
- Outline
- Related objects

It must not permanently reduce reading width excessively.

Mobile converts this behavior to drawers/bottom sheets.

## 26. Focus Mode

Focus Mode removes nonessential interface chrome while preserving:

- progress
- minimal navigation
- source access
- discussion access

## 27. Technical architecture

### 27.1 Frontend

Preferred production architecture:

- latest stable Next.js
- React
- strict TypeScript
- server rendering for public/SEO surfaces
- client components only where interaction requires them
- accessible component primitives
- CSS/design tokens owned by Libre rather than a visually dominant component framework

### 27.2 Backend

Preferred cloud backend:

- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Row Level Security
- server-side privileged operations only

The initial local development architecture must isolate the data-access layer so local fixtures/local persistence can be replaced by Supabase repositories without rewriting feature components.

### 27.3 Validation

All trust-boundary data uses runtime validation schemas in addition to TypeScript types.

### 27.4 Performance

Required practices:

- avoid request waterfalls
- parallelize independent reads
- minimize client JavaScript
- paginate/cursor feeds
- lazy-load heavy editors/visualizations
- dynamically import Atlas/graph code
- optimize media
- cache appropriate server reads
- index high-volume database paths
- defer non-critical analytics

## 28. Core relational model

Exact SQL is deferred to the implementation plan, but the architecture requires normalized entities equivalent to:

- profiles
- knowledge_objects
- object_relationships
- publications/spaces
- space_objects
- reader_paths
- claims
- sources
- source_anchors
- topics
- object_topics
- trails
- trail_steps
- collections
- collection_items
- forks
- comments
- comment_targets
- comment_votes
- object_votes
- follows
- topic_follows
- bookmarks
- library_events
- recommendation_events
- view_events
- search_events
- reports
- moderation_actions
- notifications

`knowledge_objects` provides stable identity; type-specific tables hold fields that do not belong on every object.

Do not encode the relational graph as one giant JSONB document.

## 29. Source anchors

A source citation can target a precise anchor:

- document page
- document passage
- video timestamp/range
- audio timestamp/range
- URL fragment
- text excerpt with provenance metadata

Anchors are first-class because contextual claims and discussion depend on them.

## 30. SEO and public web

Public Spaces and eligible objects require:

- server-rendered metadata
- canonical URLs
- OpenGraph metadata
- structured data where appropriate
- sitemap architecture
- crawlable topic and creator routes
- stable slugs

Interactive expansion must not compromise direct-linkability.

## 31. Accessibility

Target WCAG AA-quality interaction.

Requirements:

- semantic HTML
- logical heading structure
- visible focus states
- keyboard navigation
- screen-reader labels
- accessible menus/dialogs/drawers
- sufficient contrast
- reduced motion
- alt text support
- non-color-only evidence meaning

## 32. Testing strategy

Implementation must include automated tests for:

- authentication
- anonymous session behavior
- publication ownership
- Space creation/editing
- Reader Path ordering
- source creation
- source anchors
- claim relationships
- relationship validation
- Trail ordering/progress
- forking lineage
- search
- following
- bookmarks/library
- comments/replies
- comment target scoping
- moderation authorization
- recommendation controls
- RLS policies when Supabase is introduced

Browser tests cover:

- desktop Stream -> Space -> collapse continuity
- mobile Stream -> Space -> collapse continuity
- lens switching
- Studio creation flow
- Trail progression
- search -> structured results
- anonymous commenting
- My Algorithm controls

## 33. Core V1 scope

The first serious build should establish the novel product model rather than shallowly implementing every future idea.

### Must implement

1. Libre app shell and original design system
2. transforming Knowledge Stream
3. Omnibar
4. multiple native Signal formats
5. route-backed Knowledge Space expansion
6. Story lens
7. Evidence lens
8. Claims lens
9. Discussion lens
10. Knowledge Object model
11. typed relationships
12. source objects and anchors
13. claim objects
14. Trails
15. Rabbit Hole navigation
16. Libre Studio object workspace
17. Reader Path creation
18. publishing/drafts/editing
19. creator profiles
20. topics
21. collections
22. Library
23. My Algorithm
24. accounts
25. anonymous contextual comments
26. comments/replies/votes/reports
27. follow/save actions
28. light/dark modes
29. responsive mobile experience
30. moderation foundation/admin surface
31. local development data adapter
32. Supabase-ready repository interfaces

### Architecture-ready, not required for first milestone

- full Atlas visualization
- semantic/vector search
- AI source extraction
- AI claim extraction
- automated contradiction discovery
- Community Context
- collaborative Spaces
- creator monetization
- native mobile apps
- federation/API
- advanced reputation
- production-scale recommendation ML

## 34. Explicit non-goals for first milestone

Do not:

- build a conventional blog and rename posts as Knowledge Objects
- represent every object as the same card component
- make Atlas the only navigation method
- require AI APIs for core functionality
- implement a fake truth score
- optimize purely for session length
- require login to read
- expose unrestricted anonymous database inserts
- hard-code production comments or engagement metrics
- couple frontend components directly to Supabase queries
- ship dead buttons or purely decorative interactions

## 35. Error and empty states

Design explicit states for:

- no Stream recommendations
- no search results
- missing/deleted Space
- unavailable source
- deleted comment target
- empty Library
- empty Trail
- source upload failure
- relationship validation failure
- offline/network failure

Error states should preserve user work when possible.

## 36. Data-flow boundaries

Feature modules communicate through explicit service/repository interfaces.

Suggested domains:

- identity
- knowledge objects
- relationships
- spaces
- studio
- sources
- claims
- trails
- discovery
- recommendations
- search
- discussions
- library
- moderation

UI components do not own persistence logic.

## 37. Security requirements

- all exposed production tables use RLS
- service-role credentials never reach browser code
- permanent and anonymous identities have separate capabilities
- server-side authorization is authoritative
- uploads enforce MIME and size restrictions
- executable uploads are rejected
- comment writes are rate-limited
- admin access is enforced server-side
- report/moderation actions are auditable
- input is validated at trust boundaries

## 38. Success criteria

A first-time visitor should understand within seconds that Libre is a place to **discover and publish knowledge**, but continued use should reveal that knowledge is structured differently from ordinary social media.

A successful first release should make users notice at least four things immediately:

1. different knowledge types have different native forms;
2. opening something feels like expanding into it rather than leaving the feed;
3. claims and sources can be inspected independently from the story;
4. Trails/Rabbit Hole provide intentional paths through knowledge.

A creator should be able to construct knowledge once and publish multiple useful lenses over the same underlying objects.

A researcher should be able to trace important claims back to precise source anchors.

A casual user should be able to use the Stream without understanding the graph architecture.

## 39. Design acceptance criteria

Before implementation is considered visually complete, verify the core surfaces against approved concepts:

- desktop Stream
- mobile Stream
- Knowledge Space Story lens
- Evidence lens
- Claims lens
- Libre Studio
- Omnibar/search results
- Trail/Rabbit Hole
- creator profile
- Library
- My Algorithm
- login/signup

The result must not look like a generic article site, Reddit clone, Medium clone, dashboard, documentation site, or SaaS template.

## 40. Product identity summary

YouTube's primitive is video.

Reddit's primitive is the post.

Wikipedia's primitive is the page.

Libre's primitive is the **Knowledge Object + Connection**.

Libre's primary authored experience is the **Knowledge Space**.

Libre's primary discovery experience is the **Stream**.

Libre's primary guided exploration primitive is the **Trail**.

Libre's primary deep-exploration interaction is **Rabbit Hole**.

Libre's authoring environment is **Libre Studio**.

Libre's personalization philosophy is embodied by **My Algorithm**.

The long-term graph view is **Atlas**.

Together these form **Libre Continuum**.
