---
name: LiveDock
description: Self-hosted server monitoring dashboard — signal over chrome, calm confidence, botanical precision.
colors:
  slate-950: "#020617"
  slate-900: "#0f172a"
  slate-800: "#1e293b"
  slate-700: "#334155"
  slate-500: "#64748b"
  slate-400: "#94a3b8"
  slate-300: "#cbd5e1"
  slate-200: "#e2e8f0"
  slate-100: "#f1f5f9"
  slate-50: "#f8fafc"
  emerald-500: "#10b981"
  emerald-600: "#059669"
  teal-400: "#2dd4bf"
  teal-500: "#14b8a6"
  teal-600: "#0d9488"
  cyan-600: "#0891b2"
  amber-300: "#fcd34d"
  amber-500: "#f59e0b"
  red-300: "#fca5a5"
  red-400: "#f87171"
  red-500: "#ef4444"
  blue-400: "#60a5fa"
  surface-background: "#f8fafc"
  surface-card: "#ffffff"
  surface-card-subtle: "#f8fafc"
  surface-popover: "#ffffff"
typography:
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, ''Segoe UI'', system-ui, Inter, Roboto, ''Helvetica Neue'', sans-serif'
    fontSize: 14px
    fontWeight: 400
  label:
    fontFamily: '-apple-system, BlinkMacSystemFont, ''Segoe UI'', system-ui, Inter, Roboto, ''Helvetica Neue'', sans-serif'
    fontSize: 13px
    fontWeight: 600
  mono:
    fontFamily: 'ui-monospace, SFMono-Regular, ''JetBrains Mono'', ''Fira Code'', Menlo, Monaco, Consolas, monospace'
    fontSize: 12px
    fontWeight: 400
rounded:
  sm: 6px
  md: 8px
  lg: 10px
  xl: 14px
spacing:
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  5: 20px
  6: 24px
  8: 32px
  10: 40px
  12: 48px
components:
  badge-neutral:
    backgroundColor: "{colors.slate-100}"
    textColor: "{colors.slate-700}"
    rounded: "{rounded.md}"
    padding: "2px 8px"
    size: "12px"
  badge-success:
    backgroundColor: "rgb(16 185 129 / 0.10)"
    textColor: "{colors.emerald-600}"
    rounded: "{rounded.md}"
    padding: "2px 8px"
  nav-link:
    textColor: "{colors.slate-700}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "36px"
  nav-link-active:
    textColor: "oklch(0.99 0.005 180)"
    backgroundColor: linear-gradient(135deg, var(--emerald-500), var(--teal-500) 50%, var(--cyan-600))
    rounded: "{rounded.lg}"
---

# Design System: LiveDock

## 1. Overview: The Signal Deck

**Creative North Star: "The Signal Deck"**

LiveDock is a ship's bridge in miniature. Every surface element carries signal or stays out of the way. The interface is dense enough to diagnose a problem in seconds, calm enough to glance at for hours. It rejects the Grafana model of infinite panels, nested menus, and configuration sprawl. It also rejects the generic Bootstrap admin look — banded table rows, card-grid sameness, "template" feeling.

The aesthetic is botanical precision: cool slate neutrals with an emerald-teal-cyan accent that feels alive without shouting. Dark and light themes are equal citizens — neither is an afterthought. The dark theme is meant for 2am incident response in a dim room; the light theme for daytime ops under office fluorescents.

**Key Characteristics:**
- Signal-dense, not information-dense. Empty space is earned.
- Predictable layout — elements never move or surprise on refresh.
- Tactile interactions: hover lifts, focus rings are visible, active states are instant.
- Flat elevation by default. Shadows appear only for popovers and dropdowns (4-12px blur).

## 2. Colors: The Botanical Precision Palette

A restrained palette anchored in cool slate neutrals, with a single emerald-teal-cyan accent that carries 5-10% of any given surface. Semantic colors (amber for warning, red for danger, blue for info) appear only when the data demands them.

### Primary
- **Emerald Signal** (`#10b981`, `--emerald-500`): The single accent. Used in the brand gradient, active nav items, status dots (running), chart fills, and the "Add host" CTA. Never decorative — every use marks an interactive element or live signal.
- **Brand Gradient** (`linear-gradient(135deg, var(--emerald-500), var(--teal-500) 50%, var(--cyan-600))`): Used exclusively on active navigation links and primary CTAs. Provides a subtle temperature shift from warm green to cool cyan.

