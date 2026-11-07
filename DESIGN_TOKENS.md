# Design tokens — Custom Taby desktop agent

Combines **`design.md`** (Hey Taby–inspired system) with **pastel menu colours** for the expanded feature grid.

Interpretation: friendly, soft, product-led — not a corporate dark dashboard.

---

## 1. Core palette (from design.md)

| Token | Value | Use |
|-------|-------|-----|
| `--color-text` | `#171717` | Headings, body |
| `--color-text-muted` | `#686868` | Secondary labels |
| `--color-background` | `#FFFFFF` | App / overlay chrome |
| `--color-surface` | `#F7F7F5` | Panels, inset areas |
| `--color-border` | `#E9E9E6` | Hairline borders |
| `--color-accent` | `#F3B7A5` | Soft warm highlight |
| `--color-accent-strong` | `#E98F78` | Primary CTA, active icon fill |
| `--color-accent-soft` | `#FCEBE5` | Soft wash behind accents |
| `--color-dark-surface` | `#202020` | Dark chips (e.g. user bubble) |
| `--color-on-accent` | `#171717` | Text on light accent |

Expanded nav control when open:

- Four-box → **X**
- Control **filled** with `--color-accent-strong` (or near)
- Logo mark → **white** (`#FFFFFF`) on the filled control

---

## 2. Pastel row colours (expanded 2×5 menu)

**Rule:** the menu is **2 columns × 5 rows**. **Both cells in the same row share one pastel.** Colours repeat down the five rows (not per column).

**Do not use the yellow** from the marketing reference grid. Row 3 uses the **peach / soft orange** sampled from the provided swatch (`#FFE9DB`).

| Row | Left | Right | Pastel token | Hex | Notes |
|----:|------|-------|--------------|-----|--------|
| 1 | Chat | Home | `--pastel-row-1` | `#DCE6F5` | Soft blue |
| 2 | Tasks | Reminders | `--pastel-row-2` | `#FCE4EC` | Soft pink |
| 3 | Today | Focus | `--pastel-row-3` | `#FFE9DB` | Peach / orange (replaces yellow) |
| 4 | Settings | Notes | `--pastel-row-4` | `#E8F2EC` | Soft green |
| 5 | Habits | This week | `--pastel-row-5` | `#EDE7F6` | Soft lavender |

```
┌──────────────────┬──────────────────┐
│ Chat             │ Home             │  ← row-1 blue
│ Tasks            │ Reminders        │  ← row-2 pink
│ Today            │ Focus            │  ← row-3 peach
│ Settings         │ Notes            │  ← row-4 green
│ Habits           │ This week        │  ← row-5 lavender
└──────────────────┴──────────────────┘
```

### Cell styling guidance

- Background: row pastel at full token value (or 90% opacity on white).
- Hover: slightly darker (mix 8–12% of `--color-text`) or soft border `--color-border`.
- Active/selected: 1.5px border `--color-accent-strong` or stronger mix.
- Label: `--color-text`, weight 600; optional muted subtitle in `--color-text-muted`.
- Corner radius: match card language `16–20px` for the dropdown panel; cells `12–14px`.
- Gap between cells: `8–12px`.
- Panel background behind grid: `#FFFFFF` or `--color-surface`.
- Shadow on floating HUD: `0 8px 28px rgba(20, 20, 20, 0.06)`.

---

## 3. Typography

- Font stack: `"Inter", "Manrope", system-ui, "Segoe UI", sans-serif`
- HUD prompt: ~15–16px, weight 400–500
- Nav cell labels: ~14–15px, weight 600
- Module page titles: H2/H3 from design.md scale (scaled down for overlay density)

---

## 4. Shape & motion

- Overlay panel radius: `20px`
- Prompt input radius: `12–14px` or pill if matching marketing chips
- Primary send control: pill `999px` or `14px` radius
- Micro-interactions: `120–180ms`; panel open `180–240ms`; ease-out
- Honour `prefers-reduced-motion`

---

## 5. CSS starter (app + HUD)

```css
:root {
  /* Core */
  --color-text: #171717;
  --color-text-muted: #686868;
  --color-background: #ffffff;
  --color-surface: #f7f7f5;
  --color-border: #e9e9e6;
  --color-accent: #f3b7a5;
  --color-accent-strong: #e98f78;
  --color-accent-soft: #fcebe5;
  --color-dark-surface: #202020;
  --color-on-accent: #171717;

  /* Nav row pastels (2 features per colour) */
  --pastel-row-1: #dce6f5; /* Chat, Home */
  --pastel-row-2: #fce4ec; /* Tasks, Reminders */
  --pastel-row-3: #ffe9db; /* Today, Focus — peach, not yellow */
  --pastel-row-4: #e8f2ec; /* Settings, Notes */
  --pastel-row-5: #ede7f6; /* Habits, This week */

  --font-sans: "Inter", "Manrope", system-ui, "Segoe UI", sans-serif;
  --radius-card: 20px;
  --radius-cell: 14px;
  --radius-pill: 999px;
  --shadow-hud: 0 8px 28px rgba(20, 20, 20, 0.06);
}
```

---

## 6. Implementation checklist for coding agents

- [ ] Import tokens once; do not hard-code random hex in components
- [ ] Nav grid binds `rowIndex → --pastel-row-N` (both columns)
- [ ] No yellow in the feature menu
- [ ] Expanded control: filled accent-strong + white logo + X icon
- [ ] Windows `.exe` build still loads the same CSS/tokens
- [ ] Contrast: body text stays `#171717` on pastels (verify AA)

---

## 7. Reference assets (user-provided)

- Marketing-style pastel tiles (blue / pink / green / purple language) → informed rows 1,2,4,5
- Solid peach swatch → row 3 `#FFE9DB` (explicitly replaces yellow)
- Full interaction/visual rules → `design.md`
