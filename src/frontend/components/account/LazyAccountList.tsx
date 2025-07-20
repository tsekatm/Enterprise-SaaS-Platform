import React, { lazy, Suspense } from 'react';
import { AccountListProps } from '../../types/account';

// Lazy load the AccountList component
const AccountList = lazy(() => import('./AccountList').then(module => ({ default: module.AccountList })));

/**
 * Lazy-loaded Account List Component
 * 
 * This component uses React.lazy to defer loading the AccountList component
 * until it is needed, reducing the initial bundle size.
 */
export const LazyAccountList: React.FC<AccountListProps> = (props) => {
  return (
    <Suspense fallback={<div className="loading-placeholder">Loading account list...</div>}>
      <AccountList {...props} />
    </Suspense>
  );
};