### Neutral
- **Deep Slate** (`#020617` to `#f8fafc`): A full 10-stop slate scale. Backgrounds use the extremes (50/950), cards use white/slate-900, borders use 100/800, muted text uses 400-500.
- **Tinted White** (`#ffffff`, `var(--color-card)`): Card surfaces in light mode. Pure white with no tint — contrast is provided by the surrounding slate background.
- **Slate Glass** (`rgba(15, 23, 42, 0.5)`, dark card-subtle): A semi-transparent dark surface for layered header rows in dark mode.

### Semantic
- **Amber Warning** (`#f59e0b`): Degraded containers, warning badges. Chroma is reined in on dark backgrounds (amber-300).
- **Red Danger** (`#ef4444`): Stop buttons, error states, destructive actions.
- **Blue Info** (`#3b82f6`): Informational badges, secondary data highlights.

### Named Rules
**The One Voice Rule.** The emerald accent appears on ≤10% of any given screen. Its rarity is the point — if everything is green, nothing is a signal.

**The Slate Bed Rule.** All neutrals live in the slate hue (approx 210-220°). No pure grays. No warm grays. The cool cast is intentional and consistent across both themes.

## 3. Typography

**Body Font:** System sans stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, Inter, Roboto, 'Helvetica Neue', sans-serif`)
**Mono Font:** System mono stack (`ui-monospace, SFMono-Regular, 'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace`)

**Character:** The sans stack prioritizes platform-native rendering speed (no web font download) while maintaining a neutral, technical personality. The mono stack is used for metrics, port numbers, URLs, and container images — anything the user reads as data, not prose.

### Hierarchy
- **H1** (700, 32px, 1.2): Page titles and dashboard headers.
- **H2** (700, 22px, 1.3): Section titles, empty state headlines.
- **H3** (600, 16px, 1.4): Card titles, button text, modal headers.
- **Body** (400, 14px, 1.5): Primary content, descriptions, list items. Capped at 65-75ch where possible.
- **Label** (600, 13px, 1.4): Form labels, sort headers, filter chips, nav items.
- **Small** (400, 12px, 1.4): Secondary metadata, timestamps, chart labels.
- **Caption** (400, 11px, letter-spacing 0.06em, uppercase): Section overlines, host label caps, column headers.

### Named Rules
**The Mono-for-Data Rule.** Any number, metric, URL, or identifier that the user reads as data (not prose) must use the mono stack. This includes CPU percentages, memory bytes, port numbers, container IDs, image names, and host URLs.

## 4. Elevation: Flat Terrain

Flat by default. The baseline surface is a single plane — cards, inputs, and content areas sit directly on the background with no shadow, separated only by 1px slate borders (`var(--color-border)`).

Shadows exist in three tiers, used exclusively for elements that must float above the page:
- **Ambient** (`0 1px 2px 0 rgb(0 0 0 / 0.04)`): Subtle lift for hover states on interactive cards.
- **Medium** (`0 4px 12px -2px rgb(0 0 0 / 0.06)`): Popovers, tooltips, dropdown menus.
- **Large** (`0 12px 32px -8px rgb(0 0 0 / 0.10)`): Modals, drawers, toast notifications.

In dark mode, shadow opacities increase (0.4, 0.5, 0.6) to maintain visible depth against dark backgrounds.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only as a response to state (hover, popover, modal). A card or container that casts a shadow while idle is wrong.

## 5. Components

### Badges
Nature: dense, compact indicators for status, count, and category.
- **Shape:** Rounded 8px (`--radius-md`), solid or tinted background with optional 1px border.
- **Neutral:** Slate background (`--slate-100` dark / `--slate-800` light), muted foreground.
- **Success:** Emerald tint at 10% opacity, emerald-600 text, emerald 30%-opacity border.
- **Warning:** Amber tint, amber text (b45309 light / amber-300 dark).
- **Danger:** Red tint, red text (b91c1c light / red-300 dark).
- **Size:** md (12px, 2px 8px) or sm (11px, 1px 6px).

