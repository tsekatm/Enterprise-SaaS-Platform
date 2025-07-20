// State
let accounts = [];
let currentAccount = null;
let filters = {};
let pagination = { page: 1, pageSize: 9 };
let totalItems = 0;
let totalPages = 0;

// DOM Elements
const createModal = document.getElementById('create-modal');
const accountsModal = document.getElementById('accounts-modal');
const detailModal = document.getElementById('detail-modal');
const editModal = document.getElementById('edit-modal');
const deleteModal = document.getElementById('delete-modal');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardStats();
  loadRecentAccounts();
  
  // Load recent activity and shortcuts
  if (window.dashboardActivity) {
    window.dashboardActivity.loadRecentActivity();
    window.dashboardActivity.loadShortcuts();
  }
  
  // Mobile menu toggle
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!mobileMenuButton.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.add('hidden');
      }
    });
  }
  
  // Modal close buttons
  document.querySelectorAll('.modal-close').forEach(button => {
    button.addEventListener('click', closeAllModals);
  });
  
  // Hero buttons
  document.getElementById('create-account-hero').addEventListener('click', openCreateModal);
  document.getElementById('view-accounts-hero').addEventListener('click', openAccountsModal);
  
  // Quick action buttons
  document.getElementById('create-account-btn').addEventListener('click', openCreateModal);
  document.getElementById('search-accounts-btn').addEventListener('click', openAccountsModal);
  document.getElementById('manage-accounts-btn').addEventListener('click', openAccountsModal);
  document.getElementById('reports-btn').addEventListener('click', () => {
    showToast('Reports feature coming soon!');
  });
  
  // Other buttons
  document.getElementById('view-all-btn').addEventListener('click', openAccountsModal);
  document.getElementById('create-first-account').addEventListener('click', openCreateModal);
  
  // Form submissions
  document.getElementById('create-form').addEventListener('submit', handleCreateAccount);
  document.getElementById('edit-form').addEventListener('submit', handleEditAccount);
  
  // Account modal buttons
  document.getElementById('apply-filters').addEventListener('click', applyFilters);
  document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
  document.getElementById('next-page').addEventListener('click', () => changePage(1));
  
  // Detail modal buttons
  document.getElementById('edit-account').addEventListener('click', () => {
    closeAllModals();
    openEditModal(currentAccount);
  });
  document.getElementById('delete-account').addEventListener('click', () => {
    closeAllModals();
    openDeleteModal(currentAccount);
  });
  
  // Delete confirmation
  document.getElementById('confirm-delete').addEventListener('click', handleDeleteAccount);
  
  // Search input
  document.getElementById('search-input').addEventListener('input', debounce(applyFilters, 300));
});

// Chart instances
let statusChart = null;
let industryChart = null;
let currentFilters = { period: 'all', type: 'all' };

