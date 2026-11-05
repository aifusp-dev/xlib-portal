---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/components/Sidebar.tsx","src/app/docs/[plugin]/page.tsx"]
---

## Scope

Public wiki surface: `src/app/page.tsx` (home/index), `src/components/Sidebar.tsx` (global nav), `src/app/docs/[plugin]/page.tsx` (plugin doc pages). Operate mode. Studio (`src/app/studio/*` and its editors) is explicitly out of scope — separate future pass.

## Audience, job, action/task, proof/content, constraints

aifusp, developer of the xLib plugin ecosystem (xLib + 15 interdependent Minecraft plugins), consulting commands/permissions/config/API while coding or supporting players. Roadmap: other plugin developers will read the same wiki and eventually publish their own content here, with staff moderation. Primary task: find the right command/endpoint/config key fast. Content: structured docs (headings, command tables, code blocks, cross-plugin dependency info). Constraint: must keep the 2026-11-05 accessibility floor (AA contrast, header/footer landmarks, visible keyboard focus, 24px touch targets).

## Chosen direction and memorable moment

Schematic Wiring — the wiki reads as an engineering blueprint of the plugin ecosystem. The memorable moment: on a plugin's doc page, a thin orthogonal wire trace visibly connects it to xLib (and to any other plugin it depends on), the same drafting-table line language used throughout the UI for borders, dividers, and the active-nav indicator.

## Unresolved decisions

Exact trace-routing implementation for the dependency diagram (SVG hand-routed vs. a small component that lays out elbows programmatically) is left to build time; both are acceptable if the elbow/orthogonal character survives.

## Direction contract

THESIS: This is the wiring diagram of the aifusp.dev plugin ecosystem, not another soft SaaS-docs theme — it refuses the generic GitBook/Docusaurus look (rounded cards, drop shadows, gray-on-white or gray-on-near-black with a single decorative accent) by making every dependency relationship a literally visible trace, not a prose mention.

OWN-WORLD: Deep blueprint-navy ground (#0a2240-range, distinct from today's near-black slate), a very faint drafting grid behind content, off-white/cyan-tinted ink for text (not pure white), one signal cyan (~#5ec8ff) for links/active state/trace lines, semantic reds/ambers/greens reserved strictly for state (error/warn/ok), hairline 1px strokes instead of soft shadows, sharp-to-minimal corner radii (drafting precision, not soft rounded-xl cards), system sans (Inter, kept) for prose, system mono for IDs/commands/version tags (already the convention, kept — no new font import).

STORY: A developer lands on the index, immediately reads it as a systems diagram of the ecosystem (not a marketing page), finds their plugin, and on its doc page sees at a glance what it plugs into before reading a single paragraph.

FIRST VIEWPORT: Sidebar unchanged in position/behavior (still the fast nav, now in hairline/blueprint language) · hero drops the old card-grid-of-equal-weight home and replaces it with a compact systems-overview: the ecosystem drawn as a small node diagram (xLib at the center, dependent plugins as connected nodes, grouped by category) above or beside the existing category list, so the dependency structure is the first thing proven, not claimed · primary actions (start with xLib / browse all) stay close to the top.

FORM: Pick card (my top-ranked grounded candidate, not the engine's assigned index), confirmed by the user over "Cuaderno de crafteo" (assigned) and "Veta de mineral" (challenger). seed: 7db6c149fe88466d

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
