// Recent Activity and Shortcuts Management

// Sample activity data (in a real application, this would come from an API)
const sampleActivities = [
  {
    id: 1,
    type: 'create',
    accountName: 'Acme Corporation',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    user: 'Sales Manager'
  },
  {
    id: 2,
    type: 'update',
    accountName: 'TechSolutions Inc.',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    user: 'Sales Manager'
  },
  {
    id: 3,
    type: 'view',
    accountName: 'Global Industries',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    user: 'Sales Manager'
  },
  {
    id: 4,
    type: 'delete',
    accountName: 'Old Company LLC',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    user: 'Sales Manager'
  },
  {
    id: 5,
    type: 'export',
    accountName: 'Multiple Accounts',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    user: 'Sales Manager'
  }
];

// Sample shortcuts data (in a real application, this would come from user preferences)
const sampleShortcuts = [
  {
    id: 1,
    name: 'Favorite Accounts',
    icon: 'fas fa-star',
    iconColor: 'text-yellow-400',
    url: '#'
  },
  {
    id: 2,
    name: 'Recently Viewed',
    icon: 'fas fa-clock',
    iconColor: 'text-blue-400',
    url: '#'
  },
  {
    id: 3,
    name: 'Export Accounts',
    icon: 'fas fa-file-export',
    iconColor: 'text-green-400',
    url: '#'
  },
  {
    id: 4,
    name: 'Account Settings',
    icon: 'fas fa-cog',
    iconColor: 'text-purple-400',
    url: '#'
  }
];

// Function to load recent activity
function loadRecentActivity() {
  const activityContainer = document.getElementById('recent-activity-list');
  if (!activityContainer) return;
  
  // Clear existing content
  activityContainer.innerHTML = '';
  
  // Get the 3 most recent activities
  const recentActivities = sampleActivities.slice(0, 3);
  
  // Render activities
  recentActivities.forEach(activity => {
    const activityItem = createActivityItem(activity);
    activityContainer.appendChild(activityItem);
  });
}

// Function to create an activity item element
function createActivityItem(activity) {
  const item = document.createElement('div');
  item.className = 'flex items-start p-2 hover:bg-gray-50 rounded-lg';
  
  // Determine icon and color based on activity type
  let iconClass = '';
  let bgColorClass = '';
  let textColorClass = '';
  
  switch (activity.type) {
    case 'create':
      iconClass = 'fas fa-plus';
      bgColorClass = 'bg-blue-100';
      textColorClass = 'text-blue-600';
      break;
    case 'update':
      iconClass = 'fas fa-edit';
      bgColorClass = 'bg-green-100';
      textColorClass = 'text-green-600';
      break;
    case 'view':
      iconClass = 'fas fa-eye';
      bgColorClass = 'bg-yellow-100';
      textColorClass = 'text-yellow-600';
      break;
    case 'delete':
      iconClass = 'fas fa-trash';
      bgColorClass = 'bg-red-100';
      textColorClass = 'text-red-600';
      break;
    case 'export':
      iconClass = 'fas fa-file-export';
      bgColorClass = 'bg-purple-100';
      textColorClass = 'text-purple-600';
      break;
    default:
      iconClass = 'fas fa-info-circle';
      bgColorClass = 'bg-gray-100';
      textColorClass = 'text-gray-600';
  }
  
  // Format the activity text
  let activityText = '';
  switch (activity.type) {
    case 'create':
      activityText = 'New account created';
      break;
    case 'update':
      activityText = 'Account updated';
      break;
    case 'view':
      activityText = 'Account viewed';
      break;
    case 'delete':
      activityText = 'Account deleted';
      break;
    case 'export':
      activityText = 'Accounts exported';
      break;
    default:
      activityText = 'Activity recorded';
  }
  
  // Format the timestamp
  const timeAgo = formatTimeAgo(activity.timestamp);
  
  // Create the HTML
  item.innerHTML = `
    <div class="h-8 w-8 ${bgColorClass} rounded-full flex items-center justify-center mr-3">
      <i class="${iconClass} ${textColorClass} text-xs"></i>
    </div>
    <div>
      <p class="text-sm text-gray-900">${activityText}</p>
      <p class="text-xs text-gray-500">${activity.accountName} • ${timeAgo}</p>
    </div>
  `;
  
  return item;
}

// Function to format time ago
function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay > 0) {
    return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
  } else if (diffHour > 0) {
    return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
  } else if (diffMin > 0) {
    return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
  } else {
    return 'just now';
  }
}

// Function to load shortcuts
function loadShortcuts() {
  const shortcutsContainer = document.getElementById('shortcuts-list');
  if (!shortcutsContainer) return;
  
  // Clear existing content
  shortcutsContainer.innerHTML = '';
  
  // Render shortcuts
  sampleShortcuts.forEach(shortcut => {
    const shortcutItem = createShortcutItem(shortcut);
    shortcutsContainer.appendChild(shortcutItem);
  });
}

// Function to create a shortcut item element
function createShortcutItem(shortcut) {
  const item = document.createElement('a');
  item.href = shortcut.url;
  item.className = 'flex items-center p-2 hover:bg-gray-50 rounded-lg group';
  
  item.innerHTML = `
    <i class="${shortcut.icon} ${shortcut.iconColor} mr-3"></i>
    <span class="text-sm text-gray-700 group-hover:text-gray-900">${shortcut.name}</span>
  `;
  
  return item;
}

// Export functions
window.dashboardActivity = {
  loadRecentActivity,
  loadShortcuts
};