# Design System --- Hey Taby-inspired

> A practical visual and interaction specification inspired by the
> public-facing Hey Taby website. Use this document as the design
> reference when building or restyling a website or product interface.
>
> **Interpretation note:** This is an implementation-oriented
> interpretation of the website's visible direction and content
> structure, not an official brand guideline. Where exact font files,
> colour values, or design tokens are not publicly specified, the values
> below are suggested starting points and should be tuned against the
> live site.

## 1. Design direction

### Core character

The interface should feel:

-   **Friendly and approachable:** technology should feel welcoming
    rather than intimidating.
-   **Playful, but controlled:** use warmth, personality and occasional
    whimsy without making the interface childish.
-   **Modern and product-led:** show the product doing useful things
    instead of relying on abstract marketing claims.
-   **Clear and low-friction:** explain benefits in plain language and
    make the next action obvious.
-   **Trustworthy:** communicate privacy, local processing and user
    control with calm, direct messaging.

### Visual principles

1.  Lead with one clear message and one primary action.
2.  Use generous whitespace to make sections feel calm and confident.
3.  Prefer real product UI, device mock-ups and contextual examples over
    generic stock photography.
4.  Keep copy concise, conversational and benefit-focused.
5.  Use rounded shapes and soft surfaces to create approachability.
6.  Make important actions visually obvious, but avoid making every
    element compete for attention.
7.  Alternate high-impact visual sections with quieter explanatory
    sections.

## 2. Colour system

The site should use a restrained neutral foundation with a small,
recognisable accent palette. The values below are suggested tokens;
sample and adjust them against the live website before treating them as
exact brand colours.

  -----------------------------------------------------------------------
  Token                   Suggested value         Usage
  ----------------------- ----------------------- -----------------------
  `color-text`            `#171717`               Main headings and body
                                                  text

  `color-text-muted`      `#686868`               Supporting copy,
                                                  metadata

  `color-background`      `#FFFFFF`               Main page background

  `color-surface`         `#F7F7F5`               Alternate sections and
                                                  cards

  `color-border`          `#E9E9E6`               Dividers, outlines and
                                                  subtle card borders

  `color-accent`          `#F3B7A5`               Warm highlight and
                                                  playful emphasis

  `color-accent-strong`   `#E98F78`               Primary accent actions
                                                  and active states

  `color-accent-soft`     `#FCEBE5`               Soft accent backgrounds

  `color-dark-surface`    `#202020`               Dark contrast sections
                                                  where needed

  `color-on-accent`       `#171717`               Text on light accent
                                                  backgrounds
  -----------------------------------------------------------------------

### Colour usage

-   Keep most page surfaces white or very lightly tinted.
-   Use the accent colour sparingly: primary calls to action, small
    highlights, selected states and decorative details.
-   Maintain strong text contrast. Do not use pale accent colours for
    small body text.
-   Use dark sections only when they create a clear change in rhythm or
    improve product-demo contrast.
-   Avoid gradients unless they are subtle and serve a specific visual
    purpose.

## 3. Typography

### Typeface direction

Use a contemporary sans-serif with a friendly, geometric feel. Prefer
the site's actual font if it can be identified from its loaded assets.
Otherwise use:

-   **Primary:** `Inter`, `Manrope`, or a similar modern sans-serif.
-   **Fallback:** `system-ui`, `-apple-system`, `BlinkMacSystemFont`,
    `Segoe UI`, sans-serif.

### Type scale

  Style          Suggested size     Weight   Line height
  ------------ ---------------- ---------- -------------
  Display             56--72 px   650--750    0.98--1.08
  H1                  44--56 px   650--750    1.05--1.12
  H2                  34--44 px   650--700    1.08--1.18
  H3                  22--28 px   600--700           1.2
  Body large          18--20 px   400--500           1.5
  Body                16--17 px        400     1.5--1.65
  Small               13--14 px   400--500           1.4
  Button              15--16 px        600             1

### Typography rules

-   Headlines should be short, direct and easy to scan.
-   Use tight line-height for large headings, but do not compress
    multi-line body copy.
-   Keep paragraph widths readable: approximately 55--70 characters per
    line.
-   Use sentence case rather than excessive all-caps labels.
-   Use bold weight to establish hierarchy; avoid using many different
    font weights in one section.

## 4. Layout and spacing

### Page structure

-   Use a centred content container with a maximum width around
    `1160–1280px`.
-   On wide screens, retain generous side margins rather than stretching
    text across the viewport.
-   Use a consistent 12-column grid where complex layouts are required.
-   Keep section content aligned to a common container edge.
-   Alternate between centred hero/marketing sections and left-aligned
    feature explanations.

### Spacing scale

Use a consistent 4px-based spacing system:

`4, 8, 12, 16, 24, 32, 48, 64, 80, 96, 120`

Suggested application:

