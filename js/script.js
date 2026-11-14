'use strict';

/* ====================================================
   SPENDLY — Expense & Budget Visualizer
   Single JavaScript file using Chart.js (CDN) and the
   browser Local Storage API.
   ==================================================== */

/* ====================================================
   CONSTANTS
   ==================================================== */
const STORAGE_KEY = 'spendly_transactions';
const CATEGORIES = ['Food', 'Transport', 'Fun'];
const CATEGORY_COLORS = {
  Food: '#10b981',
  Transport: '#3b82f6',
  Fun: '#f59e0b'
};

/* ====================================================
   STATE
   ==================================================== */
let transactions = [];
let pieChart = null;
let feedbackTimer = null;

/* ====================================================
   UTILITY FUNCTIONS
   ==================================================== */

/** Format a number as Indonesian Rupiah. */
function formatIDR(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/** Parse a YYYY-MM-DD date string as a local Date (avoids timezone drift). */
function parseDate(dateStr) {
  const parts = dateStr.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

/** Format a date string for human-readable display. */
function formatDate(dateStr) {
  return parseDate(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/** Generate a unique identifier. */
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
}

/** Escape HTML special characters to prevent XSS. */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** Calculate the total amount for each category. */
function getCategoryTotals() {
  const totals = { Food: 0, Transport: 0, Fun: 0 };
  transactions.forEach(function (t) {
    if (Object.prototype.hasOwnProperty.call(totals, t.category)) {
      totals[t.category] += t.amount;
    }
  });
  return totals;
}

/** Calculate the total spending for the current calendar month. */
function getCurrentMonthSpending() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  return transactions
    .filter(function (t) {
      const date = parseDate(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce(function (sum, t) { return sum + t.amount; }, 0);
}

/* ====================================================
   LOCAL STORAGE
   ==================================================== */

/** Load transactions from localStorage. Returns an array (possibly empty). */
function loadTransactions() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Spendly: could not load transactions from localStorage:', err);
    return [];
  }
}

/** Persist the current transactions array to localStorage. */
function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Spendly: could not save transactions to localStorage:', err);
  }
}

/* ====================================================
   CRUD OPERATIONS
   ==================================================== */

/** Add a new transaction to the front of the list and refresh the UI. */
function addTransaction(transaction) {
  transactions.unshift(transaction);
  saveTransactions();
  updateUI();
}

/** Remove a transaction by ID and refresh the UI. */
function deleteTransaction(id) {
  transactions = transactions.filter(function (t) { return t.id !== id; });
  saveTransactions();
  updateUI();
}

/* ====================================================
   RENDERING
   ==================================================== */

/** Re-render all dynamic UI elements. */
function updateUI() {
  renderDashboard();
  renderTransactionHistory();
  renderChart();
}

/** Update the three dashboard stat cards. */
function renderDashboard() {
  const totalSpending = transactions.reduce(function (sum, t) { return sum + t.amount; }, 0);
  document.getElementById('total-spending').textContent = formatIDR(totalSpending);
  document.getElementById('total-transactions').textContent = transactions.length;
  document.getElementById('month-spending').textContent = formatIDR(getCurrentMonthSpending());
}

/** Render the transaction history list (or the empty state). */
function renderTransactionHistory() {
  const list = document.getElementById('transaction-list');

  if (transactions.length === 0) {
    list.innerHTML =
      '<div class="empty-state">' +
        '<span class="empty-icon">📭</span>' +
        '<p class="empty-title">No transactions yet</p>' +
        '<p class="empty-subtitle">Add your first expense using the form above</p>' +
      '</div>';
    return;
  }

  list.innerHTML = transactions.map(function (t) {
    return (
      '<div class="transaction-item">' +
        '<div class="transaction-info">' +
          '<span class="transaction-name">' + escapeHtml(t.name) + '</span>' +
          '<div class="transaction-meta">' +
            '<span class="transaction-category category-' + t.category.toLowerCase() + '">' + t.category + '</span>' +
            '<span class="transaction-date">' + formatDate(t.date) + '</span>' +
          '</div>' +
        '</div>' +
        '<span class="transaction-amount">' + formatIDR(t.amount) + '</span>' +
        '<button class="delete-btn" data-id="' + t.id + '" aria-label="Delete transaction" title="Delete">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<polyline points="3 6 5 6 21 6"></polyline>' +
            '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>' +
          '</svg>' +
        '</button>' +
      '</div>'
    );
  }).join('');
}

/** Create or update the pie chart, toggling the empty-state overlay. */
function renderChart() {
  if (typeof Chart === 'undefined') {
    console.error('Spendly: Chart.js is not loaded — chart will not render');
    return;
  }

  const totals = getCategoryTotals();
  const hasData = CATEGORIES.some(function (c) { return totals[c] > 0; });

  /* Toggle the empty-state overlay */
  const emptyEl = document.getElementById('chart-empty');
  if (emptyEl) {
    emptyEl.style.display = hasData ? 'none' : 'flex';
  }

  if (!pieChart) {
    const ctx = document.getElementById('pie-chart').getContext('2d');
    pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: CATEGORIES,
        datasets: [{
          data: CATEGORIES.map(function (c) { return totals[c]; }),
          backgroundColor: CATEGORIES.map(function (c) { return CATEGORY_COLORS[c]; }),
          borderWidth: 3,
          borderColor: '#131c31',
          hoverBorderWidth: 4,
          hoverBorderColor: '#1e293b'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#cbd5e1',
              font: { size: 13, family: "'Inter', sans-serif" },
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                return ' ' + context.label + ': ' + formatIDR(context.parsed);
              }
            }
          }
        }
      }
    });
  } else {
    pieChart.data.datasets[0].data = CATEGORIES.map(function (c) { return totals[c]; });
    pieChart.update();
  }
}

