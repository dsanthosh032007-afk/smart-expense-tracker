/**
 * ============================================================================
 * Smart Expense Tracker - Client-side College Mini Project
 * ============================================================================
 * Technology: HTML5, CSS3, Vanilla JavaScript (ES6)
 * Storage: HTML5 Web Storage API (localStorage)
 * 
 * Features:
 * - Dynamic income, expense, and balance computation
 * - Form validation with error states
 * - Real-time category filtering, text search, and multi-field sorting
 * - Category spending breakdown visualization
 * - Seed demo data on initial launch
 * - Reset and demo restore capability
 * - CSV export functionality
 * - Multiple currency support (₹ INR, $ USD, € EUR, £ GBP)
 * ============================================================================
 */

// Strict Mode for cleaner, safer code execution
'use strict';

/* --------------------------------------------------------------------------
   1. CONSTANTS & CATEGORY DEFINITIONS
   -------------------------------------------------------------------------- */
const STORAGE_KEY = 'smart_expense_tracker_items_v1';
const CURRENCY_KEY = 'smart_expense_tracker_currency_v1';

// Pre-defined categories for each transaction type
const CATEGORIES = {
  expense: [
    'Food & Dining',
    'College & Education',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Health & Medical',
    'Bills & Utilities',
    'Hostel & Rent',
    'Other Expense'
  ],
  income: [
    'Allowance / Pocket Money',
    'Salary / Part-time Job',
    'Freelancing',
    'Scholarship / Grant',
    'Gifts & Rewards',
    'Other Income'
  ]
};

// Category accent colors for the spending summary visualization
const CATEGORY_COLORS = {
  'Food & Dining': '#f97316',
  'College & Education': '#3b82f6',
  'Transportation': '#8b5cf6',
  'Shopping': '#ec4899',
  'Entertainment': '#eab308',
  'Health & Medical': '#14b8a6',
  'Bills & Utilities': '#64748b',
  'Hostel & Rent': '#0284c7',
  'Other Expense': '#94a3b8',
  'Allowance / Pocket Money': '#10b981',
  'Salary / Part-time Job': '#059669',
  'Freelancing': '#0d9488',
  'Scholarship / Grant': '#2563eb',
  'Gifts & Rewards': '#d97706',
  'Other Income': '#64748b'
};

/* --------------------------------------------------------------------------
   2. SAMPLE INITIAL TRANSACTIONS (Loaded on First-Time Launch)
   -------------------------------------------------------------------------- */
function getTodayIsoDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() - offsetDays);
  return date.toISOString().split('T')[0];
}

const DEFAULT_SAMPLE_TRANSACTIONS = [
  {
    id: 'tx_sample_1',
    title: 'Monthly College Allowance',
    amount: 15000,
    type: 'income',
    category: 'Allowance / Pocket Money',
    date: getTodayIsoDate(5)
  },
  {
    id: 'tx_sample_2',
    title: 'Semester Reference Textbooks',
    amount: 1850,
    type: 'expense',
    category: 'College & Education',
    date: getTodayIsoDate(2)
  },
  {
    id: 'tx_sample_3',
    title: 'Cafeteria Lunch & Snacks',
    amount: 420,
    type: 'expense',
    category: 'Food & Dining',
    date: getTodayIsoDate(0)
  }
];

/* --------------------------------------------------------------------------
   3. APPLICATION STATE
   -------------------------------------------------------------------------- */
let transactions = [];
let activeCurrency = '₹';
let pendingDeleteId = null; // For modal confirmation

// Filter and Search State
const filterState = {
  searchQuery: '',
  type: 'all',          // 'all' | 'expense' | 'income'
  category: 'all',      // 'all' | specific category name
  sortBy: 'date-desc'   // 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'
};

/* --------------------------------------------------------------------------
   4. DOM ELEMENT REFERENCES
   -------------------------------------------------------------------------- */
