import React, { useState, useEffect } from 'react';
import { useCreateAccount } from '../../hooks/useCreateAccount';
import { AccountCreateDto } from '../../../models/dto/AccountDto';
import { AccountType, AccountStatus } from '../../../models/enums/AccountEnums';
import { Address } from '../../../models/Address';

/**
 * Account Creation Form Component
 * 
 * Implements a form for creating new customer accounts with validation
 */
export const AccountCreateForm: React.FC = () => {
  // Use the account creation hook
  const {
    createAccount,
    loading,
    error,
    validationErrors,
    success,
    createdAccountId,
    resetForm
  } = useCreateAccount();

  // Form state
  const [formData, setFormData] = useState<AccountCreateDto>({
    name: '',
    industry: '',
    type: AccountType.CUSTOMER,
    status: AccountStatus.ACTIVE,
    website: '',
    phone: '',
    email: '',
    description: '',
    annualRevenue: undefined,
    employeeCount: undefined,
    tags: [],
    customFields: {}
  });

  // Address state
  const [billingAddress, setBillingAddress] = useState<Address>({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  });

  const [shippingAddress, setShippingAddress] = useState<Address>({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  });

  // State for tracking if billing address is provided
  const [hasBillingAddress, setHasBillingAddress] = useState<boolean>(false);
  
  // State for tracking if shipping address is provided
  const [hasShippingAddress, setHasShippingAddress] = useState<boolean>(false);
  
  // State for tracking if shipping address is same as billing
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState<boolean>(false);

  // State for tags input
  const [tagInput, setTagInput] = useState<string>('');

  // Form field change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (name === 'annualRevenue' || name === 'employeeCount') {
      const numValue = value === '' ? undefined : Number(value);
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Billing address change handler
  const handleBillingAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBillingAddress(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Update shipping address if same as billing is checked
    if (shippingSameAsBilling) {
      setShippingAddress(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Shipping address change handler
  const handleShippingAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle shipping same as billing checkbox
  const handleShippingSameAsBilling = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setShippingSameAsBilling(checked);
    
    if (checked) {
      setShippingAddress(billingAddress);
    }
  };

  // Handle tag input
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  // Add tag to the list
  const addTag = () => {
    if (tagInput.trim() !== '' && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  // Handle tag input key press (add tag on Enter)
  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Remove tag from the list
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare the final form data
    const finalFormData: AccountCreateDto = {
      ...formData
    };
    
    // Add addresses if provided
    if (hasBillingAddress) {
      finalFormData.billingAddress = billingAddress;
    }
    
    if (hasShippingAddress) {
      finalFormData.shippingAddress = shippingSameAsBilling ? billingAddress : shippingAddress;
    }
    
    // Submit the form
    await createAccount(finalFormData);
  };

  // Reset the form
  const handleReset = () => {
    setFormData({
      name: '',
      industry: '',
      type: AccountType.CUSTOMER,
      status: AccountStatus.ACTIVE,
      website: '',
      phone: '',
      email: '',
      description: '',
      annualRevenue: undefined,
      employeeCount: undefined,
      tags: [],
      customFields: {}
    });
    
    setBillingAddress({
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    });
    
    setShippingAddress({
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    });
    
    setHasBillingAddress(false);
    setHasShippingAddress(false);
    setShippingSameAsBilling(false);
    setTagInput('');
    resetForm();
  };

  // Redirect to the created account page on success
  useEffect(() => {
    if (success && createdAccountId) {
      // In a real application, we would use a router to navigate
      window.location.href = `/accounts/${createdAccountId}`;
    }
  }, [success, createdAccountId]);

  return (
    <div className="account-create-form-container">
      <h1>Create New Account</h1>
      
      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>{error.message}</p>
        </div>
      )}
      
      {/* Success Message */}
      {success && (
        <div className="success-message">
          <p>Account created successfully!</p>
          <p>Redirecting to account details...</p>
        </div>
      )}
      
      {/* Account Creation Form */}
      <form onSubmit={handleSubmit} className="account-form">
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label htmlFor="name">Account Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={validationErrors['name'] ? 'error' : ''}
              required
            />
            {validationErrors['name'] && (
              <div className="error-text">{validationErrors['name']}</div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="industry">Industry *</label>
            <input
              type="text"
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className={validationErrors['industry'] ? 'error' : ''}
              required
            />
            {validationErrors['industry'] && (
              <div className="error-text">{validationErrors['industry']}</div>
            )}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Account Type *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={validationErrors['type'] ? 'error' : ''}
                required
              >
                {Object.values(AccountType).map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {validationErrors['type'] && (
                <div className="error-text">{validationErrors['type']}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={validationErrors['status'] ? 'error' : ''}
                required
              >
                {Object.values(AccountStatus).map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {validationErrors['status'] && (
                <div className="error-text">{validationErrors['status']}</div>
              )}
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h2>Contact Information</h2>
          
          <div className="form-group">
            <label htmlFor="website">Website</label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website || ''}
              onChange={handleChange}
              className={validationErrors['website'] ? 'error' : ''}
              placeholder="https://example.com"
            />
            {validationErrors['website'] && (
              <div className="error-text">{validationErrors['website']}</div>
            )}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className={validationErrors['email'] ? 'error' : ''}
                placeholder="contact@example.com"
              />
              {validationErrors['email'] && (
                <div className="error-text">{validationErrors['email']}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className={validationErrors['phone'] ? 'error' : ''}
                placeholder="+1 (555) 123-4567"
              />
              {validationErrors['phone'] && (
                <div className="error-text">{validationErrors['phone']}</div>
              )}
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h2>Business Information</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="annualRevenue">Annual Revenue ($)</label>
              <input
                type="number"
                id="annualRevenue"
                name="annualRevenue"
                value={formData.annualRevenue || ''}
                onChange={handleChange}
                className={validationErrors['annualRevenue'] ? 'error' : ''}
                min="0"
                step="1000"
              />
              {validationErrors['annualRevenue'] && (
                <div className="error-text">{validationErrors['annualRevenue']}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="employeeCount">Number of Employees</label>
              <input
                type="number"
                id="employeeCount"
                name="employeeCount"
                value={formData.employeeCount || ''}
                onChange={handleChange}
                className={validationErrors['employeeCount'] ? 'error' : ''}
                min="0"
              />
              {validationErrors['employeeCount'] && (
                <div className="error-text">{validationErrors['employeeCount']}</div>
              )}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              className={validationErrors['description'] ? 'error' : ''}
              rows={4}
            />
            {validationErrors['description'] && (
              <div className="error-text">{validationErrors['description']}</div>
            )}
          </div>
        </div>
        
        <div className="form-section">
          <h2>Billing Address</h2>
          
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="hasBillingAddress"
              checked={hasBillingAddress}
              onChange={(e) => setHasBillingAddress(e.target.checked)}
            />
            <label htmlFor="hasBillingAddress">Add Billing Address</label>
          </div>
          
          {hasBillingAddress && (
            <div className="address-fields">
              <div className="form-group">
                <label htmlFor="billing-street">Street *</label>
                <input
                  type="text"
                  id="billing-street"
                  name="street"
                  value={billingAddress.street}
                  onChange={handleBillingAddressChange}
                  className={validationErrors['billingAddress.street'] ? 'error' : ''}
                  required
                />
                {validationErrors['billingAddress.street'] && (
                  <div className="error-text">{validationErrors['billingAddress.street']}</div>
                )}
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="billing-city">City *</label>
                  <input
                    type="text"
                    id="billing-city"
                    name="city"
                    value={billingAddress.city}
                    onChange={handleBillingAddressChange}
                    className={validationErrors['billingAddress.city'] ? 'error' : ''}
                    required
                  />
                  {validationErrors['billingAddress.city'] && (
                    <div className="error-text">{validationErrors['billingAddress.city']}</div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="billing-state">State/Province *</label>
                  <input
                    type="text"
                    id="billing-state"
                    name="state"
                    value={billingAddress.state}
                    onChange={handleBillingAddressChange}
                    className={validationErrors['billingAddress.state'] ? 'error' : ''}
                    required
                  />
                  {validationErrors['billingAddress.state'] && (
                    <div className="error-text">{validationErrors['billingAddress.state']}</div>
                  )}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="billing-postalCode">Postal Code *</label>
                  <input
                    type="text"
                    id="billing-postalCode"
                    name="postalCode"
                    value={billingAddress.postalCode}
                    onChange={handleBillingAddressChange}
                    className={validationErrors['billingAddress.postalCode'] ? 'error' : ''}
                    required
                  />
                  {validationErrors['billingAddress.postalCode'] && (
                    <div className="error-text">{validationErrors['billingAddress.postalCode']}</div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="billing-country">Country *</label>
                  <input
                    type="text"
                    id="billing-country"
                    name="country"
                    value={billingAddress.country}
                    onChange={handleBillingAddressChange}
                    className={validationErrors['billingAddress.country'] ? 'error' : ''}
                    required
                  />
                  {validationErrors['billingAddress.country'] && (
                    <div className="error-text">{validationErrors['billingAddress.country']}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="form-section">
          <h2>Shipping Address</h2>
          
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="hasShippingAddress"
              checked={hasShippingAddress}
              onChange={(e) => setHasShippingAddress(e.target.checked)}
            />
            <label htmlFor="hasShippingAddress">Add Shipping Address</label>
          </div>
          
          {hasShippingAddress && (
            <>
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="shippingSameAsBilling"
                  checked={shippingSameAsBilling}
                  onChange={handleShippingSameAsBilling}
                  disabled={!hasBillingAddress}
                />
                <label htmlFor="shippingSameAsBilling">
                  Same as Billing Address
                  {!hasBillingAddress && <span className="disabled-text"> (Add billing address first)</span>}
                </label>
              </div>
              
              {!shippingSameAsBilling && (
                <div className="address-fields">
                  <div className="form-group">
                    <label htmlFor="shipping-street">Street *</label>
                    <input
                      type="text"
                      id="shipping-street"
                      name="street"
                      value={shippingAddress.street}
                      onChange={handleShippingAddressChange}
                      className={validationErrors['shippingAddress.street'] ? 'error' : ''}
                      required
                    />
                    {validationErrors['shippingAddress.street'] && (
                      <div className="error-text">{validationErrors['shippingAddress.street']}</div>
                    )}
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="shipping-city">City *</label>
                      <input
                        type="text"
                        id="shipping-city"
                        name="city"
                        value={shippingAddress.city}
                        onChange={handleShippingAddressChange}
                        className={validationErrors['shippingAddress.city'] ? 'error' : ''}
                        required
                      />
                      {validationErrors['shippingAddress.city'] && (
                        <div className="error-text">{validationErrors['shippingAddress.city']}</div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="shipping-state">State/Province *</label>
                      <input
                        type="text"
                        id="shipping-state"
                        name="state"
                        value={shippingAddress.state}
                        onChange={handleShippingAddressChange}
                        className={validationErrors['shippingAddress.state'] ? 'error' : ''}
                        required
                      />
                      {validationErrors['shippingAddress.state'] && (
                        <div className="error-text">{validationErrors['shippingAddress.state']}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="shipping-postalCode">Postal Code *</label>
                      <input
                        type="text"
                        id="shipping-postalCode"
                        name="postalCode"
                        value={shippingAddress.postalCode}
                        onChange={handleShippingAddressChange}
                        className={validationErrors['shippingAddress.postalCode'] ? 'error' : ''}
                        required
                      />
                      {validationErrors['shippingAddress.postalCode'] && (
                        <div className="error-text">{validationErrors['shippingAddress.postalCode']}</div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="shipping-country">Country *</label>
                      <input
                        type="text"
                        id="shipping-country"
                        name="country"
                        value={shippingAddress.country}
                        onChange={handleShippingAddressChange}
                        className={validationErrors['shippingAddress.country'] ? 'error' : ''}
                        required
                      />
                      {validationErrors['shippingAddress.country'] && (
                        <div className="error-text">{validationErrors['shippingAddress.country']}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="form-section">
          <h2>Tags</h2>
          
          <div className="form-group">
            <label htmlFor="tagInput">Add Tags</label>
            <div className="tag-input-container">
              <input
                type="text"
                id="tagInput"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyPress={handleTagKeyPress}
                placeholder="Enter tag and press Enter"
              />
              <button type="button" onClick={addTag} className="btn-add-tag">
                Add
              </button>
            </div>
          </div>
          
          <div className="tags-container">
            {formData.tags && formData.tags.length > 0 ? (
              formData.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="btn-remove-tag"
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <p className="no-tags">No tags added</p>
            )}
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={handleReset} className="btn-secondary" disabled={loading}>
            Reset
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
};