---
name: taste-design
description: Elevate frontend design quality and eliminate AI slop by applying strict visual pacing, typography hierarchy, cohesive color palettes, and motion polish.
---

# Taste Design Skill (Anti-AI Slop Directive)

When generating, modifying, or reviewing web user interfaces, you MUST avoid generic, template-driven "AI slop" and adhere to high-taste art direction principles.

## Core Anti-Slop Rules

1. **Banish AI Purple & Muted Pastels:**
   - Never default to generic purple-pink gradients or muddy pastel cards.
   - Use curated, intentional color schemes with clear contrast ratios and purposeful accent colors.

2. **Visual Pacing & Breathing Room:**
   - Space elements using an intentional scale (e.g. 8pt grid: 8px, 16px, 24px, 32px, 48px, 64px).
   - Give headings and major sections room to breathe. Never crowd the viewport with excessive border dividers or cramped cards.

3. **Typography Discipline:**
   - Pair an expressive, legible Sans-serif font (Inter, Geist, Satoshi) with a clean Monospace font (JetBrains Mono, Roboto Mono) for data, code, prices, and timestamps.
   - Maintain a crisp type scale: Hero (36-48px), Section H2 (24-30px), Card Title (16-18px), Body (14px), Micro metadata (11-12px).
   - Avoid more than 2 font families on a single screen.

4. **Surface & Depth Hierarchy:**
   - Distinguish background, midground, and foreground surfaces clearly.
   - Use subtle ambient glows (`rgba(..., 0.12)`) and multi-layer box shadows rather than harsh 1px black drop-shadows.
   - Utilize translucent glassmorphism (`backdrop-blur-md`) with thin border highlights (`border border-white/10`).

5. **Micro-Interactions & Polish:**
   - Interactive elements must provide immediate, delightful feedback on hover, active, and focus states.
   - Use `active:scale-[0.98]` or `active:scale-95` on action buttons for physical tactile response.
   - Avoid `transition: all`. Target specific properties (`transition-colors`, `transition-transform`) with standard durations (150ms-250ms).

6. **Self-Verification Checklist:**
   Before finalizing any UI component:
   - Does this feel like a generic AI template? (If yes, rework the layout).
   - Are the numbers, prices, and badges formatted with high precision?
   - Is there visual rhythm and delight?