const el = {
  // KPIs
  totalBalance: document.getElementById('totalBalance'),
  balanceStatusBadge: document.getElementById('balanceStatusBadge'),
  savingsRateText: document.getElementById('savingsRateText'),
  totalIncome: document.getElementById('totalIncome'),
  incomeCountText: document.getElementById('incomeCountText'),
  totalExpense: document.getElementById('totalExpense'),
  expenseCountText: document.getElementById('expenseCountText'),
  totalTransactions: document.getElementById('totalTransactions'),
  topCategorySummary: document.getElementById('topCategorySummary'),

  // Currency Select
  currencySelect: document.getElementById('currencySelect'),
  currencyLabelsDynamic: document.querySelectorAll('.currency-label-dynamic'),

  // Header Actions
  btnLoadDemo: document.getElementById('btnLoadDemo'),
  btnClearAll: document.getElementById('btnClearAll'),

  // Form elements
  form: document.getElementById('transactionForm'),
  typeExpenseBtn: document.getElementById('typeExpenseBtn'),
  typeIncomeBtn: document.getElementById('typeIncomeBtn'),
  transactionType: document.getElementById('transactionType'),
  transactionTitle: document.getElementById('transactionTitle'),
  transactionAmount: document.getElementById('transactionAmount'),
  transactionCategory: document.getElementById('transactionCategory'),
  transactionDate: document.getElementById('transactionDate'),
  
  // Inline error message elements
  titleError: document.getElementById('titleError'),
  amountError: document.getElementById('amountError'),
  categoryError: document.getElementById('categoryError'),
  dateError: document.getElementById('dateError'),

  // Summary list
  spendingSummaryList: document.getElementById('spendingSummaryList'),

  // Filter toolbar elements
  searchTransactions: document.getElementById('searchTransactions'),
  btnClearSearch: document.getElementById('btnClearSearch'),
  typeFilterButtons: document.querySelectorAll('[data-type-filter]'),
  filterCategory: document.getElementById('filterCategory'),
  sortBy: document.getElementById('sortBy'),
  activeFilterNotice: document.getElementById('activeFilterNotice'),
  filterNoticeText: document.getElementById('filterNoticeText'),
  btnResetFilters: document.getElementById('btnResetFilters'),

  // Table and empty state
  transactionListBody: document.getElementById('transactionListBody'),
  emptyState: document.getElementById('emptyState'),
  emptyStateTitle: document.getElementById('emptyStateTitle'),
  emptyStateDesc: document.getElementById('emptyStateDesc'),
  filteredItemsCount: document.getElementById('filteredItemsCount'),
  filteredSumLabel: document.getElementById('filteredSumLabel'),
  btnExportCsv: document.getElementById('btnExportCsv'),

  // Toast container & Modal
  toastContainer: document.getElementById('toastContainer'),
  confirmModal: document.getElementById('confirmModal'),
  modalTitle: document.getElementById('modalTitle'),
  modalMessage: document.getElementById('modalMessage'),
  modalBtnCancel: document.getElementById('modalBtnCancel'),
  modalBtnConfirm: document.getElementById('modalBtnConfirm')
};

/* --------------------------------------------------------------------------
   5. LOCALSTORAGE HELPERS
   -------------------------------------------------------------------------- */
/**
 * Loads transactions from localStorage.
 * If running for the first time, seeds with DEFAULT_SAMPLE_TRANSACTIONS.
 */
function loadTransactionsFromStorage() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      // First time launch: save & return 3 sample transactions
      saveTransactionsToStorage(DEFAULT_SAMPLE_TRANSACTIONS);
      return [...DEFAULT_SAMPLE_TRANSACTIONS];
    }
    const parsed = JSON.parse(rawData);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading localStorage:', error);
    showToast('Failed to read saved data. Resetting to defaults.', 'danger');
    return [...DEFAULT_SAMPLE_TRANSACTIONS];
  }
}

/**
 * Persists transactions array to localStorage as a JSON string.
 */
function saveTransactionsToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    showToast('Error saving data. Storage might be full.', 'danger');
  }
}

