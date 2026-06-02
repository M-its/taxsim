---
name: interface-design
description: Enforce high-quality UI/UX standards. Prevents generic AI-generated interfaces. Use during frontend development phases.
---

## Rules

Before writing any frontend code, establish:

1. **Visual identity** — confirm active color palette, typography scale and spacing tokens from `tailwind.config` and `globals.css`
2. **Component source** — use existing Shadcn/ui components before creating custom ones
3. **Layout pattern** — confirm the page layout (sidebar, topbar, content width) matches existing pages

## Hard prohibitions

Never generate:
- Generic dashboard with placeholder charts labeled "Chart 1"
- Blue gradient hero sections
- Card grids with identical Lorem Ipsum content
- Centered spinners as the only loading state
- Form layouts copied from generic SaaS templates

## TaxSim visual standards

- Palette: Zinc (desaturated grays) as defined in `globals.css`
- Typography: clean, no decorative fonts
- Data display: Recharts for all tax comparison charts
- Animations: Framer Motion for route transitions only — no gratuitous motion
- Tone: enterprise SaaS (Vercel/Linear aesthetic), not startup landing page

## Before generating any component

Ask:
1. Does a Shadcn/ui component already cover this?
2. Does this match the Figma design provided by the user?
3. Is the data shown in this component coming from a real API endpoint defined in `API_CONTRACTS.md`?

If the answer to question 3 is no, do not generate the component yet.