-   Small control gap: `8–12px`
-   Card padding: `20–28px`
-   Related content gap: `16–24px`
-   Feature section padding: `72–96px` vertical
-   Major section separation: `96–120px` vertical

### Responsive behaviour

  -----------------------------------------------------------------------
  Breakpoint                          Guidance
  ----------------------------------- -----------------------------------
  Desktop: `1200px+`                  Full multi-column layouts, large
                                      hero typography, wide product
                                      visuals

  Tablet: `768–1199px`                Reduce outer margins, simplify
                                      grids, keep headings proportional

  Mobile: `<768px`                    Single-column sections, stacked
                                      actions, compact navigation,
                                      full-width product visuals
  -----------------------------------------------------------------------

On mobile:

-   Reduce display headings to approximately `38–46px`.
-   Keep buttons comfortably tappable (minimum 44px high).
-   Stack feature cards vertically.
-   Avoid horizontal overflow in comparison tables; use stacked
    comparison rows or a horizontally scrollable table with clear
    affordance.
-   Preserve generous vertical spacing, but reduce desktop section
    padding.

## 5. Shape, borders and elevation

### Shape language

-   Use rounded cards and controls.
-   Suggested card radius: `16–24px`.
-   Suggested button radius: `999px` for pill-shaped primary actions, or
    `12–16px` for more structured controls.
-   Suggested input radius: `10–14px`.
-   Use circular or softly rounded icon containers for small playful
    details.

### Borders and shadows

-   Prefer subtle 1px borders over heavy outlines.
-   Use soft, low-opacity shadows only to distinguish floating elements
    or elevated cards.
-   Avoid deep, dramatic shadows and excessive layered effects.
-   Cards should feel light and tactile, not like heavy dashboard
    panels.

Suggested shadow:

``` css
box-shadow: 0 8px 28px rgba(20, 20, 20, 0.06);
```

## 6. Components

### Navigation

-   Keep the header simple, compact and easy to understand.
-   Place the brand mark on the left.
-   Group primary navigation links centrally or alongside the brand,
    depending on available width.
-   Place the main conversion action on the right.
-   Use a restrained background and avoid a visually heavy navigation
    bar.
-   On mobile, collapse links into a clear menu and keep the primary
    action easy to reach.

### Buttons

**Primary button** - Accent or dark filled background. - High-contrast
label. - Pill or generously rounded shape. - Clear hover, focus, pressed
and disabled states.

**Secondary button** - Neutral surface or transparent background. -
Subtle border. - Same height and radius as the primary action.

**Text link** - Use for low-emphasis navigation and inline supporting
actions. - Provide a visible hover and keyboard-focus treatment.

Interaction guidance: - Hover: slight colour shift or subtle lift; do
not use large movement. - Active: slightly reduce elevation or scale
(`0.98`). - Focus: clear, visible focus ring. - Disabled: reduce
contrast without making the label unreadable.

### Cards

Use cards to group related features, testimonials, pricing options and
product capabilities.

-   Light surface with a subtle border or very soft shadow.
-   Consistent internal padding.
-   Clear title, short description and optional visual.
-   Keep card heights aligned within a row where practical.
-   Do not add a card background to every small piece of content;
    whitespace can provide grouping.

### Feature sections

-   Use a clear headline and a short explanatory sentence.
-   Pair copy with a product screenshot, illustration or contextual UI
    example.
-   Alternate image and text placement between sections to create visual
    rhythm.
-   On mobile, place the text before the visual unless the visual is
    essential to understanding the feature.

### Pricing and comparison

-   Make the free/local and paid/cloud distinction immediately
    understandable.
-   Use a clear heading, short explanation and prominent price.
-   Highlight the recommended or premium option without obscuring the
    alternative.
-   Use checkmarks and concise labels for feature comparisons.
-   Explain privacy and data handling in plain language near the
    comparison, not only in footnotes.

### Testimonials

-   Use short, authentic quotes.
-   Attribute each quote clearly where permission and source information
    are available.
-   Keep the treatment informal and human.
-   Use a responsive grid or horizontally browsable collection; avoid a
    dense wall of tiny text.

### FAQ

-   Use a simple accordion pattern.
-   Make the whole question row clickable.
-   Show a clear expand/collapse indicator.
-   Ensure keyboard operation and accessible expanded state.
-   Keep answers concise, with links to deeper documentation where
    appropriate.

## 7. Imagery and product presentation

### Image direction

Prioritise:

1.  Actual product screenshots.
2.  Device mock-ups showing the product in context.
3.  Small, expressive product illustrations or character imagery.
4.  Customer-created photos and community content.
5.  Photography only when it adds useful context.

### Product visuals

-   Show the interface clearly enough to understand what is happening.
-   Use realistic sample content rather than generic placeholder blocks.
-   Frame screenshots in clean device or application windows.
-   Keep backgrounds simple so the product remains the focus.
-   Avoid oversized decorative graphics that compete with the feature
    being explained.

