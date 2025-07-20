// Chart Utilities for Dashboard Visualizations

// Configuration for status distribution chart
function createStatusDistributionChart(canvasId, data) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  
  // Define colors for different statuses
  const statusColors = {
    'ACTIVE': '#10B981', // green
    'INACTIVE': '#EF4444', // red
    'PENDING': '#F59E0B', // yellow
    'CLOSED': '#6B7280'  // gray
  };
  
  // Extract data for the chart
  const labels = Object.keys(data);
  const values = Object.values(data);
  const colors = labels.map(label => statusColors[label] || '#3B82F6');
  
  // Create the chart
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: '#FFFFFF',
        borderWidth: 2,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            boxWidth: 12,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      cutout: '70%',
      animation: {
        animateScale: true,
        animateRotate: true
      }
    }
  });
}

// Configuration for industry distribution chart
function createIndustryDistributionChart(canvasId, data) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  
  // Extract data for the chart
  const labels = Object.keys(data);
  const values = Object.values(data);
  
  // Generate colors for each industry
  const generateColors = (count) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const hue = (i * 137) % 360; // Use golden angle approximation for good distribution
      colors.push(`hsla(${hue}, 70%, 60%, 0.8)`);
    }
    return colors;
  };
  
  const colors = generateColors(labels.length);
  
  // Create the chart
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Accounts by Industry',
        data: values,
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.8', '1')),
        borderWidth: 1,
        borderRadius: 4,
        maxBarThickness: 40
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.raw || 0;
              return `${label}: ${value}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      }
    }
  });
}

// Function to update charts with new data
function updateCharts(statusChart, industryChart, statusData, industryData) {
  // Update status chart
  if (statusChart) {
    statusChart.data.labels = Object.keys(statusData);
    statusChart.data.datasets[0].data = Object.values(statusData);
    statusChart.update();
  }
  
  // Update industry chart
  if (industryChart) {
    industryChart.data.labels = Object.keys(industryData);
    industryChart.data.datasets[0].data = Object.values(industryData);
    industryChart.update();
  }
}

// Function to create interactive filters for metrics
function setupMetricsFilters(containerId, onFilterChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Create time period filter
  const timeFilterHTML = `
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
      <div class="flex space-x-2">
        <button data-period="all" class="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium period-filter active">All Time</button>
        <button data-period="month" class="px-3 py-1 bg-gray-100 text-gray-800 rounded-md text-sm font-medium period-filter">This Month</button>
        <button data-period="week" class="px-3 py-1 bg-gray-100 text-gray-800 rounded-md text-sm font-medium period-filter">This Week</button>
        <button data-period="custom" class="px-3 py-1 bg-gray-100 text-gray-800 rounded-md text-sm font-medium period-filter">Custom</button>
      </div>
      <div id="custom-date-range" class="mt-2 hidden">
        <div class="flex space-x-2">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Start Date</label>
            <input type="date" id="start-date" class="px-2 py-1 border border-gray-300 rounded-md text-sm">
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">End Date</label>
            <input type="date" id="end-date" class="px-2 py-1 border border-gray-300 rounded-md text-sm">
          </div>
          <div class="flex items-end">
            <button id="apply-date-range" class="px-3 py-1 bg-blue-600 text-white rounded-md text-sm font-medium">Apply</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Create account type filter
  const typeFilterHTML = `
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
      <div class="flex flex-wrap gap-2">
        <button data-type="all" class="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium type-filter active">All Types</button>
        <button data-type="CUSTOMER" class="px-3 py-1 bg-gray-100 text-gray-800 rounded-md text-sm font-medium type-filter">Customer</button>
        <button data-type="PROSPECT" class="px-3 py-1 bg-gray-100 text-gray-800 rounded-md text-sm font-medium type-filter">Prospect</button>
        <button data-type="PARTNER" class="px-3 py-1 bg-gray-100 text-gray-800 rounded-md text-sm font-medium type-filter">Partner</button>
        <button data-type="COMPETITOR" class="px-3 py-1 bg-gray-100 text-gray-800 rounded-md text-sm font-medium type-filter">Competitor</button>
      </div>
    </div>
  `;
  
  // Add filters to container
  container.innerHTML = timeFilterHTML + typeFilterHTML;
  
  // Set up event listeners for period filters
  const periodFilters = container.querySelectorAll('.period-filter');
  periodFilters.forEach(button => {
    button.addEventListener('click', () => {
      // Update active state
      periodFilters.forEach(btn => btn.classList.remove('active', 'bg-blue-100', 'text-blue-800'));
      periodFilters.forEach(btn => btn.classList.add('bg-gray-100', 'text-gray-800'));
      button.classList.remove('bg-gray-100', 'text-gray-800');
      button.classList.add('active', 'bg-blue-100', 'text-blue-800');
      
      // Show/hide custom date range
      const customDateRange = document.getElementById('custom-date-range');
      if (button.dataset.period === 'custom') {
        customDateRange.classList.remove('hidden');
      } else {
        customDateRange.classList.add('hidden');
        
        // Trigger filter change
        const filters = getActiveFilters();
        onFilterChange(filters);
      }
    });
  });
  
  // Set up event listeners for type filters
  const typeFilters = container.querySelectorAll('.type-filter');
  typeFilters.forEach(button => {
    button.addEventListener('click', () => {
      // Update active state
      typeFilters.forEach(btn => btn.classList.remove('active', 'bg-blue-100', 'text-blue-800'));
      typeFilters.forEach(btn => btn.classList.add('bg-gray-100', 'text-gray-800'));
      button.classList.remove('bg-gray-100', 'text-gray-800');
      button.classList.add('active', 'bg-blue-100', 'text-blue-800');
      
      // Trigger filter change
      const filters = getActiveFilters();
      onFilterChange(filters);
    });
  });
  
  // Set up event listener for custom date range
  const applyDateRange = document.getElementById('apply-date-range');
  if (applyDateRange) {
    applyDateRange.addEventListener('click', () => {
      const filters = getActiveFilters();
      onFilterChange(filters);
    });
  }
  
  // Helper function to get active filters
  function getActiveFilters() {
    const activePeriod = container.querySelector('.period-filter.active').dataset.period;
    const activeType = container.querySelector('.type-filter.active').dataset.type;
    
    const filters = {
      period: activePeriod,
      type: activeType
    };
    
    // Add custom date range if applicable
    if (activePeriod === 'custom') {
      filters.startDate = document.getElementById('start-date').value;
      filters.endDate = document.getElementById('end-date').value;
    }
    
    return filters;
  }
}

// Export functions
window.chartUtils = {
  createStatusDistributionChart,
  createIndustryDistributionChart,
  updateCharts,
  setupMetricsFilters
};