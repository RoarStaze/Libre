# Libre Knowledge Navigator — Rabbit-Hole Graph Design

Date: 2026-09-02
Status: Approved product direction; design specification awaiting implementation-plan transition
Branch: `feature/libre-continuum-v1`

## 1. Purpose

Libre needs a knowledge graph that is not merely decorative. It must function as a persistent navigation and orientation system for deep exploration.

The core user promise is:

> You can go arbitrarily deep into a rabbit hole without losing your origin, your path, your current position, your visited branches, or the unexplored branches you chose not to follow yet.

The graph therefore has two jobs at once:

1. **Exploration** — reveal meaningful adjacent knowledge and let the user move through it.
2. **Orientation** — continuously answer: Where am I? How did I get here? What have I already explored? What branches remain?

The graph must stay useful at both small and large knowledge neighborhoods and must not become an unreadable hairball.

## 2. Research-derived design principles

### 2.1 Progressive disclosure over “show everything”

Graph tools such as Neo4j Bloom and Cytoscape emphasize expanding neighborhoods incrementally. Libre should initially render a focused subgraph around the current Knowledge Object and expand only when the user requests more context.

Reason: a full graph can become visually dense before the user develops a mental model of the neighborhood.

### 2.2 Focus + context

The current object must remain visually dominant while nearby nodes and the path-to-origin remain visible enough to preserve spatial context.

The system should never require the user to memorize how they arrived at a node.

### 2.3 Neighbor emphasis

Sigma’s current interaction model supports highlighting a node’s immediate neighborhood while fading unrelated nodes. Libre should adopt this pattern because relationship meaning matters more than the raw number of visible nodes.

### 2.4 Camera continuity

Moving deeper should animate the graph camera from the old focus to the new focus instead of teleporting to a new layout. Spatial continuity helps the user preserve their mental map.

### 2.5 Persistent traversal history

Browser history alone is insufficient. Libre needs a graph-native exploration history that remains visible in the Navigator.

## 3. Product model

### 3.1 The subsystem name

User-facing name: **Knowledge Navigator**

Full-screen mode: **Atlas**

Exploration action: **Go Deeper** / **Rabbit Hole**

### 3.2 Primary surfaces

The subsystem has three coordinated presentations:

1. **Navigator Graph** — persistent collapsible right-side graph on desktop while a Knowledge Space is open.
2. **Atlas** — full-width immersive graph for larger-scale exploration and comparison.
3. **Navigator Sheet** — mobile/tablet bottom sheet that can expand from compact path view into a larger interactive graph.

All three surfaces use the same traversal state and graph-selection model.

## 4. Desktop layout

While a Knowledge Space is open:

- Main content occupies the center/left.
- Navigator Graph occupies a collapsible right rail.
- Default expanded width target: approximately 360–430 px depending on viewport.
- Compact width target: approximately 56–64 px, showing only the current-path spine and reopen control.
- Atlas button expands the graph into the full primary canvas.

The Navigator must not permanently destroy reading width on smaller desktop screens. At narrower breakpoints, it becomes an overlay panel rather than a fixed content column.

## 5. Mobile layout

The graph is represented by a bottom-sheet navigator.

Three snap states:

1. **Peek** — current node + previous node + next available branches count.
2. **Explore** — roughly half-screen graph and visible path strip.
3. **Atlas** — near-full-screen graph exploration.

The user can always collapse back to content with one gesture or button.

Primary navigation must not rely on hover.

## 6. Exploration state model

Libre needs an explicit traversal session separate from general browsing history.

Suggested structure:

```js
{
  originId,
  currentId,
  path: [objectId, ...],
  visited: Set<objectId>,
  expanded: Set<objectId>,
  branchParents: Map<objectId, objectId>,
  pinned: Set<objectId>,
  hiddenBranches: Set<objectId>,
  cameraState,
  startedAt,
  updatedAt
}
```

This state should be serializable for future cloud persistence.

### 6.1 Origin

The first Knowledge Object from which the exploration session began.

It receives a permanent visual marker for that session.

### 6.2 Current node

The Knowledge Object currently open in the main content area.

It receives the strongest visual emphasis.

### 6.3 Path

The ordered route from origin to current node.