// Dashboard Functions
async function loadDashboardStats() {
  try {
    const response = await fetch('/api/accounts');
    const data = await response.json();
    
    const totalAccounts = data.total || 0;
    const activeAccounts = data.items ? data.items.filter(acc => acc.status === 'ACTIVE').length : 0;
    const pendingAccounts = data.items ? data.items.filter(acc => acc.status === 'PENDING').length : 0;
    
    // Calculate recent accounts (this month)
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const recentAccounts = data.items ? data.items.filter(acc => 
      new Date(acc.createdAt) >= thisMonth
    ).length : 0;
    
    document.getElementById('total-accounts').textContent = totalAccounts;
    document.getElementById('active-accounts').textContent = activeAccounts;
    document.getElementById('pending-accounts').textContent = pendingAccounts;
    document.getElementById('recent-accounts').textContent = recentAccounts;
    
    // Initialize charts if data is available
    if (data.items && data.items.length > 0) {
      initializeCharts(data.items);
    }
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}

// Initialize charts with account data
function initializeCharts(accounts) {
  // Process data for status distribution chart
  const statusData = processStatusData(accounts);
  
  // Process data for industry distribution chart
  const industryData = processIndustryData(accounts);
  
  // Create charts if they don't exist yet
  if (!statusChart) {
    statusChart = window.chartUtils.createStatusDistributionChart('status-chart', statusData);
  } else {
    // Update existing chart
    statusChart.data.labels = Object.keys(statusData);
    statusChart.data.datasets[0].data = Object.values(statusData);
    statusChart.update();
  }
  
  if (!industryChart) {
    industryChart = window.chartUtils.createIndustryDistributionChart('industry-chart', industryData);
  } else {
    // Update existing chart
    industryChart.data.labels = Object.keys(industryData);
    industryChart.data.datasets[0].data = Object.values(industryData);
    industryChart.update();
  }
  
  // Set up chart filters
  setupChartFilters();
}

// Process account data for status distribution chart
function processStatusData(accounts, filters = currentFilters) {
  // Apply filters
  const filteredAccounts = filterAccounts(accounts, filters);
  
  // Count accounts by status
  const statusCounts = {
    'ACTIVE': 0,
    'INACTIVE': 0,
    'PENDING': 0,
    'CLOSED': 0
  };
  
  filteredAccounts.forEach(account => {
    if (statusCounts.hasOwnProperty(account.status)) {
      statusCounts[account.status]++;
    }
  });
  
  return statusCounts;
}

// Process account data for industry distribution chart
function processIndustryData(accounts, filters = currentFilters) {
  // Apply filters
  const filteredAccounts = filterAccounts(accounts, filters);
  
  // Count accounts by industry
  const industryCounts = {};
  
  filteredAccounts.forEach(account => {
    if (account.industry) {
      if (!industryCounts[account.industry]) {
        industryCounts[account.industry] = 0;
      }
      industryCounts[account.industry]++;
    }
  });
  
  // Sort by count (descending) and limit to top 10
  const sortedIndustries = Object.entries(industryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});
  
  return sortedIndustries;
}

// Filter accounts based on selected filters
function filterAccounts(accounts, filters) {
  return accounts.filter(account => {
    // Filter by account type
    if (filters.type !== 'all' && account.type !== filters.type) {
      return false;
    }
    
    // Filter by time period
    if (filters.period !== 'all') {
      const accountDate = new Date(account.createdAt);
      const now = new Date();
      
      if (filters.period === 'month') {
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        if (accountDate < thisMonth) {
          return false;
        }
      } else if (filters.period === 'week') {
        const thisWeek = new Date(now);
        thisWeek.setDate(now.getDate() - now.getDay());
        thisWeek.setHours(0, 0, 0, 0);
        if (accountDate < thisWeek) {
          return false;
        }
      } else if (filters.period === 'custom' && filters.startDate && filters.endDate) {
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999); // Include the entire end day
        
        if (accountDate < startDate || accountDate > endDate) {
          return false;
        }
      }
    }
    
    return true;
  });
}

// Set up chart filters
function setupChartFilters() {
  // Set up toggle button for filters
  const toggleFiltersBtn = document.getElementById('toggle-chart-filters');
  const filtersContainer = document.getElementById('chart-filters');
  
  if (toggleFiltersBtn && filtersContainer) {
    toggleFiltersBtn.addEventListener('click', () => {
      filtersContainer.classList.toggle('hidden');
    });
    
    // Initialize filters UI
    window.chartUtils.setupMetricsFilters('chart-filters', handleFilterChange);
  }
}

// Handle filter changes
async function handleFilterChange(filters) {
  currentFilters = filters;
  
  try {
    const response = await fetch('/api/accounts');
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      // Process data with new filters
      const statusData = processStatusData(data.items, filters);
      const industryData = processIndustryData(data.items, filters);
      
      // Update charts
      window.chartUtils.updateCharts(statusChart, industryChart, statusData, industryData);
    }
  } catch (error) {
    console.error('Error updating charts with filters:', error);
  }
}

async function loadRecentAccounts() {
  const loadingRecent = document.getElementById('loading-recent');
  const recentGrid = document.getElementById('recent-accounts-grid');
  const emptyRecent = document.getElementById('empty-recent');
  
  try {
    loadingRecent.classList.remove('hidden');
    recentGrid.classList.add('hidden');
    emptyRecent.classList.add('hidden');
    
    const response = await fetch('/api/accounts?pageSize=6');
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      renderRecentAccounts(data.items);
      recentGrid.classList.remove('hidden');
    } else {
      emptyRecent.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error loading recent accounts:', error);
    emptyRecent.classList.remove('hidden');
  } finally {
    loadingRecent.classList.add('hidden');
  }
}

