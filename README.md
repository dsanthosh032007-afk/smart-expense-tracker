# 💰 Smart Expense Tracker - College Mini-Project

A clean, responsive, and fully functional personal finance web application built using **pure HTML, CSS, and Vanilla JavaScript (ES6)**. It utilizes the browser's native **HTML5 Web Storage API (`localStorage`)** for permanent data persistence with zero backend, database, paid APIs, or login dependencies.

---

## 🌟 Key Features

1. **Modern & Attractive Dashboard**: Designed with a clean FinTech visual aesthetic, cohesive color palette, elevation shadows, and micro-interactions.
2. **Real-time Financial Computation**:
   - **Total Balance** (automatically updates with a Surplus/Deficit status badge)
   - **Total Income**
   - **Total Expenses**
   - **Savings Rate Percentage** (proportion of income retained)
3. **Transaction Management Form**:
   - Title / Description
   - Positive Amount validation (with decimal support)
   - Type Switcher (Income vs Expense)
   - Dynamic Category selector based on type
   - Date picker (defaults to current date)
4. **Transaction History Table**:
   - Displays Date, Title, Category badge with color dot, Type indicator, Amount (+ for income, - for expense), and Action button.
   - Fully responsive: smooth horizontal scrolling on mobile viewports.
5. **Delete & Clear Data**:
   - Individual deletion with a modal confirmation dialog.
   - "Clear All" button to wipe stored data.
   - "Load Demo" button to instantly restore sample transactions anytime.
6. **Live Search & Multi-Filters**:
   - Instant search across transaction titles and categories.
   - Filter by Type (All / Expenses / Income).
   - Filter by Category dropdown.
   - Sort by Date (Newest/Oldest) or Amount (High to Low / Low to High).
   - One-click "Reset Filters" action.
7. **Spending Summary Breakdown**:
   - Visual progress bars showing percentage share of each expense category.
   - Highlighting the top spending category.
8. **3 Sample Demo Transactions**:
   - Pre-seeded on the very first launch so the user sees data immediately.
9. **Bonus College Project Feature**:
   - **Export to CSV**: Click a button to download all transactions as a spreadsheet file (`.csv`).
   - **Multi-Currency Support**: Switch seamlessly between `₹` (INR), `$` (USD), `€` (EUR), and `£` (GBP).
10. **Responsive Design**:
    - Mobile, tablet, and desktop friendly layout using modern CSS Grid and Flexbox.

---

## 📁 Project Structure

```text
smart-expense-tracker/
├── index.html        # Semantic HTML5 markup, dashboard layout, and modal structures
├── style.css         # Modern styling, CSS custom properties (variables), responsiveness
├── script.js         # ES6 Vanilla JS logic, calculations, localStorage, and DOM rendering
└── README.md         # Documentation, run instructions, and Viva Q&A
```

---

## 🚀 How to Run the Project

No installation, build tools, node packages, or servers are needed!

### Method 1: Double-Click (Quickest)
1. Open the project folder: `c:\Users\THARUN\Downloads\santhosh projects`
2. Double-click **`index.html`** or right-click and select **Open with > Google Chrome** (or Edge, Firefox, Brave, Safari).
3. The application will immediately launch in your browser with the 3 sample transactions loaded.

### Method 2: VS Code Live Server (Optional)
1. Open the folder in **VS Code**.
2. Right-click `index.html` and click **"Open with Live Server"**.
3. It will open at `http://127.0.0.1:5500/index.html`.

---

## 🎓 College Viva / Technical Q&A Guide

Common questions examiners and professors ask during a mini-project evaluation:

### 1. Where and how is the data stored?
> **Answer**: The application uses **HTML5 `localStorage`**. It stores data as key-value pairs (`smart_expense_tracker_items_v1`) as a JSON string using `JSON.stringify(transactions)`. On page reload, it reads data using `localStorage.getItem()` and parses it back into a JavaScript array using `JSON.parse()`.

### 2. How are the totals (Income, Expense, Balance) computed?
> **Answer**: In `script.js`, the `calculateFinancials()` function iterates through the `transactions` array. It sums the amounts categorized as `'income'` and `'expense'`, calculates `balance = totalIncome - totalExpense`, and computes the savings rate as `(balance / income) * 100`.

### 3. How does the real-time search and filter work?
> **Answer**: The `getFilteredAndSortedTransactions()` function chains standard JavaScript array methods:
> - `.filter()` to verify if the search query matches the title or category, and checks selected type and category filters.
> - `.sort()` to arrange records based on timestamp (`new Date(date)`) or numeric amount.
> The filtered array is then rendered to the DOM without altering the master `transactions` array.

### 4. How is form validation handled?
> **Answer**: The `validateForm()` function ensures:
> - Title is non-empty and has at least 3 characters.
> - Amount is numeric, positive, and greater than zero.
> - Category is selected.
> - Date is provided.
> If any condition fails, appropriate inline error messages and highlight classes (`.input-error`) are shown, and submission is prevented via `e.preventDefault()`.

---

## 💻 Tech Stack Summary

- **HTML5**: Semantic tags (`<header>`, `<main>`, `<section>`, `<aside>`, `<table>`, `<form>`).
- **CSS3**: CSS Custom Properties (Variables), Flexbox, CSS Grid, Media Queries, Micro-animations.
- **JavaScript**: ES6 (Arrow functions, Template Literals, Destructuring, Event Listeners, Array `reduce`/`filter`/`map`, `localStorage`).