The path is never discarded when the user changes branches.

### 6.4 Visited nodes

Previously opened nodes remain distinguishable from unexplored nodes.

### 6.5 Expanded nodes

Nodes whose neighbors the user has deliberately revealed remain expanded unless the user collapses them.

This preserves the mental map.

## 7. The “Never Lost” orientation system

This is the defining feature.

### 7.1 Path Spine

A persistent horizontal or vertical breadcrumb of the traversal path:

`Origin → Document → Claim → Counterevidence → Current`

Requirements:

- Every step is clickable.
- Current node is visually distinct.
- Earlier steps remain visible even if the graph camera moves elsewhere.
- Long paths collapse intelligently but never lose the origin or most recent steps.
- Hidden middle steps can expand in-place.

### 7.2 You Are Here marker

The current node receives:

- strongest ring/stroke
- current-node badge on selection
- high-contrast label
- animated camera focus when changed

The marker must be accessible without relying on color alone.

### 7.3 Origin beacon

The origin node remains subtly marked even after many expansions.

The user can click **Back to origin** at any time.

### 7.4 Branch memory

When the user leaves a branch, that branch stays in the graph as visited context rather than disappearing.

Unvisited branches remain visibly different.

### 7.5 Backtrack controls

Controls:

- Previous node
- Next node when traversing forward through history
- Back to branch point
- Back to origin

These actions operate on graph traversal history, not browser-page history alone.

## 8. Progressive graph expansion

### 8.1 Initial neighborhood

When a Space opens, display:

- current object
- path-to-origin if a traversal session exists
- highest-value first-degree relationships
- a controlled number of adjacent nodes

Do not immediately show the whole global graph.

### 8.2 Expand node

Each node supports **Expand**.

Expanding reveals one-hop neighbors grouped by relationship class.

Examples:

- Supporting evidence
- Counterevidence
- Primary sources
- Related investigations
- Earlier context
- Alternative interpretations
- Fork lineage
- Topic-adjacent knowledge

### 8.3 Relationship filters

The graph toolbar allows relationship classes to be toggled.

Recommended groups:

- Evidence
- Contradictions
- Sources
- Historical/context
- Alternative interpretations
- Forks/lineage
- Topic adjacency

The graph should show relation labels only when useful, not render text on every edge at every zoom level.

## 9. Visual hierarchy

### 9.1 Node semantics

Nodes should not all be identical circles.

Use a restrained family of semantic silhouettes or badges:

- Publication / Knowledge Space
- Claim
- Source / paper
- Government/public document
- Person
- Topic
- Trail
- Dataset
- Timeline event
- Video/media

The visual language must remain coherent and legible at small sizes.

### 9.2 Node states

Distinct states:

- current
- origin
- visited
- unexplored
- selected but not opened
- pinned
- evidence-supporting
- evidence-challenging
- hidden/filtered

### 9.3 Edge semantics

Edges encode relationship type.

Use restrained differences in stroke treatment and semantic color where justified.

Avoid a rainbow graph. Relationship meaning should be understandable through combination of:

- line treatment
- compact label on selection/hover
- legend
- semantic color only where useful

### 9.4 Evidence color discipline

Support / contradiction colors should align with Libre’s Evidence Layer.

Popularity must never determine graph color.

## 10. Motion and camera behavior

Motion should communicate topology.

When moving to a connected node:

1. highlight the selected edge
2. animate camera toward the destination
3. keep the path edge visible
4. transition main Knowledge Space content
5. update the Path Spine

No hard visual teleport.

Suggested interaction timing should feel quick and controlled rather than cinematic.

Respect `prefers-reduced-motion` by replacing animated camera travel with immediate focus while preserving all state cues.

## 11. Node interaction model

### Single click / tap

Select node and open a compact inspector.

Inspector shows:

- title
- type
- relationship to current node
- evidence state if relevant
- source/claim counts where applicable
- short summary
- actions

### Open

Loads that Knowledge Object/Space while keeping Navigator visible.

### Expand

Reveals additional connected nodes without changing the main article.

### Pin

Keeps an important node visible as the graph reflows.

### Add to Trail

Adds selected object to a new/existing Trail where permitted.

### Compare