function renderRecentAccounts(accountsList) {
  const grid = document.getElementById('recent-accounts-grid');
  grid.innerHTML = '';
  
  accountsList.forEach(account => {
    const card = createAccountCard(account);
    grid.appendChild(card);
  });
}

// Modal Functions
function openCreateModal() {
  document.getElementById('create-form').reset();
  openModal(createModal);
}

async function openAccountsModal() {
  openModal(accountsModal);
  await loadAllAccounts();
}

function openDetailModal(account) {
  currentAccount = account;
  document.getElementById('detail-title').textContent = account.name;
  
  const statusClass = getStatusClass(account.status);
  
  document.getElementById('detail-content').innerHTML = `
    <div class="bg-gray-50 p-4 rounded-lg">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">${account.name}</h3>
        <span class="status-badge ${statusClass}">${account.status}</span>
      </div>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="font-medium text-gray-700">Industry:</span>
          <span class="text-gray-900">${account.industry}</span>
        </div>
        <div>
          <span class="font-medium text-gray-700">Type:</span>
          <span class="text-gray-900">${account.type}</span>
        </div>
      </div>
    </div>
    
    ${account.email || account.website ? `
    <div>
      <h4 class="font-medium text-gray-900 mb-2">Contact Information</h4>
      <div class="space-y-2 text-sm">
        ${account.email ? `<div><span class="font-medium text-gray-700">Email:</span> <a href="mailto:${account.email}" class="text-blue-600 hover:underline">${account.email}</a></div>` : ''}
        ${account.website ? `<div><span class="font-medium text-gray-700">Website:</span> <a href="${account.website}" target="_blank" class="text-blue-600 hover:underline">${account.website}</a></div>` : ''}
      </div>
    </div>
    ` : ''}
    
    ${account.description ? `
    <div>
      <h4 class="font-medium text-gray-900 mb-2">Description</h4>
      <p class="text-gray-700 text-sm">${account.description}</p>
    </div>
    ` : ''}
    
    <div class="bg-gray-50 p-4 rounded-lg">
      <h4 class="font-medium text-gray-900 mb-2">System Information</h4>
      <div class="space-y-1 text-sm text-gray-600">
        <div>Created: ${new Date(account.createdAt).toLocaleString()} by ${account.createdBy}</div>
        <div>Last Updated: ${new Date(account.updatedAt).toLocaleString()} by ${account.updatedBy}</div>
        <div>Account ID: ${account.id}</div>
      </div>
    </div>
  `;
  
  openModal(detailModal);
}

function openEditModal(account) {
  currentAccount = account;
  
  // Populate form
  document.getElementById('edit-account-id').value = account.id;
  document.getElementById('edit-account-name').value = account.name || '';
  document.getElementById('edit-account-industry').value = account.industry || '';
  document.getElementById('edit-account-type').value = account.type || '';
  document.getElementById('edit-account-status').value = account.status || '';
  document.getElementById('edit-account-website').value = account.website || '';
  document.getElementById('edit-account-email').value = account.email || '';
  document.getElementById('edit-account-description').value = account.description || '';
  
  openModal(editModal);
}

function openDeleteModal(account) {
  currentAccount = account;
  document.getElementById('delete-account-name').textContent = account.name;
  document.getElementById('delete-account-info').textContent = `${account.type} • ${account.industry}`;
  document.getElementById('force-delete').checked = false;
  
  openModal(deleteModal);
}

function openModal(modal) {
  closeAllModals();
  modal.classList.add('active');
}

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.remove('active');
  });
}

