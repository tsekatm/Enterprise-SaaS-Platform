const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { ResponseOptimizer } = require('./src/utils/ResponseOptimizer');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Use response optimization middleware
app.use(ResponseOptimizer.compressionMiddleware());
app.use(ResponseOptimizer.jsonOptimizerMiddleware());
app.use(ResponseOptimizer.cacheControlMiddleware(60)); // 60 seconds cache

// In-memory data store (for demo purposes)
const accounts = new Map();
const relationships = new Map();

// Generate some sample data
function generateSampleData() {
  const accountTypes = ['CUSTOMER', 'PROSPECT', 'PARTNER', 'COMPETITOR', 'OTHER'];
  const accountStatuses = ['ACTIVE', 'INACTIVE', 'PENDING', 'CLOSED'];
  const industries = ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing'];
  
  // Create just 5 sample accounts to avoid memory issues
  for (let i = 0; i < 5; i++) {
    const id = uuidv4();
    const now = new Date();
    
    accounts.set(id, {
      id,
      name: `Test Account ${i}`,
      industry: industries[i % industries.length],
      type: accountTypes[i % accountTypes.length],
      status: accountStatuses[i % accountStatuses.length],
      website: i % 2 === 0 ? `https://example${i}.com` : undefined,
      email: i % 2 === 0 ? `contact${i}@example.com` : undefined,
      description: i % 2 === 0 ? `This is a test account description for account ${i}` : undefined,
      createdBy: 'system',
      createdAt: now,
      updatedBy: 'system',
      updatedAt: now
    });
  }
  
  // Create just a couple of relationships
  const accountIds = Array.from(accounts.keys());
  if (accountIds.length >= 2) {
    const id = uuidv4();
    const now = new Date();
    
    relationships.set(id, {
      id,
      parentAccountId: accountIds[0],
      childAccountId: accountIds[1],
      relationshipType: 'PARENT_CHILD',
      createdBy: 'system',
      createdAt: now,
      updatedBy: 'system',
      updatedAt: now
    });
  }
}

// Generate sample data
generateSampleData();

// API Routes
app.get('/api/accounts', (req, res) => {
  try {
    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const sortField = req.query.sortField || 'name';
    const sortDirection = req.query.sortDirection || 'asc';
    
    // Get all accounts
    let accountsList = Array.from(accounts.values());
    
    // Apply filters if provided
    if (req.query.name) {
      accountsList = accountsList.filter(account => 
        account.name.toLowerCase().includes(req.query.name.toLowerCase())
      );
    }
    
    if (req.query.industry) {
      accountsList = accountsList.filter(account => 
        account.industry.toLowerCase().includes(req.query.industry.toLowerCase())
      );
    }
    
    if (req.query.type) {
      accountsList = accountsList.filter(account => account.type === req.query.type);
    }
    
    if (req.query.status) {
      accountsList = accountsList.filter(account => account.status === req.query.status);
    }
    
    // Apply sorting
    accountsList.sort((a, b) => {
      const valueA = a[sortField];
      const valueB = b[sortField];
      
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = accountsList.slice(startIndex, endIndex);
    
    // Return paginated response
    res.json({
      items: paginatedItems,
      total: accountsList.length,
      page,
      pageSize,
      totalPages: Math.ceil(accountsList.length / pageSize)
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/accounts/:id', (req, res) => {
  try {
    const account = accounts.get(req.params.id);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new account
app.post('/api/accounts', (req, res) => {
  try {
    const accountData = req.body;
    
    // Validate required fields
    if (!accountData.name || !accountData.industry || !accountData.type || !accountData.status) {
      return res.status(400).json({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Account creation failed due to validation errors',
        details: [
          { field: 'name', error: 'Account name is required' },
          { field: 'industry', error: 'Industry is required' },
          { field: 'type', error: 'Account type is required' },
          { field: 'status', error: 'Account status is required' }
        ].filter(item => !accountData[item.field])
      });
    }
    
    // Generate a new ID
    const id = uuidv4();
    const now = new Date();
    
    // Create the account object
    const newAccount = {
      id,
      ...accountData,
      createdBy: 'user', // In a real app, this would come from authentication
      createdAt: now,
      updatedBy: 'user',
      updatedAt: now
    };
    
    // Save to our in-memory store
    accounts.set(id, newAccount);
    
    // Return the created account
    res.status(201).json(newAccount);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update an existing account
app.put('/api/accounts/:id', (req, res) => {
  try {
    const id = req.params.id;
    const accountData = req.body;
    const existingAccount = accounts.get(id);
    
    // Check if account exists
    if (!existingAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // Update the account
    const updatedAccount = {
      ...existingAccount,
      ...accountData,
      id, // Ensure ID doesn't change
      updatedBy: 'user', // In a real app, this would come from authentication
      updatedAt: new Date()
    };
    
    // Save to our in-memory store
    accounts.set(id, updatedAccount);
    
    // Return the updated account
    res.json(updatedAccount);
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete an account
app.delete('/api/accounts/:id', (req, res) => {
  try {
    const id = req.params.id;
    const existingAccount = accounts.get(id);
    
    // Check if account exists
    if (!existingAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // Check for relationships
    const relationshipsList = Array.from(relationships.values());
    const hasRelationships = relationshipsList.some(
      rel => rel.parentAccountId === id || rel.childAccountId === id
    );
    
    if (hasRelationships && !req.query.force) {
      return res.status(400).json({
        error: 'Account has active relationships',
        message: 'This account has active relationships. Set force=true to delete anyway.'
      });
    }
    
    // Delete relationships if force=true
    if (hasRelationships && req.query.force === 'true') {
      const relToDelete = relationshipsList.filter(
        rel => rel.parentAccountId === id || rel.childAccountId === id
      );
      
      relToDelete.forEach(rel => {
        relationships.delete(rel.id);
      });
    }
    
    // Delete the account
    accounts.delete(id);
    
    // Return success
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/accounts/:id/relationships', (req, res) => {
  try {
    const accountId = req.params.id;
    const account = accounts.get(accountId);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    const relationshipsList = Array.from(relationships.values());
    
    const parentRelationships = relationshipsList.filter(rel => rel.childAccountId === accountId);
    const childRelationships = relationshipsList.filter(rel => rel.parentAccountId === accountId);
    
    res.json({
      parentRelationships,
      childRelationships
    });
  } catch (error) {
    console.error('Error fetching relationships:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the application`);
});