/**
 * Loads preferred currency from localStorage.
 */
function loadCurrencyFromStorage() {
  const savedCurrency = localStorage.getItem(CURRENCY_KEY);
  if (savedCurrency) {
    activeCurrency = savedCurrency;
    el.currencySelect.value = savedCurrency;
  } else {
    activeCurrency = '₹';
    el.currencySelect.value = '₹';
  }
  updateCurrencySymbolLabels();
}

/**
 * Saves selected currency to localStorage.
 */
function saveCurrencyToStorage(symbol) {
  activeCurrency = symbol;
  localStorage.setItem(CURRENCY_KEY, symbol);
  updateCurrencySymbolLabels();
}

function updateCurrencySymbolLabels() {
  el.currencyLabelsDynamic.forEach(lbl => {
    lbl.textContent = activeCurrency;
  });
}

/* --------------------------------------------------------------------------
   6. FORMATTING HELPERS
   -------------------------------------------------------------------------- */
/**
 * Formats a numeric value into a readable currency string (e.g. ₹1,850.00).
 */
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return activeCurrency + num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Formats ISO YYYY-MM-DD date into friendly readable format (e.g., Oct 22, 2026).
 */
function formatDate(isoDateString) {
  if (!isoDateString) return '-';
  const parts = isoDateString.split('-');
  if (parts.length !== 3) return isoDateString;
  
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  if (isNaN(dateObj.getTime())) return isoDateString;

  return dateObj.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/* --------------------------------------------------------------------------
   7. FORM HANDLING & VALIDATION
   -------------------------------------------------------------------------- */
/**
 * Populates the transaction form category dropdown based on type (expense / income).
 */
function populateFormCategories(type) {
  const categories = CATEGORIES[type] || [];
  el.transactionCategory.innerHTML = '';
  
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    el.transactionCategory.appendChild(opt);
  });
}

/**
 * Sets the active transaction type (expense or income) on the form.
 */
function setFormTransactionType(type) {
  el.transactionType.value = type;
  
  if (type === 'expense') {
    el.typeExpenseBtn.classList.add('active');
    el.typeIncomeBtn.classList.remove('active');
  } else {
    el.typeIncomeBtn.classList.add('active');
    el.typeExpenseBtn.classList.remove('active');
  }

  populateFormCategories(type);
}

/**
 * Clears any validation error messages on form inputs.
 */
function clearValidationErrors() {
  [el.transactionTitle, el.transactionAmount, el.transactionCategory, el.transactionDate].forEach(input => {
    if (input) input.classList.remove('input-error');
  });
  if (el.titleError) el.titleError.textContent = '';
  if (el.amountError) el.amountError.textContent = '';
  if (el.categoryError) el.categoryError.textContent = '';
  if (el.dateError) el.dateError.textContent = '';
}

/**
 * Validates transaction form inputs.
 * Returns true if valid, false if invalid.
 */
function validateForm() {
  clearValidationErrors();
  let isValid = true;

  // Title validation
  const title = el.transactionTitle.value.trim();
  if (!title) {
    el.transactionTitle.classList.add('input-error');
    el.titleError.textContent = 'Please enter a description or title.';
    isValid = false;
  } else if (title.length < 3) {
    el.transactionTitle.classList.add('input-error');
    el.titleError.textContent = 'Title must be at least 3 characters.';
    isValid = false;
  }

  // Amount validation
  const amountVal = parseFloat(el.transactionAmount.value);
  if (isNaN(amountVal) || amountVal <= 0) {
    el.transactionAmount.classList.add('input-error');
    el.amountError.textContent = 'Please enter a valid amount greater than 0.';
    isValid = false;
  } else if (amountVal > 100000000) {
    el.transactionAmount.classList.add('input-error');
    el.amountError.textContent = 'Amount exceeds maximum permitted limit.';
    isValid = false;
  }

  // Category validation
  const category = el.transactionCategory.value;
  if (!category) {
    el.transactionCategory.classList.add('input-error');
    el.categoryError.textContent = 'Please choose a category.';
    isValid = false;
  }

  // Date validation
  const dateVal = el.transactionDate.value;
  if (!dateVal) {
    el.transactionDate.classList.add('input-error');
    el.dateError.textContent = 'Please select a valid date.';
    isValid = false;
  }

  return isValid;
}

