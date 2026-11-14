# Spendly — Design

## Architecture
Spendly is a single-page application built with plain HTML, CSS, and vanilla JavaScript. It uses Chart.js (loaded via CDN) for the pie chart and the browser's Local Storage API for data persistence. There is no backend or build step.

## File Structure
- `index.html` — Semantic HTML structure with all UI sections.
- `css/style.css` — Single stylesheet with CSS custom properties, responsive grid layouts, and hover effects.
- `js/script.js` — Single script handling state, localStorage, rendering, form validation, and chart updates.

## Data Model
Each transaction is stored as a JSON object:

```
{
  id: string,       // unique identifier (crypto.randomUUID or fallback)
  name: string,     // item name
  amount: number,   // positive number in IDR
  category: string, // "Food" | "Transport" | "Fun"
  date: string      // YYYY-MM-DD
}
```

## Color Palette
- Background: Dark navy (#0a0f1e, #131c31)
- Text: White (#f8fafc) and gray (#94a3b8)
- Primary accent: Emerald green (#10b981)
- Category colors: Food = emerald, Transport = blue, Fun = amber

## Layout
- Header with brand logo and tagline.
- Stats grid: three stat cards (total spending, total transactions, this month).
- Main grid: add transaction form (left) and pie chart (right).
- Transaction history: full-width list with delete buttons.
- Responsive: stacks to single column on tablet and mobile.

## Key Design Decisions
- Event delegation for delete buttons to avoid re-attaching listeners on each render.
- Date parsed as local time to avoid timezone-related month mismatch.
- HTML escaping on user input to prevent XSS.
- Chart empty-state overlay toggled via display property; canvas remains in DOM.
- `color-scheme: dark` on body for native form control styling.
- `novalidate` on form; all validation handled in JavaScript for consistent feedback.
