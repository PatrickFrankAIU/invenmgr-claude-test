# Inventory Manager - Project Guide

## Project Overview
A vanilla JavaScript web app for managing inventory, used as a student starter template in the Digital Crafts Full-Stack Web Development program. Instructor: Patrick Frank (pfrank@aiuniv.edu).

Users can track inventory items by category, record incoming shipments, and log outgoing orders. Everything runs client-side in the browser with localStorage persistence.

## Tech Stack
- **HTML5 / CSS3 / Vanilla JS (ES6)** — no frameworks, no dependencies
- **localStorage** for data persistence
- **CSS custom properties** for theming (dark/light mode)

## File Structure
```
index.html   — Main HTML structure (form, display sections, dark mode toggle)
main.js      — All application logic (~360 lines)
main.css     — Styling with dark/light theme support (~213 lines)
README.md    — Student-facing overview and suggested extensions
```

## Architecture
- Single-page app, no backend
- Direct DOM manipulation with `createElement()`/`textContent` (no innerHTML — XSS-safe)
- Event-driven: listeners on buttons, category dropdown, theme toggle
- Data stored as arrays of objects in localStorage

### Data Model
```javascript
inventory = [{ category: "Fruits", products: [{ product: "Apples", quantity: 10 }] }]
shipments = [{ category, product, quantity, date }]  // timestamped log
orders    = [{ category, product, quantity, date }]   // timestamped log
```

## Key Patterns & Conventions
- **XSS prevention:** Always use `createElement()`/`textContent`, never `innerHTML` for user data
- **Input validation:** Validate all inputs before processing (empty strings, duplicates, stock levels)
- **DRY helpers:** Shared functions for form extraction (`getFormInputs`), validation (`validateBaseInputs`), and log display (`displayLog`)
- **User feedback:** Non-blocking message banner (`showMessage`) instead of `alert()`
- **Comments:** Feature comments are prefixed with `Claude:` to indicate AI-assisted additions

## Completed Features
- Add/remove inventory via shipments and orders
- Create categories and products dynamically
- Timestamped shipment and order logs with clear history
- Stock validation (can't order more than available)
- Dark/light mode toggle with persistence
- Message banner for success/error feedback
- Visual highlight animations on transactions
- localStorage persistence with default sample data

## Development History
The project evolved from a bare starter template through several phases:

1. **Initial template** — Basic vanilla JS inventory manager
2. **Security** — Fixed XSS vulnerability (switched to `createElement`/`textContent`)
3. **Validation** — Added input validation for all user actions (+ bugfix for broken `addNewCategory`)
4. **Persistence** — Added localStorage for inventory, shipments, and orders
5. **UI polish** — Visual highlight animations on transactions, dark mode with toggle switch
6. **Feature additions** — Timestamped shipment/order logs, product creation within categories
7. **Code quality** — Replaced `alert()` with message banner, refactored duplicated code (DRY)
8. **Layout & UX** — Separated category/product controls into boxed section, clear history buttons

All changes were made with Claude AI assistance (co-authored commits).

## Coding Style
- **Naming:** camelCase for variables and functions
- **Variable names:** Should reflect their contents and role (e.g., `categoryList` not `cl`, `selectedProduct` not `item`)

## Current Priorities
_(update this section with what to work on next)_

## Things to Avoid
- Don't add external libraries — keep it dependency-free vanilla JS
- Keep code beginner-friendly — this is a student learning project

## Testing Approach
_(to be defined)_

## Suggested Extensions (from README)
These are student exercises, roughly ordered by difficulty:

### Low Difficulty
- Show total quantity of all items
- Color-coded categories
- Responsive/mobile layout

### Medium Difficulty
- Sort by name, category, or quantity
- Filter inventory by category
- Search box to find items
- Price per item and total value calculation

### High Difficulty
- CSV import/export
- Undo/redo functionality
- Advanced UI enhancements