/**
 * Handles form submission: validates, creates transaction object, saves and re-renders.
 */
function handleAddTransaction(e) {
  e.preventDefault();

  if (!validateForm()) {
    showToast('Please fix the errors in the form.', 'danger');
    return;
  }

  const newTx = {
    id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    title: el.transactionTitle.value.trim(),
    amount: parseFloat(parseFloat(el.transactionAmount.value).toFixed(2)),
    type: el.transactionType.value,
    category: el.transactionCategory.value,
    date: el.transactionDate.value
  };

  // Add to beginning of array
  transactions.unshift(newTx);
  saveTransactionsToStorage(transactions);

  // Re-render UI
  renderAll();

  // Reset form inputs (preserve date as today for quick subsequent entries)
  el.transactionTitle.value = '';
  el.transactionAmount.value = '';
  clearValidationErrors();
  el.transactionTitle.focus();

  showToast(`Added ${newTx.type === 'income' ? 'Income' : 'Expense'}: "${newTx.title}"`, 'success');
}

/* --------------------------------------------------------------------------
   8. CALCULATIONS (TOTALS & SPENDING BREAKDOWN)
   -------------------------------------------------------------------------- */
/**
 * Calculates total income, expenses, balance, and transaction counts.
 */
function calculateFinancials() {
  let income = 0;
  let incomeCount = 0;
  let expense = 0;
  let expenseCount = 0;

  transactions.forEach(tx => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') {
      income += amt;
      incomeCount++;
    } else {
      expense += amt;
      expenseCount++;
    }
  });

  const balance = income - expense;
  
  // Calculate savings rate (% of income retained)
  let savingsRate = 0;
  if (income > 0) {
    savingsRate = Math.max(0, ((balance / income) * 100)).toFixed(1);
  }

  return {
    totalIncome: income,
    incomeCount,
    totalExpense: expense,
    expenseCount,
    balance,
    savingsRate,
    totalCount: transactions.length
  };
}

/**
 * Calculates total expenses per category and returns sorted descending.
 */
function calculateCategoryBreakdown() {
  const breakdown = {};
  let totalExpense = 0;

  transactions.forEach(tx => {
    if (tx.type === 'expense') {
      const amt = Number(tx.amount) || 0;
      totalExpense += amt;
      breakdown[tx.category] = (breakdown[tx.category] || 0) + amt;
    }
  });

  // Convert to array of objects
  const result = Object.keys(breakdown).map(cat => {
    const amount = breakdown[cat];
    const percentage = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0;
    return {
      category: cat,
      amount,
      percentage: parseFloat(percentage),
      color: CATEGORY_COLORS[cat] || '#6366f1'
    };
  });

  // Sort highest spending first
  result.sort((a, b) => b.amount - a.amount);

  return {
    categories: result,
    totalExpense
  };
}

/* --------------------------------------------------------------------------
   9. RENDERING METHODS
   -------------------------------------------------------------------------- */
/**
 * Updates KPI Summary Cards at the top of the dashboard.
 */