Marks object as one side of Compare mode.

### Hide branch

Temporarily reduces visual clutter without deleting graph data.

## 12. Advanced orientation features

### 12.1 Mini-map

Atlas mode includes a small overview minimap representing the visible explored subgraph and current camera viewport.

Purpose: orientation in large exploration sessions.

### 12.2 Exploration depth meter

Show rabbit-hole depth as an informational cue, e.g.:

`Origin · 7 steps deep`

This is not a score or achievement mechanic.

### 12.3 Branch-point memory

When the user moves from a node with multiple choices, Libre records the unexplored alternatives.

A compact **Branches left behind** tray can surface them later.

This is a key anti-disorientation mechanism.

### 12.4 Exploration bookmarks

Users can pin important nodes during a session.

Pinned nodes appear in a small session shelf and stay visible on the graph.

### 12.5 Session resume

Later cloud architecture should allow a user to resume a previous rabbit-hole session with the exact explored subgraph and path restored.

Local V1 can persist this in browser storage.

## 13. Atlas mode

Atlas is the large-scale view, not the default reading experience.

Features:

- full graph canvas
- pan
- zoom
- search within current graph
- center on current
- center on origin
- fit explored graph
- relationship filters
- semantic legend
- selected-node inspector
- minimap
- path spine
- pinned nodes shelf
- branch-memory tray

Atlas should be route-backed or state-restorable so browser Back returns to the prior reading state without losing the exploration session.

## 14. Search inside the graph

Navigator search is scoped differently from Libre’s global Omnibar.

It searches:

1. currently explored nodes first
2. connected-but-not-yet-expanded nodes second
3. global Libre graph optionally third

Selecting a result animates/focuses the camera and reveals the connection path when one exists.

## 15. Graph layout strategy

A single layout algorithm is insufficient for every state.

Recommended hybrid:

- stable positions for already-explored nodes
- incremental placement for newly expanded neighbors
- limited force relaxation locally rather than re-laying out the entire graph
- pinned nodes never move
- current-path nodes receive structural priority

Critical requirement:

**Expanding one node must not cause the entire graph to scramble.**

Preserving positional stability is more important than attaining a mathematically optimal layout after every expansion.

## 16. Rendering technology recommendation

For the long-term graph renderer, prefer **Sigma.js + Graphology**.

Reasons:

- WebGL rendering suited for graph-scale growth
- built-in pan/zoom interaction model
- node and edge events
- camera control and animation
- neighbor highlighting patterns
- Graphology graph model and algorithms
- extensible rendering layers

Cytoscape.js remains a strong alternative, especially where compound-node expansion/collapse is central, but Sigma better matches Libre’s goal of highly fluid, large, visually refined exploration.

The first implementation may use the existing Libre graph data directly through an adapter rather than replacing the repository graph representation.

## 17. Graph data adapter

Do not make the UI renderer own Libre domain data.

Introduce a graph-navigation adapter that maps Libre Knowledge Objects and Relations into visualization-specific nodes/edges.

Suggested responsibilities:

- semantic node type mapping
- display labels
- evidence-state styling metadata
- edge relationship grouping
- neighborhood retrieval
- path retrieval
- ranking adjacent branches
- visited/expanded state

This preserves portability if the renderer changes later.

## 18. Branch ranking

When only a limited number of neighbors can initially be shown, rank branches using meaning rather than popularity alone.

Possible factors:

- direct source/evidence relevance
- relationship strength
- evidence quality
- user’s current exploration context
- novelty vs already-visited knowledge
- topic proximity
- primary-source status
- counterevidence value
- Trail membership

The graph should intentionally surface credible counterevidence and alternative interpretations when relevant so rabbit-hole exploration does not become a one-direction reinforcement engine.

## 19. Performance strategy

The renderer should never attempt to render Libre’s entire global graph by default.

Use:

- explored-subgraph rendering
- neighbor caps per expansion
- dynamic label density
- hide low-priority labels during camera motion
- lazy neighbor loading later when cloud-backed
- incremental graph updates
- WebGL renderer
- object/edge memoization where applicable

Large-session fallback behavior should reduce labels and minor edges before reducing core path/context.

## 20. Accessibility

