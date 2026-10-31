---
name: image-to-code
description: Transform screenshot mockups, UI designs, and reference images into pixel-precise, responsive React and Tailwind CSS components following an Image-First workflow.
---

# Image-to-Code Skill

When converting UI reference images or screenshots into production code, follow this disciplined multi-step visual decomposition process.

## Step 1: Visual Structural Breakdown

Before writing code, analyze the reference image across 4 dimensions:
1. **Layout Architecture:** Is it a 12-column grid, flexbox distribution, asymmetric hero, or sticky sidebar layout?
2. **Color Palette Extraction:** Identify exact hex values for:
   - Deep background
   - Surface card colors
   - Border tones & opacity
   - Accent & CTA gradient stops
3. **Typography Mapping:**
   - Measure font-size relationships (Hero vs Section vs Metadata).
   - Identify font-family weights (Normal, Semibold, Black).
   - Note letter-spacing (`tracking-tight` vs `tracking-wider`).
4. **Spacing Rhythm:** Measure paddings inside cards and margins between major sections.

## Step 2: Anti-Cliché Layout Rules

* **Block Card Over-Nesting:** Never put cards inside cards inside cards unless explicitly shown in the design.
* **Keep Hero Clean:** Hero sections must remain uncluttered and legible on 1366x768 laptop displays without excessive vertical scrolling before the primary CTA.
* **Maintain Aspect Ratios:** Product badges, logos, and avatars must retain exact aspect ratios (`aspect-video`, `aspect-square`, `object-contain`).

## Step 3: Progressive Sectional Synthesis

1. **Extract Global Tokens:** Ensure colors, shadows, and fonts match `DESIGN.md`.
2. **Build Base Atoms:** Inputs, buttons, badges, pill tags.
3. **Compose Molecules:** Product cards, navigation items, pricing rows.
4. **Assemble Organisms:** Complete hero banners, product catalogs, checkout modals.
5. **Responsive Verification:** Ensure mobile (`<640px`), tablet (`768px-1024px`), and desktop (`>1024px`) breakpoints scale naturally without text truncation or horizontal overflow.