function renderKpiCards() {
  const data = calculateFinancials();

  // Balance Card
  el.totalBalance.textContent = formatCurrency(data.balance);
  
  if (data.balance > 0) {
    el.balanceStatusBadge.textContent = 'Surplus';
    el.balanceStatusBadge.className = 'status-badge badge-surplus';
  } else if (data.balance < 0) {
    el.balanceStatusBadge.textContent = 'Deficit';
    el.balanceStatusBadge.className = 'status-badge badge-deficit';
  } else {
    el.balanceStatusBadge.textContent = 'Neutral';
    el.balanceStatusBadge.className = 'status-badge badge-neutral';
  }

  el.savingsRateText.textContent = `Savings Rate: ${data.savingsRate}% of income`;

  // Income Card
  el.totalIncome.textContent = formatCurrency(data.totalIncome);
  el.incomeCountText.textContent = `${data.incomeCount} transaction${data.incomeCount === 1 ? '' : 's'}`;

  // Expense Card
  el.totalExpense.textContent = formatCurrency(data.totalExpense);
  el.expenseCountText.textContent = `${data.expenseCount} transaction${data.expenseCount === 1 ? '' : 's'}`;

  // Count & Top Category Card
  el.totalTransactions.textContent = data.totalCount;

  const breakdown = calculateCategoryBreakdown();
  if (breakdown.categories.length > 0) {
    const topCat = breakdown.categories[0];
    el.topCategorySummary.textContent = `Top: ${topCat.category} (${topCat.percentage}%)`;
  } else {
    el.topCategorySummary.textContent = 'Top: None recorded';
  }
}

/**
 * Renders the Spending Summary (progress bars for each expense category).
 */
function renderSpendingSummary() {
  const { categories, totalExpense } = calculateCategoryBreakdown();
  el.spendingSummaryList.innerHTML = '';

  if (categories.length === 0) {
    el.spendingSummaryList.innerHTML = `
      <div class="no-expense-notice">
        <p>No expenses recorded yet.</p>
        <span style="font-size: 0.75rem; color: var(--text-muted);">Add an expense to view category distribution.</span>
      </div>
    `;
    return;
  }

  categories.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'category-bar-item';
    itemEl.innerHTML = `
      <div class="cat-bar-header">
        <span class="cat-bar-title">
          <span class="cat-bar-color-dot" style="background-color: ${item.color};"></span>
          ${escapeHtml(item.category)}
        </span>
        <span class="cat-bar-values">
          ${formatCurrency(item.amount)} 
          <span style="font-size: 0.72rem; font-weight: 500; color: var(--text-muted);">(${item.percentage}%)</span>
        </span>
      </div>
      <div class="cat-bar-track">
        <div class="cat-bar-fill" style="width: ${item.percentage}%; background-color: ${item.color};"></div>
      </div>
    `;
    el.spendingSummaryList.appendChild(itemEl);
  });
}

/**
 * Populates the category filter dropdown dynamically with all distinct categories present.
 */
function renderFilterCategoryDropdown() {
  const currentSelected = el.filterCategory.value;
  
  // Combine all standard categories plus any custom in transactions
  const allCategorySet = new Set([
    ...CATEGORIES.expense,
    ...CATEGORIES.income
  ]);

  // Keep existing selection if valid
  el.filterCategory.innerHTML = '<option value="all">All Categories</option>';
  
  Array.from(allCategorySet).sort().forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    if (cat === currentSelected) {
      opt.selected = true;
    }
    el.filterCategory.appendChild(opt);
  });
}

/**
 * Filters and sorts transactions according to user criteria.
 */
function getFilteredAndSortedTransactions() {
  const query = filterState.searchQuery.trim().toLowerCase();
  
  return transactions.filter(tx => {
    // 1. Text Search Filter (matches title or category)
    if (query) {
      const matchTitle = tx.title.toLowerCase().includes(query);
      const matchCategory = tx.category.toLowerCase().includes(query);
      if (!matchTitle && !matchCategory) {
        return false;
      }
    }

    // 2. Type Filter (all, expense, income)
    if (filterState.type !== 'all' && tx.type !== filterState.type) {
      return false;
    }

    // 3. Category Filter
    if (filterState.category !== 'all' && tx.category !== filterState.category) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    // 4. Sorting logic
    switch (filterState.sortBy) {
      case 'date-asc':
        return new Date(a.date) - new Date(b.date);
      case 'amount-desc':
        return b.amount - a.amount;
      case 'amount-asc':
        return a.amount - b.amount;
      case 'date-desc':
      default:
        return new Date(b.date) - new Date(a.date);
    }
  });
}