/* ====================================================
   FORM HANDLING
   ==================================================== */

/** Show a feedback message below the form (auto-hides after 3s). */
function showFeedback(message, type) {
  const feedback = document.getElementById('form-feedback');
  feedback.textContent = message;
  feedback.className = 'form-feedback ' + type;
  feedback.style.display = 'block';

  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(function () {
    feedback.style.display = 'none';
  }, 3000);
}

/** Validate the form data. Returns { valid, message }. */
function validateForm(data) {
  if (!data.name || data.name.trim() === '') {
    return { valid: false, message: 'Please enter an item name.' };
  }
  if (isNaN(data.amount) || data.amount <= 0) {
    return { valid: false, message: 'Amount must be greater than zero.' };
  }
  if (!data.category || CATEGORIES.indexOf(data.category) === -1) {
    return { valid: false, message: 'Please select a category.' };
  }
  if (!data.date) {
    return { valid: false, message: 'Please select a date.' };
  }
  return { valid: true, message: '' };
}

/** Handle form submission: validate, add transaction, give feedback. */
function handleSubmit(event) {
  event.preventDefault();

  const data = {
    name: document.getElementById('item-name').value,
    amount: parseFloat(document.getElementById('amount').value),
    category: document.getElementById('category').value,
    date: document.getElementById('date').value
  };

  const result = validateForm(data);
  if (!result.valid) {
    showFeedback(result.message, 'error');
    return;
  }

  addTransaction({
    id: generateId(),
    name: data.name.trim(),
    amount: data.amount,
    category: data.category,
    date: data.date
  });

  document.getElementById('transaction-form').reset();
  setDefaultDate();

  showFeedback('Transaction added successfully!', 'success');
}

/** Set the date input to today's date. */
function setDefaultDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date').value = today;
}

/* ====================================================
   EVENT DELEGATION
   ==================================================== */

/** Handle clicks inside the transaction list (delete buttons). */
function handleListClick(event) {
  const btn = event.target.closest('.delete-btn');
  if (btn) {
    deleteTransaction(btn.getAttribute('data-id'));
  }
}

/* ====================================================
   INITIALIZATION
   ==================================================== */

function init() {
  /* Load saved data from localStorage */
  transactions = loadTransactions();

  /* Set the default date to today */
  setDefaultDate();

  /* Attach event listeners */
  document.getElementById('transaction-form').addEventListener('submit', handleSubmit);
  document.getElementById('transaction-list').addEventListener('click', handleListClick);

  /* Initial render */
  updateUI();
}

/* Run init when the DOM is ready */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
