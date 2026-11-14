# Spendly — Requirements

## Overview
Spendly is a client-side Expense & Budget Visualizer web application that helps users track their spending in Indonesian Rupiah (IDR).

## Functional Requirements

### Dashboard
- Display total spending across all transactions in IDR.
- Display the total number of transactions.
- Display the current month's total spending.

### Add Transaction Form
- Inputs: Item Name (text), Amount (number), Category (dropdown: Food, Transport, Fun), Date (date).
- All fields are required.
- Amount must be greater than zero; zero and negative values are rejected.
- Show success or error feedback after submission.

### Transaction History
- Display each transaction's name, amount, category, and date.
- Allow deleting individual transactions.
- Show a friendly empty state when no transactions exist.

### Pie Chart
- Use Chart.js (via CDN) to display spending distribution across Food, Transport, and Fun.
- Automatically update when transactions are added or deleted.
- Handle empty data gracefully without errors.

### Local Storage
- Persist all transactions in localStorage.
- Load saved transactions on page refresh.
- Update localStorage after every add or delete operation.

## Non-Functional Requirements
- Modern fintech dashboard design with dark navy, white, and emerald green palette.
- Clean typography, rounded cards, subtle hover effects.
- Responsive on desktop and mobile.
- Single CSS file and single JavaScript file.
- Semantic HTML.
- Compatible with GitHub Pages using relative file paths.
- No frameworks, no backend.