/**
 * Renders the transaction history table and updates filter indicators.
 */
function renderTransactionTable() {
  const filtered = getFilteredAndSortedTransactions();
  el.transactionListBody.innerHTML = '';

  // Update Active Filter Notice UI
  const hasActiveFilters = Boolean(
    filterState.searchQuery || 
    filterState.type !== 'all' || 
    filterState.category !== 'all'
  );

  if (hasActiveFilters) {
    el.activeFilterNotice.style.display = 'flex';
    const parts = [];
    if (filterState.searchQuery) parts.push(`"${filterState.searchQuery}"`);
    if (filterState.type !== 'all') parts.push(`type: ${filterState.type}`);
    if (filterState.category !== 'all') parts.push(`category: ${filterState.category}`);
    el.filterNoticeText.textContent = `Filtered by: ${parts.join(', ')}`;
  } else {
    el.activeFilterNotice.style.display = 'none';
  }

  // Handle Empty State
  if (filtered.length === 0) {
    el.emptyState.style.display = 'block';
    if (transactions.length === 0) {
      el.emptyStateTitle.textContent = 'No Transactions Yet';
      el.emptyStateDesc.textContent = 'Add your first income or expense transaction using the form on the left, or click "Load Demo" above.';
    } else {
      el.emptyStateTitle.textContent = 'No Matching Transactions';
      el.emptyStateDesc.textContent = 'No records matched your search query or filters. Click "Reset Filters" to show all.';
    }
  } else {
    el.emptyState.style.display = 'none';
  }

  // Render Rows
  filtered.forEach(tx => {
    const isIncome = tx.type === 'income';
    const row = document.createElement('tr');
    row.id = `row_${tx.id}`;

    row.innerHTML = `
      <td class="td-date">${formatDate(tx.date)}</td>
      <td class="td-title">${escapeHtml(tx.title)}</td>
      <td class="td-category">
        <span class="category-tag">
          <span class="cat-bar-color-dot" style="background-color: ${CATEGORY_COLORS[tx.category] || '#6366f1'};"></span>
          ${escapeHtml(tx.category)}
        </span>
      </td>
      <td class="td-type">
        <span class="badge-type ${isIncome ? 'badge-income' : 'badge-expense'}">
          ${isIncome ? 'Income' : 'Expense'}
        </span>
      </td>
      <td class="td-amount text-right ${isIncome ? 'amount-income' : 'amount-expense'}">
        ${isIncome ? '+' : '-'}${formatCurrency(tx.amount)}
      </td>
      <td class="td-actions text-center">
        <button 
          type="button" 
          class="btn-icon-delete" 
          data-id="${tx.id}" 
          title="Delete Transaction"
          aria-label="Delete transaction ${escapeHtml(tx.title)}"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </td>
    `;

    el.transactionListBody.appendChild(row);
  });

  // Update Footer Count & Total
  el.filteredItemsCount.textContent = `Showing ${filtered.length} of ${transactions.length} transaction${transactions.length === 1 ? '' : 's'}`;
  
  if (filtered.length > 0) {
    const netFiltered = filtered.reduce((acc, cur) => {
      return cur.type === 'income' ? acc + cur.amount : acc - cur.amount;
    }, 0);
    el.filteredSumLabel.textContent = `Net in View: ${netFiltered >= 0 ? '+' : ''}${formatCurrency(netFiltered)}`;
  } else {
    el.filteredSumLabel.textContent = '';
  }
}

/**
 * Re-renders all UI modules.
 */
function renderAll() {
  renderKpiCards();
  renderSpendingSummary();
  renderFilterCategoryDropdown();
  renderTransactionTable();
}

/* --------------------------------------------------------------------------
   10. TRANSACTION DELETION & MODAL
   -------------------------------------------------------------------------- */
/**
 * Opens delete confirmation modal for a specific transaction or all data.
 */