### Navigation Links
Nature: pill-shaped route indicators in the app header.
- **Shape:** Fully rounded (`--radius-lg`), 36px tall, 0 12px padding.
- **Default:** Slate-700 text (light), slate-300 (dark). Transparent background.
- **Hover:** Slate-100 background (light), slate-800 (dark).
- **Active:** The brand gradient background with near-white text, plus an emerald box-shadow.

### Buttons (Primary CTA)
Nature: confident action triggers for the single most important action on screen.
- **Shape:** Rounded 10px (`--radius-lg`), 44px tall (empty state) or 36px (inline).
- **Background:** Brand gradient (`linear-gradient(135deg, var(--emerald-500), var(--teal-500) 50%, var(--cyan-600))`).
- **Text:** White, 600 weight, 13px (h3 scale).
- **Shadow:** `0 8px 24px -10px rgba(16, 185, 129, 0.45)` — a green-tinted glow.
- **Hover:** Opacity 0.92.
- **Disabled:** Opacity 0.4, cursor not-allowed.
- **Focus:** 2px ring (`--color-ring`), 2px offset.

### Ghost Buttons
Nature: secondary actions that don't compete with the primary CTA.
- **Shape:** Same radius and height as primary.
- **Background:** Transparent, 1px border (`--color-border`).
- **Text:** Current foreground color, 600 weight.
- **Hover:** Background shifts to accent (`--color-accent`).

### Inputs
Nature: search bars and form fields.
- **Shape:** Rounded 10px (`--radius-lg`), 36-40px tall, full width.
- **Background:** White (light) / slate-950 (dark).
- **Border:** 1px slate-200 (light) / slate-700 (dark).
- **Placeholder:** Subtle foreground (`--color-subtle-foreground`).
- **Focus:** Emerald-500 border, `0 0 0 3px rgb(16 185 129 / 0.20)` glow.

### Chips (Filter Pills)
Nature: rounded-pill filter toggles in the containers panel.
- **Shape:** 999px radius, 32px tall, 0 8px padding.
- **Default:** Slate accent background, muted foreground.
- **Active:** Emerald accent background (`--color-accent-bg`), emerald-500 text, emerald 30%-opacity border.
- **Hover:** Color shifts toward foreground.

### Skeleton Loaders
Nature: shimmering placeholder rectangles for async content.
- **Animation:** 1.8s ease-in-out shimmer cycling through slate-tinted luminance (light: oklch 87%→94%, dark: oklch 25%→32%).
- **Respects** `prefers-reduced-motion` — animation disabled.
- **Shape:** Matches the component it replaces — bar height, card padding, grid layout.

### Empty State
Nature: centered, quiet placeholder when no data exists.
- **Layout:** Flex column, center-aligned, generous vertical padding (`--space-8`).
- **Icon:** 2rem, 0.4 opacity, muted foreground.
- **Title:** 15px, 600 weight, foreground color.
- **Description:** 13px, muted foreground, max-width 32ch.

## 6. Do's and Don'ts

Quoting PRODUCT.md anti-references verbatim where they apply.

### Do:
- **Do** use the brand gradient exclusively for the single most important action on screen.
- **Do** use the mono stack for any number, metric, URL, or identifier.
- **Do** keep spacing generous at the section level (20-32px gaps) while keeping internal density tight (4-12px).
- **Do** let empty states earn their screen space. A centered "No containers" with 48px of breathing room is better than a cramped inline message.
- **Do** respect `prefers-reduced-motion`. Skeleton shimmers, view transitions, and hover animations all disable.
- **Do** use the full 10-stop slate scale. Tinted neutrals only — no pure grays, no warm grays.

### Don't:
- **Don't** use the emerald accent decoratively. If it's not marking an interactive element or a live signal, remove it.
- **Don't** use Grafana-style infinite panels, nested menus, or configuration overload.
- **Don't** use generic Bootstrap patterns: banded table rows, card-grid sameness, "template" feeling.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored stripe on cards or list items.
- **Don't** use `background-clip: text` with a gradient. Emphasis comes from weight or size.
- **Don't** use glassmorphism or blurs decoratively. Flat terrain by default.
- **Don't** use hero-metric templates (big number, small label, supporting stats, gradient accent) as a repeated pattern.
- **Don't** nest cards inside cards. A card is an outer container.
- **Don't** let elements move or change position on refresh. The layout must be predictable.