### Brand personality

Where the product has a mascot or character:

-   Use it as a recognisable brand asset, not as decoration in every
    section.
-   Give it room to breathe.
-   Keep its expression and presentation friendly and understated.
-   Do not let character imagery reduce the perceived usefulness or
    credibility of the product.

## 8. Motion and interaction

Motion should make the interface feel responsive and alive without
distracting from the content.

Suggested patterns:

-   Buttons: quick colour and elevation transitions.
-   Cards: subtle hover lift on pointer devices.
-   Sections: restrained fade/translate entrance, used sparingly.
-   Accordions: smooth height and icon transitions.
-   Product demos: purposeful, paced interactions that show a feature
    clearly.

Suggested timing:

-   Micro-interactions: `120–180ms`
-   Menus and small panels: `180–240ms`
-   Larger transitions: `250–400ms`

Use an ease-out curve for entrances and a simple ease-in-out curve for
state changes. Respect `prefers-reduced-motion`; all essential
information and functionality must remain available without animation.

## 9. Content and voice

### Tone

-   Conversational, confident and lightly playful.
-   Explain technical concepts in everyday language.
-   Lead with what the user can do or gain.
-   Be direct about limitations, requirements and pricing.
-   Avoid inflated claims, jargon and generic AI marketing language.

### Writing patterns

Prefer: - Short headlines. - One idea per paragraph. - Specific
examples. - Clear action labels such as "Get the app" or "See how it
works". - Benefit-led feature descriptions.

Avoid: - Long blocks of marketing copy. - Vague claims such as
"revolutionary" or "game-changing". - Unexplained technical acronyms. -
Multiple competing calls to action in one small area.

## 10. Suggested landing-page information architecture

A page following this design direction can use this order:

1.  **Header:** brand, concise navigation and primary download/action.
2.  **Hero:** memorable headline, one-sentence value proposition,
    primary CTA and product visual.
3.  **Core benefits:** three or four clear reasons to care.
4.  **Feature showcase:** product-led sections explaining the main
    capabilities.
5.  **Interactive demonstration:** let visitors choose a capability and
    see it in action.
6.  **Social proof:** customer comments, community photos or
    testimonials.
7.  **Business or specialist use case:** a separate section for a
    secondary audience.
8.  **Pricing/comparison:** explain the available tiers and what each
    includes.
9.  **FAQ:** resolve common objections and practical questions.
10. **Footer:** product links, support, social channels, legal pages and
    secondary actions.

This structure is a reference, not a mandatory template. Remove sections
that do not serve the product.

## 11. Accessibility and implementation requirements

-   Meet WCAG 2.2 AA contrast targets wherever possible.
-   Use semantic headings in a logical hierarchy.
-   Provide descriptive alt text for meaningful images; use empty alt
    text for purely decorative imagery.
-   Ensure every interactive element works with a keyboard.
-   Make focus states clearly visible.
-   Do not communicate state using colour alone.
-   Give form controls persistent labels and useful error messages.
-   Use reduced-motion preferences.
-   Optimise images and avoid layout shifts by reserving image
    dimensions.
-   Keep tap targets at least 44 × 44px where practical.

## 12. CSS token starter

``` css
:root {
  /* Colour */
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

  /* Typography */
  --font-sans: "Inter", "Manrope", system-ui, sans-serif;
  --text-body: 1rem;
  --text-small: 0.875rem;

  /* Layout */
  --container-width: 1200px;
  --page-gutter: clamp(20px, 5vw, 72px);

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;

  /* Shape and elevation */
  --radius-control: 14px;
  --radius-card: 20px;
  --radius-pill: 999px;
  --shadow-card: 0 8px 28px rgba(20, 20, 20, 0.06);
}
```

## 13. Final design checklist

Before considering an implementation complete, verify:

-   [ ] The first screen communicates what the product is and why it
    matters.
-   [ ] There is one obvious primary action.
-   [ ] Typography is clear, friendly and consistently scaled.
-   [ ] Whitespace and alignment are consistent between sections.
-   [ ] Accent colour is used deliberately rather than everywhere.
-   [ ] Product visuals show real, understandable use cases.
-   [ ] Cards, buttons and controls share a consistent shape language.
-   [ ] Mobile layouts are intentionally designed, not merely
    compressed.
-   [ ] Hover, focus, active and disabled states are implemented.
-   [ ] Motion is subtle and respects reduced-motion preferences.
-   [ ] Privacy, pricing and technical requirements are explained
    plainly.
-   [ ] Accessibility and contrast have been checked.

------------------------------------------------------------------------

**Implementation priority:** establish typography, spacing, page width,
button styles and the neutral/accent colour balance first. These choices
create most of the overall visual identity; decorative details should
come afterwards.