function promptDeleteTransaction(id) {
  const item = transactions.find(t => t.id === id);
  if (!item) return;

  pendingDeleteId = id;
  el.modalTitle.textContent = 'Delete Transaction';
  el.modalMessage.textContent = `Are you sure you want to delete "${item.title}" (${formatCurrency(item.amount)})? This action cannot be undone.`;
  el.modalBtnConfirm.textContent = 'Delete';
  el.confirmModal.style.display = 'flex';
}

function promptClearAllData() {
  if (transactions.length === 0) {
    showToast('There are no transactions to clear.', 'info');
    return;
  }

  pendingDeleteId = 'CLEAR_ALL';
  el.modalTitle.textContent = 'Clear All Transactions';
  el.modalMessage.textContent = 'Are you sure you want to delete all recorded transactions? This will erase everything from localStorage.';
  el.modalBtnConfirm.textContent = 'Clear All';
  el.confirmModal.style.display = 'flex';
}

function closeModal() {
  pendingDeleteId = null;
  el.confirmModal.style.display = 'none';
}

function executeConfirmedAction() {
  if (pendingDeleteId === 'CLEAR_ALL') {
    transactions = [];
    saveTransactionsToStorage(transactions);
    renderAll();
    closeModal();
    showToast('All transaction records have been cleared.', 'danger');
    return;
  }

  if (pendingDeleteId) {
    const deletedIndex = transactions.findIndex(t => t.id === pendingDeleteId);
    if (deletedIndex !== -1) {
      const deletedTitle = transactions[deletedIndex].title;
      transactions.splice(deletedIndex, 1);
      saveTransactionsToStorage(transactions);
      renderAll();
      showToast(`Deleted "${deletedTitle}"`, 'info');
    }
    closeModal();
  }
}

/**
 * Restores the 3 standard demo sample transactions.
 */
function loadDemoTransactions() {
  transactions = [
    {
      id: 'tx_sample_1_' + Date.now(),
      title: 'Monthly College Allowance',
      amount: 15000,
      type: 'income',
      category: 'Allowance / Pocket Money',
      date: getTodayIsoDate(5)
    },
    {
      id: 'tx_sample_2_' + Date.now(),
      title: 'Semester Reference Textbooks',
      amount: 1850,
      type: 'expense',
      category: 'College & Education',
      date: getTodayIsoDate(2)
    },
    {
      id: 'tx_sample_3_' + Date.now(),
      title: 'Cafeteria Lunch & Snacks',
      amount: 420,
      type: 'expense',
      category: 'Food & Dining',
      date: getTodayIsoDate(0)
    }
  ];

  saveTransactionsToStorage(transactions);
  resetFilters();
  renderAll();
  showToast('Sample demo transactions loaded successfully!', 'success');
}

/* --------------------------------------------------------------------------
   11. SEARCH & FILTER HANDLERS
   -------------------------------------------------------------------------- */
function resetFilters() {
  filterState.searchQuery = '';
  filterState.type = 'all';
  filterState.category = 'all';
  filterState.sortBy = 'date-desc';

  el.searchTransactions.value = '';
  el.btnClearSearch.style.display = 'none';
  el.filterCategory.value = 'all';
  el.sortBy.value = 'date-desc';

  el.typeFilterButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.typeFilter === 'all');
  });

  renderTransactionTable();
}

/* --------------------------------------------------------------------------
   12. EXPORT TO CSV (BONUS COLLEGE MINI-PROJECT FEATURE)
   -------------------------------------------------------------------------- */
function exportTransactionsToCsv() {
  if (transactions.length === 0) {
    showToast('No transaction data available to export.', 'info');
    return;
  }

  const headers = ['ID', 'Date', 'Title', 'Type', 'Category', 'Amount', 'Currency'];
  const rows = transactions.map(t => [
    `"${t.id}"`,
    `"${t.date}"`,
    `"${t.title.replace(/"/g, '""')}"`,
    `"${t.type}"`,
    `"${t.category.replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    `"${activeCurrency}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `smart_expenses_${getTodayIsoDate()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Transactions exported to CSV successfully!', 'success');
}

/* --------------------------------------------------------------------------
   13. TOAST NOTIFICATIONS
   -------------------------------------------------------------------------- */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  el.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 2800);
}