The graph cannot be mouse-only.

Required alternatives:

- keyboard node traversal
- list/tree representation of the visible neighborhood
- accessible inspector
- relation labels available as text
- visible focus states
- no meaning encoded by color alone
- reduced-motion handling

The Path Spine provides a particularly important accessible fallback for spatial navigation.

## 21. Persistence

Local V1:

- store graph-navigation session in local storage
- restore current path, visited nodes, expanded nodes, pinned nodes, and panel state

Cloud phase:

- user-scoped exploration sessions
- optional named sessions
- resume across devices
- shareable Trails derived from exploration

## 22. Privacy

Exploration history can reveal sensitive interests.

Therefore future cloud persistence must:

- remain private by default
- not expose traversal sessions publicly
- provide delete/reset controls
- avoid using sensitive-interest inference beyond what the user explicitly configures

## 23. Integration with existing Libre features

### Knowledge Spaces

Navigator remains visible while switching between connected Spaces.

### Rabbit Hole

The existing Rabbit Hole action becomes a graph expansion/focus action rather than opening a disconnected modal branch picker.

### Claims and Evidence

Supporting and contradicting sources become explorable graph neighborhoods.

### Trails

Any exploration path can be converted into a Trail.

### Forks

Fork lineage is directly visible as a graph relation.

### My Algorithm

Recommendation personalization may influence branch ranking, but the graph should expose why a branch is being suggested.

### Search

Global Omnibar remains global discovery; Navigator search remains exploration-scoped.

## 24. V1 implementation scope

Implement fully:

1. persistent desktop Navigator panel
2. mobile Navigator bottom sheet
3. traversal-session state
4. origin/current/visited/expanded states
5. Path Spine
6. branch-point memory
7. one-hop progressive expansion
8. semantic node types
9. semantic edge groups
10. selected-node inspector
11. Open / Expand / Pin / Hide Branch
12. camera pan/zoom/focus
13. current-neighborhood emphasis
14. relationship filters
15. Back to origin
16. Back to branch point
17. graph-scoped search
18. Atlas expansion
19. minimap in Atlas
20. persistent local exploration session
21. accessible neighborhood list fallback
22. conversion of exploration path into a Trail-ready ordered path

## 25. Explicitly deferred from first implementation

- global graph of every Libre object simultaneously
- server-side graph analytics
- community graph editing
- collaborative real-time Atlas sessions
- semantic embedding-generated edges without explainable provenance
- arbitrary physics editing by end users
- 3D graph visualization

3D is intentionally excluded. It is visually impressive but typically reduces readability and orientation for information navigation.

## 26. Success criteria

A user can start at one investigation, traverse at least ten connected objects, change branches multiple times, and still answer immediately:

- What did I start with?
- What am I viewing now?
- How did I get here?
- What have I already visited?
- Which branches did I skip?
- How do I return to a previous branch?

The user should never need to open a new browser tab merely to preserve context.

The graph should feel like a living map of their investigation rather than a decorative network visualization.

## 27. Visual design direction

The graph should feel like a precision scientific instrument built into Libre, not neon cyberpunk.

Visual direction:

- near-black / paper-light theme compatibility
- restrained dimensional depth
- sharp anti-aliased typography
- thin neutral graph connections
- stronger semantic treatment only for evidence/support/challenge/current path
- soft focus halos for current/origin/pinned states
- highly legible labels
- smooth camera travel
- subtle parallax/depth through layers, not 3D perspective chaos
- premium compact toolbar
- no floating-glass-card clutter

The visual spectacle should come from the structure of the knowledge itself.

## 28. Verification requirements

Before completion:

- unit tests for traversal state
- unit tests for path/branch history
- unit tests for neighbor ranking/filtering
- regression test: expanded graph does not lose path on navigation
- regression test: returning to origin restores graph context
- regression test: session persists after reload
- regression test: opening a node updates both graph and main Space
- regression test: hiding a branch does not delete underlying graph data
- responsive tests for desktop/right rail and mobile/bottom sheet
- keyboard accessibility tests
- reduced-motion behavior test
- performance test with a synthetic large explored subgraph

Browser visual QA must check that the graph remains understandable at small, medium, and large exploration depths.