// Account Management Functions
async function handleCreateAccount(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const accountData = {
    name: formData.get('account-name') || document.getElementById('account-name').value,
    industry: formData.get('account-industry') || document.getElementById('account-industry').value,
    type: formData.get('account-type') || document.getElementById('account-type').value,
    status: formData.get('account-status') || document.getElementById('account-status').value,
  };
  
  const website = document.getElementById('account-website').value;
  const email = document.getElementById('account-email').value;
  const description = document.getElementById('account-description').value;
  
  if (website) accountData.website = website;
  if (email) accountData.email = email;
  if (description) accountData.description = description;
  
  try {
    const response = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accountData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create account');
    }
    
    const newAccount = await response.json();
    closeAllModals();
    showToast(`Account "${newAccount.name}" created successfully!`);
    
    // Refresh data
    loadDashboardStats();
    loadRecentAccounts();
    
  } catch (error) {
    showToast(`Error: ${error.message}`, 'error');
  }
}

async function handleEditAccount(e) {
  e.preventDefault();
  
  const accountData = {
    name: document.getElementById('edit-account-name').value,
    industry: document.getElementById('edit-account-industry').value,
    type: document.getElementById('edit-account-type').value,
    status: document.getElementById('edit-account-status').value,
  };
  
  const website = document.getElementById('edit-account-website').value;
  const email = document.getElementById('edit-account-email').value;
  const description = document.getElementById('edit-account-description').value;
  
  if (website) accountData.website = website;
  if (email) accountData.email = email;
  if (description) accountData.description = description;
  
  try {
    const response = await fetch(`/api/accounts/${currentAccount.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accountData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update account');
    }
    
    const updatedAccount = await response.json();
    closeAllModals();
    showToast(`Account "${updatedAccount.name}" updated successfully!`);
    
    // Refresh data
    loadDashboardStats();
    loadRecentAccounts();
    
  } catch (error) {
    showToast(`Error: ${error.message}`, 'error');
  }
}

async function handleDeleteAccount() {
  const forceDelete = document.getElementById('force-delete').checked;
  const url = forceDelete ? `/api/accounts/${currentAccount.id}?force=true` : `/api/accounts/${currentAccount.id}`;
  
  try {
    const response = await fetch(url, { method: 'DELETE' });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to delete account');
    }
    
    closeAllModals();
    showToast(`Account "${currentAccount.name}" deleted successfully!`);
    
    // Refresh data
    loadDashboardStats();
    loadRecentAccounts();
    
  } catch (error) {
    showToast(`Error: ${error.message}`, 'error');
  }
}

async function loadAllAccounts() {
  const loadingAll = document.getElementById('loading-all');
  const allGrid = document.getElementById('all-accounts-grid');
  const emptyAll = document.getElementById('empty-all');
  
  try {
    loadingAll.classList.remove('hidden');
    allGrid.classList.add('hidden');
    emptyAll.classList.add('hidden');
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('page', pagination.page);
    queryParams.append('pageSize', pagination.pageSize);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const response = await fetch(`/api/accounts?${queryParams.toString()}`);
    const data = await response.json();
    
    accounts = data.items || [];
    totalItems = data.total || 0;
    totalPages = data.totalPages || 1;
    
    if (accounts.length > 0) {
      renderAllAccounts();
      allGrid.classList.remove('hidden');
    } else {
      emptyAll.classList.remove('hidden');
    }
    
    updatePagination();
    
  } catch (error) {
    console.error('Error loading accounts:', error);
    emptyAll.classList.remove('hidden');
  } finally {
    loadingAll.classList.add('hidden');
  }
}

function renderAllAccounts() {
  const grid = document.getElementById('all-accounts-grid');
  grid.innerHTML = '';
  
  accounts.forEach(account => {
    const card = createAccountCard(account, true);
    grid.appendChild(card);
  });
}

function createAccountCard(account, showActions = false) {
  const card = document.createElement('div');
  card.className = 'bg-white rounded-lg shadow-md p-4 card-hover fade-in cursor-pointer';
  
  const statusClass = getStatusClass(account.status);
  
  card.innerHTML = `
    <div class="flex justify-between items-start mb-3">
      <h3 class="text-lg font-semibold text-gray-900 truncate">${account.name}</h3>
      <span class="status-badge ${statusClass}">${account.status}</span>
    </div>
    <div class="space-y-1 text-sm text-gray-600 mb-4">
      <div><span class="font-medium">Industry:</span> ${account.industry}</div>
      <div><span class="font-medium">Type:</span> ${account.type}</div>
      ${account.email ? `<div><span class="font-medium">Email:</span> ${account.email}</div>` : ''}
      ${account.website ? `<div><span class="font-medium">Website:</span> <a href="${account.website}" target="_blank" class="text-blue-600 hover:underline" onclick="event.stopPropagation()">${account.website}</a></div>` : ''}
    </div>
    ${showActions ? `
    <div class="flex justify-end space-x-2 pt-2 border-t border-gray-100">
      <button class="text-blue-600 hover:text-blue-800 text-sm font-medium" onclick="event.stopPropagation(); viewAccount('${account.id}')">View</button>
      <button class="text-green-600 hover:text-green-800 text-sm font-medium" onclick="event.stopPropagation(); editAccount('${account.id}')">Edit</button>
      <button class="text-red-600 hover:text-red-800 text-sm font-medium" onclick="event.stopPropagation(); deleteAccount('${account.id}')">Delete</button>
    </div>
    ` : ''}
  `;
  
  if (!showActions) {
    card.addEventListener('click', () => openDetailModal(account));
  }
  
  return card;
}

// Account action functions for onclick handlers
async function viewAccount(id) {
  try {
    const response = await fetch(`/api/accounts/${id}`);
    const account = await response.json();
    openDetailModal(account);
  } catch (error) {
    showToast(`Error: ${error.message}`, 'error');
  }
}

async function editAccount(id) {
  try {
    const response = await fetch(`/api/accounts/${id}`);
    const account = await response.json();
    closeAllModals();
    openEditModal(account);
  } catch (error) {
    showToast(`Error: ${error.message}`, 'error');
  }
}

async function deleteAccount(id) {
  try {
    const response = await fetch(`/api/accounts/${id}`);
    const account = await response.json();
    closeAllModals();
    openDeleteModal(account);
  } catch (error) {
    showToast(`Error: ${error.message}`, 'error');
  }
}

function applyFilters() {
  filters = {
    name: document.getElementById('search-input').value,
    type: document.getElementById('filter-type').value,
    status: document.getElementById('filter-status').value
  };
  
  pagination.page = 1;
  loadAllAccounts();
}

function changePage(direction) {
  const newPage = pagination.page + direction;
  if (newPage >= 1 && newPage <= totalPages) {
    pagination.page = newPage;
    loadAllAccounts();
  }
}

function updatePagination() {
  const startItem = (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(pagination.page * pagination.pageSize, totalItems);
  
  document.getElementById('pagination-info').textContent = 
    `Showing ${accounts.length > 0 ? startItem : 0}-${accounts.length > 0 ? endItem : 0} of ${totalItems} accounts`;
  
  document.getElementById('page-info').textContent = `Page ${pagination.page} of ${totalPages}`;
  
  document.getElementById('prev-page').disabled = pagination.page <= 1;
  document.getElementById('next-page').disabled = pagination.page >= totalPages;
}

// Utility Functions
function getStatusClass(status) {
  switch (status) {
    case 'ACTIVE': return 'status-active';
    case 'INACTIVE': return 'status-inactive';
    case 'PENDING': return 'status-pending';
    case 'CLOSED': return 'status-closed';
    default: return 'status-active';
  }
}

function showToast(message, type = 'success') {
  toastMessage.textContent = message;
  
  const toastDiv = toast.querySelector('div');
  if (type === 'error') {
    toastDiv.className = 'bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center';
    toastDiv.querySelector('i').className = 'fas fa-exclamation-circle mr-3';
  } else {
    toastDiv.className = 'bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center';
    toastDiv.querySelector('i').className = 'fas fa-check-circle mr-3';
  }
  
  toast.classList.remove('translate-y-full', 'opacity-0');
  
  setTimeout(() => {
    toast.classList.add('translate-y-full', 'opacity-0');
  }, 3000);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Make functions globally available
window.viewAccount = viewAccount;
window.editAccount = editAccount;
window.deleteAccount = deleteAccount;