/* --------------------------------------------------------------------------
   14. SECURITY & UTILITY
   -------------------------------------------------------------------------- */
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* --------------------------------------------------------------------------
   15. EVENT LISTENERS INITIALIZATION
   -------------------------------------------------------------------------- */
function setupEventListeners() {
  // 1. Transaction Type Toggle Buttons
  el.typeExpenseBtn.addEventListener('click', () => setFormTransactionType('expense'));
  el.typeIncomeBtn.addEventListener('click', () => setFormTransactionType('income'));

  // 2. Form Submission
  el.form.addEventListener('submit', handleAddTransaction);

  // 3. Real-time form input error clearance
  el.transactionTitle.addEventListener('input', () => {
    if (el.transactionTitle.classList.contains('input-error')) {
      el.transactionTitle.classList.remove('input-error');
      el.titleError.textContent = '';
    }
  });

  el.transactionAmount.addEventListener('input', () => {
    if (el.transactionAmount.classList.contains('input-error')) {
      el.transactionAmount.classList.remove('input-error');
      el.amountError.textContent = '';
    }
  });

  // 4. Currency change
  el.currencySelect.addEventListener('change', (e) => {
    saveCurrencyToStorage(e.target.value);
    renderAll();
    showToast(`Currency updated to ${e.target.value}`, 'info');
  });

  // 5. Demo and Clear All Buttons
  el.btnLoadDemo.addEventListener('click', loadDemoTransactions);
  el.btnClearAll.addEventListener('click', promptClearAllData);

  // 6. Search Input
  el.searchTransactions.addEventListener('input', (e) => {
    filterState.searchQuery = e.target.value;
    el.btnClearSearch.style.display = e.target.value ? 'block' : 'none';
    renderTransactionTable();
  });

  el.btnClearSearch.addEventListener('click', () => {
    el.searchTransactions.value = '';
    filterState.searchQuery = '';
    el.btnClearSearch.style.display = 'none';
    renderTransactionTable();
    el.searchTransactions.focus();
  });

  // 7. Type Filter Segmented Control
  el.typeFilterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      el.typeFilterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterState.type = btn.dataset.typeFilter;
      renderTransactionTable();
    });
  });

  // 8. Category Filter Dropdown
  el.filterCategory.addEventListener('change', (e) => {
    filterState.category = e.target.value;
    renderTransactionTable();
  });

  // 9. Sort By Dropdown
  el.sortBy.addEventListener('change', (e) => {
    filterState.sortBy = e.target.value;
    renderTransactionTable();
  });

  // 10. Reset Filters Button
  el.btnResetFilters.addEventListener('click', resetFilters);

  // 11. Transaction Table Action Delegation (Delete button click)
  el.transactionListBody.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.btn-icon-delete');
    if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-id');
      if (id) {
        promptDeleteTransaction(id);
      }
    }
  });

  // 12. Modal Buttons
  el.modalBtnCancel.addEventListener('click', closeModal);
  el.modalBtnConfirm.addEventListener('click', executeConfirmedAction);
  el.confirmModal.addEventListener('click', (e) => {
    if (e.target === el.confirmModal) closeModal();
  });

  // 13. CSV Export Button
  el.btnExportCsv.addEventListener('click', exportTransactionsToCsv);
}

/* --------------------------------------------------------------------------
   16. APPLICATION BOOTSTRAP
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Set default date input value to today
  el.transactionDate.value = getTodayIsoDate(0);
  el.transactionDate.max = getTodayIsoDate(-365); // allow up to future year or today

  // Initialize Currency
  loadCurrencyFromStorage();

  // Populate initial categories for default type ('expense')
  populateFormCategories('expense');

  // Load Transactions (will seed demo if first time)
  transactions = loadTransactionsFromStorage();

  // Attach all listeners
  setupEventListeners();

  // Initial Full Render
  renderAll();
});
