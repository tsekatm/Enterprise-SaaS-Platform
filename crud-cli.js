#!/usr/bin/env node

const readline = require('readline');
const http = require('http');
const https = require('https');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const BASE_URL = 'http://localhost:3000';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            if (responseData) {
              resolve(JSON.parse(responseData));
            } else {
              resolve({ success: true });
            }
          } catch (error) {
            resolve(responseData);
          }
        } else {
          try {
            reject(JSON.parse(responseData));
          } catch (error) {
            reject({ error: `HTTP Error: ${res.statusCode}` });
          }
        }
      });
    });
    
    req.on('error', (error) => {
      reject({ error: error.message });
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Function to display the menu
function displayMenu() {
  console.log('\n=== Customer Account Management CLI ===');
  console.log('1. List Accounts');
  console.log('2. Get Account by ID');
  console.log('3. Create Account');
  console.log('4. Update Account');
  console.log('5. Delete Account');
  console.log('0. Exit');
  
  rl.question('\nEnter your choice: ', (choice) => {
    switch (choice) {
      case '1':
        listAccounts();
        break;
      case '2':
        getAccountById();
        break;
      case '3':
        createAccount();
        break;
      case '4':
        updateAccount();
        break;
      case '5':
        deleteAccount();
        break;
      case '0':
        console.log('Goodbye!');
        rl.close();
        break;
      default:
        console.log('Invalid choice. Please try again.');
        displayMenu();
    }
  });
}

// Function to list accounts
function listAccounts() {
  console.log('\n--- List Accounts ---');
  
  rl.question('Filter by name (leave empty for no filter): ', (name) => {
    rl.question('Filter by industry (leave empty for no filter): ', (industry) => {
      rl.question('Filter by type (CUSTOMER, PROSPECT, PARTNER, COMPETITOR, OTHER, or leave empty): ', (type) => {
        rl.question('Filter by status (ACTIVE, INACTIVE, PENDING, CLOSED, or leave empty): ', (status) => {
          // Build query parameters
          const queryParams = [];
          if (name) queryParams.push(`name=${encodeURIComponent(name)}`);
          if (industry) queryParams.push(`industry=${encodeURIComponent(industry)}`);
          if (type) queryParams.push(`type=${encodeURIComponent(type)}`);
          if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
          
          const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
          
          makeRequest('GET', `/api/accounts${queryString}`)
            .then((data) => {
              console.log('\nAccounts:');
              if (data.items && data.items.length > 0) {
                data.items.forEach((account, index) => {
                  console.log(`\n${index + 1}. ${account.name} (ID: ${account.id})`);
                  console.log(`   Industry: ${account.industry}`);
                  console.log(`   Type: ${account.type}`);
                  console.log(`   Status: ${account.status}`);
                  if (account.website) console.log(`   Website: ${account.website}`);
                  if (account.email) console.log(`   Email: ${account.email}`);
                });
                console.log(`\nShowing ${data.items.length} of ${data.total} accounts`);
              } else {
                console.log('No accounts found matching your criteria.');
              }
              
              displayMenu();
            })
            .catch((error) => {
              console.error('Error fetching accounts:', error);
              displayMenu();
            });
        });
      });
    });
  });
}

// Function to get account by ID
function getAccountById() {
  console.log('\n--- Get Account by ID ---');
  
  rl.question('Enter account ID: ', (id) => {
    if (!id) {
      console.log('Account ID is required.');
      displayMenu();
      return;
    }
    
    makeRequest('GET', `/api/accounts/${id}`)
      .then((account) => {
        console.log('\nAccount Details:');
        console.log(JSON.stringify(account, null, 2));
        displayMenu();
      })
      .catch((error) => {
        console.error('Error fetching account:', error);
        displayMenu();
      });
  });
}

// Function to create account
function createAccount() {
  console.log('\n--- Create Account ---');
  
  rl.question('Name*: ', (name) => {
    if (!name) {
      console.log('Name is required.');
      displayMenu();
      return;
    }
    
    rl.question('Industry*: ', (industry) => {
      if (!industry) {
        console.log('Industry is required.');
        displayMenu();
        return;
      }
      
      rl.question('Type* (CUSTOMER, PROSPECT, PARTNER, COMPETITOR, OTHER): ', (type) => {
        if (!type || !['CUSTOMER', 'PROSPECT', 'PARTNER', 'COMPETITOR', 'OTHER'].includes(type)) {
          console.log('Valid type is required.');
          displayMenu();
          return;
        }
        
        rl.question('Status* (ACTIVE, INACTIVE, PENDING, CLOSED): ', (status) => {
          if (!status || !['ACTIVE', 'INACTIVE', 'PENDING', 'CLOSED'].includes(status)) {
            console.log('Valid status is required.');
            displayMenu();
            return;
          }
          
          rl.question('Website (optional): ', (website) => {
            rl.question('Email (optional): ', (email) => {
              const accountData = {
                name,
                industry,
                type,
                status
              };
              
              if (website) accountData.website = website;
              if (email) accountData.email = email;
              
              makeRequest('POST', '/api/accounts', accountData)
                .then((newAccount) => {
                  console.log('\nAccount created successfully:');
                  console.log(JSON.stringify(newAccount, null, 2));
                  displayMenu();
                })
                .catch((error) => {
                  console.error('Error creating account:', error);
                  displayMenu();
                });
            });
          });
        });
      });
    });
  });
}

// Function to update account
function updateAccount() {
  console.log('\n--- Update Account ---');
  
  rl.question('Enter account ID: ', (id) => {
    if (!id) {
      console.log('Account ID is required.');
      displayMenu();
      return;
    }
    
    // First, get the current account details
    makeRequest('GET', `/api/accounts/${id}`)
      .then((account) => {
        console.log('\nCurrent Account Details:');
        console.log(JSON.stringify(account, null, 2));
        
        rl.question(`\nName (current: ${account.name}, press Enter to keep): `, (name) => {
          rl.question(`Industry (current: ${account.industry}, press Enter to keep): `, (industry) => {
            rl.question(`Type (current: ${account.type}, options: CUSTOMER, PROSPECT, PARTNER, COMPETITOR, OTHER, press Enter to keep): `, (type) => {
              rl.question(`Status (current: ${account.status}, options: ACTIVE, INACTIVE, PENDING, CLOSED, press Enter to keep): `, (status) => {
                rl.question(`Website (current: ${account.website || 'none'}, press Enter to keep): `, (website) => {
                  rl.question(`Email (current: ${account.email || 'none'}, press Enter to keep): `, (email) => {
                    const accountData = {};
                    
                    if (name) accountData.name = name;
                    if (industry) accountData.industry = industry;
                    if (type) accountData.type = type;
                    if (status) accountData.status = status;
                    if (website !== undefined) {
                      if (website === '') {
                        accountData.website = null;
                      } else if (website !== '') {
                        accountData.website = website;
                      }
                    }
                    if (email !== undefined) {
                      if (email === '') {
                        accountData.email = null;
                      } else if (email !== '') {
                        accountData.email = email;
                      }
                    }
                    
                    makeRequest('PUT', `/api/accounts/${id}`, accountData)
                      .then((updatedAccount) => {
                        console.log('\nAccount updated successfully:');
                        console.log(JSON.stringify(updatedAccount, null, 2));
                        displayMenu();
                      })
                      .catch((error) => {
                        console.error('Error updating account:', error);
                        displayMenu();
                      });
                  });
                });
              });
            });
          });
        });
      })
      .catch((error) => {
        console.error('Error fetching account:', error);
        displayMenu();
      });
  });
}

// Function to delete account
function deleteAccount() {
  console.log('\n--- Delete Account ---');
  
  rl.question('Enter account ID: ', (id) => {
    if (!id) {
      console.log('Account ID is required.');
      displayMenu();
      return;
    }
    
    rl.question('Force delete if account has relationships? (yes/no): ', (force) => {
      const forceDelete = force.toLowerCase() === 'yes';
      
      rl.question('Are you sure you want to delete this account? (yes/no): ', (confirm) => {
        if (confirm.toLowerCase() !== 'yes') {
          console.log('Deletion cancelled.');
          displayMenu();
          return;
        }
        
        const queryString = forceDelete ? '?force=true' : '';
        
        makeRequest('DELETE', `/api/accounts/${id}${queryString}`)
          .then(() => {
            console.log('\nAccount deleted successfully.');
            displayMenu();
          })
          .catch((error) => {
            console.error('Error deleting account:', error);
            displayMenu();
          });
      });
    });
  });
}

// Start the CLI
console.log('Welcome to the Customer Account Management CLI!');
console.log('This tool allows you to interact with the customer account management system from the command line.');
console.log('Make sure the server is running on http://localhost:3000 before using this tool.');

// Check if the server is running
makeRequest('GET', '/api/accounts')
  .then(() => {
    console.log('Successfully connected to the server.');
    displayMenu();
  })
  .catch((error) => {
    console.error('Error connecting to the server:', error);
    console.log('Please make sure the server is running on http://localhost:3000.');
    rl.close();
  });