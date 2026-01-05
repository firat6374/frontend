'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeSwitcher from '@/components/ThemeSwitcher';

interface Customer {
  customerId: string;
  customerName: string;
  customerAmount: number;
}

interface Currency {
  currencyId: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
}

interface CustomerCurrency {
  customerCurrencyId: string;
  customerId: string;
  currencyId: string;
  amount: number;
  currency?: Currency;
}

interface User {
  userId: string;
  email: string;
  userFirstName: string;
  userLastName: string;
  isAdmin?: boolean;
}

interface FinancialRecord {
  financialRecordId: string;
  userId: string;
  customerId: string;
  dateTime?: string;
  createdAt?: string;
  dollarAmount: number;
  euroAmount: number;
  income: number;
  outcome: number;
  total: number;
  remaining: number;
  customer?: Customer;
  user?: User;
  userName?: string;
}

export default function FinancialRecordsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allCustomerCurrencies, setAllCustomerCurrencies] = useState<Record<string, CustomerCurrency[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);
  const [showAddOutcomeModal, setShowAddOutcomeModal] = useState(false);
  const [incomeForm, setIncomeForm] = useState({
    customerId: '',
    amount: 0,
    currency: 'dollar' as 'dollar' | 'euro',
    note: '',
  });
  const [outcomeForm, setOutcomeForm] = useState({
    customerId: '',
    amount: 0,
    currency: 'dollar' as 'dollar' | 'euro',
    note: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // API base URL - set NEXT_PUBLIC_API_URL when deploying. Default to hosted backend URL.
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://firat63-001-site1.anytempurl.com';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // load current user from localStorage (set at login)
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const parsed = JSON.parse(userStr);
        // normalize field names to match `User` interface
        const cu: User = {
          userId: parsed.userId || parsed.id || '',
          email: parsed.email || parsed.Email || '',
          userFirstName: parsed.userFirstName || parsed.firstName || parsed.givenName || '',
          userLastName: parsed.userLastName || parsed.lastName || parsed.familyName || '',
          isAdmin: parsed.isAdmin ?? false,
        };
        setCurrentUser(cu);
      }
    } catch (e) {
      console.warn('Failed to parse current user from localStorage', e);
    }

    fetchCustomers(token);
    fetchRecords(token);
    fetchUsers(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const fetchCustomers = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/customer`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
        if (data.length > 0) {
          setSelectedCustomer(data[0]);
          // Fetch currencies for all customers
          data.forEach((customer: Customer) => {
            fetchCustomerCurrencies(customer.customerId, token);
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  }, [API_BASE]);

  const fetchUsers = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, [API_BASE]);

  const fetchCustomerCurrencies = async (customerId: string, token: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/customercurrency/customer/${customerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAllCustomerCurrencies(prev => ({
          ...prev,
          [customerId]: data
        }));
      }
    } catch (error) {
      console.error('Failed to fetch customer currencies:', error);
      setAllCustomerCurrencies(prev => ({
        ...prev,
        [customerId]: []
      }));
    }
  };

  const fetchRecords = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/financialrecord`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  const isAdmin = currentUser && currentUser.email === 'admin@nur18gold.com';

  const filteredRecords = selectedCustomer
    ? records.filter((r) => {
        if (r.customerId !== selectedCustomer.customerId) return false;
        return true; // Show all records for the selected customer
      })
    : [];

  // Sorting state: 'date' = Date Time, 'currency' = Currency, 'user' = User Name
  const [sortBy, setSortBy] = useState<'date' | 'currency' | 'user' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Reset to page 1 when filters or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCustomer, sortBy, sortDir]);

  const toggleSort = (col: 'date' | 'currency' | 'user') => {
    if (sortBy === col) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  const getRecordUserName = (record: FinancialRecord) => {
    if (record.userName && record.userName.trim() !== '') return record.userName;
    const resolved = record.user ?? users.find(u => u.userId === record.userId);
    if (resolved) return `${resolved.userFirstName} ${resolved.userLastName}`.trim();
    return 'Unknown';
  };

  const sortedRecords = useMemo(() => {
    if (!sortBy) return filteredRecords;
    const copy = [...filteredRecords];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') {
        const da = new Date(a.createdAt ?? a.dateTime ?? '').getTime() || 0;
        const db = new Date(b.createdAt ?? b.dateTime ?? '').getTime() || 0;
        cmp = da - db;
      } else if (sortBy === 'currency') {
        const ca = (a.dollarAmount !== 0) ? 'Dollar' : 'Euro';
        const cb = (b.dollarAmount !== 0) ? 'Dollar' : 'Euro';
        cmp = ca.localeCompare(cb);
      } else if (sortBy === 'user') {
        const ua = getRecordUserName(a).toLowerCase();
        const ub = getRecordUserName(b).toLowerCase();
        cmp = ua.localeCompare(ub);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [filteredRecords, sortBy, sortDir, getRecordUserName]);

  // Pagination calculations
  const totalRecords = sortedRecords.length;
  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalRecords);
  const paginatedRecords = sortedRecords.slice(startIndex, endIndex);

  // Reset to page 1 when items per page changes
  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      setErrorMessage('');
      
      const response = await fetch(`${API_BASE}/api/financialrecord`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: incomeForm.customerId,
          dollarAmount: incomeForm.currency === 'dollar' ? incomeForm.amount : 0,
          euroAmount: incomeForm.currency === 'euro' ? incomeForm.amount : 0,
          income: incomeForm.amount,
          outcome: 0,
          total: incomeForm.amount,
          remaining: incomeForm.amount,
          note: incomeForm.note,
        }),
      });

      if (response.ok) {
        setSuccessMessage('Income added successfully!');
        setShowAddIncomeModal(false);
        const addedCustomerId = incomeForm.customerId;
        setIncomeForm({ customerId: '', amount: 0, currency: 'dollar', note: '' });
        fetchRecords(token);
        fetchCustomers(token);
        // Always refresh the currencies for the affected customer
        fetchCustomerCurrencies(addedCustomerId, token);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Failed to add income');
      }
    } catch {
      setErrorMessage('An error occurred while adding income');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      setErrorMessage('');
      
      const response = await fetch(`${API_BASE}/api/financialrecord`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: outcomeForm.customerId,
          dollarAmount: outcomeForm.currency === 'dollar' ? -outcomeForm.amount : 0,
          euroAmount: outcomeForm.currency === 'euro' ? -outcomeForm.amount : 0,
          income: 0,
          outcome: outcomeForm.amount,
          total: -outcomeForm.amount,
          remaining: -outcomeForm.amount,
          note: outcomeForm.note,
        }),
      });

      if (response.ok) {
        setSuccessMessage('Outcome added successfully!');
        setShowAddOutcomeModal(false);
        const addedCustomerId = outcomeForm.customerId;
        setOutcomeForm({ customerId: '', amount: 0, currency: 'dollar', note: '' });
        fetchRecords(token);
        fetchCustomers(token);
        // Always refresh the currencies for the affected customer
        fetchCustomerCurrencies(addedCustomerId, token);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Failed to add outcome');
      }
    } catch {
      setErrorMessage('An error occurred while adding outcome');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t('records.title')}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <ThemeSwitcher />
              <LanguageSwitcher />
              <button
                onClick={() => setShowAddIncomeModal(true)}
                className="px-3 sm:px-5 py-2 sm:py-2.5 bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 flex items-center gap-1 sm:gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden sm:inline">{t('btn.addIncome')}</span>
                <span className="sm:hidden">{t('btn.income')}</span>
              </button>
              <button
                onClick={() => setShowAddOutcomeModal(true)}
                className="px-3 sm:px-5 py-2 sm:py-2.5 bg-linear-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 flex items-center gap-1 sm:gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                <span className="hidden sm:inline">{t('btn.addOutcome')}</span>
                <span className="sm:hidden">{t('btn.outcome')}</span>
              </button>
              <a
                href="/dashboard"
                className="px-3 sm:px-5 py-2 sm:py-2.5 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 flex items-center gap-1 sm:gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">{t('nav.dashboard')}</span>
              </a>
              <button
                onClick={handleLogout}
                className="px-3 sm:px-5 py-2 sm:py-2.5 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40">
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Sidebar - Customer List */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="bg-linear-to-r from-indigo-600 to-blue-600 px-4 sm:px-6 py-3 sm:py-4">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {t('customer.name')}
                </h2>
              </div>
              
              {/* Customer List */}
              <div className="p-2 sm:p-3">
                <div className="space-y-2 max-h-[300px] sm:max-h-[400px] lg:max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {customers.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-gray-500 text-sm">{t('msg.noCustomers')}</p>
                    </div>
                  ) : (
                    customers.map((customer) => (
                      <button
                        key={customer.customerId}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          const token = localStorage.getItem('token');
                          if (token) {
                            fetchCustomerCurrencies(customer.customerId, token);
                          }
                        }}
                        className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 ${
                          selectedCustomer?.customerId === customer.customerId
                            ? 'bg-linear-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 border-2 border-blue-400'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-2 border-transparent hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                            selectedCustomer?.customerId === customer.customerId
                              ? 'bg-white/20'
                              : 'bg-linear-to-br from-blue-100 to-indigo-100 text-blue-600'
                          }`}>
                            {customer.customerName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-base">{customer.customerName}</div>
                            {allCustomerCurrencies[customer.customerId]?.length > 0 ? (
                              <div className="mt-2 space-y-1">
                                {allCustomerCurrencies[customer.customerId].map((cc) => {
                                  const isPositive = cc.amount > 0;
                                  const isNegative = cc.amount < 0;
                                  const isSelected = selectedCustomer?.customerId === customer.customerId;
                                  return (
                                    <div
                                      key={cc.customerCurrencyId}
                                      className={`flex items-center justify-between text-xs rounded px-2 py-1 ${
                                        isSelected
                                          ? 'bg-white/10'
                                          : 'bg-gray-200'
                                      }`}
                                    >
                                      <span className="font-medium">{cc.currency?.currencyCode}</span>
                                      <span className={`font-semibold ${
                                        isSelected 
                                          ? (isPositive ? 'text-green-200' : isNegative ? 'text-red-200' : 'text-white')
                                          : (isPositive ? 'text-green-700' : isNegative ? 'text-red-700' : '')
                                      }`}>
                                        {cc.currency?.currencySymbol}{cc.amount.toFixed(2)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className={`text-xs mt-0.5 ${
                                selectedCustomer?.customerId === customer.customerId
                                  ? 'text-blue-100'
                                  : customer.customerAmount > 0 
                                    ? 'text-green-700' 
                                    : customer.customerAmount < 0 
                                      ? 'text-red-700' 
                                      : 'text-gray-500'
                              }`}>
                                {t('customer.amount')}: ${customer.customerAmount.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Financial Records Table */}
          <div className="lg:col-span-8 xl:col-span-9">
            {selectedCustomer ? (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Current User Section */}
                {currentUser && (
                  <div className="bg-linear-to-r from-indigo-50 to-blue-50 px-6 py-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        isAdmin ? 'bg-linear-to-br from-indigo-500 to-purple-600' : 'bg-linear-to-br from-blue-500 to-cyan-600'
                      }`}>
                        {currentUser.userFirstName.charAt(0)}{currentUser.userLastName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">
                            {currentUser.userFirstName} {currentUser.userLastName}
                          </span>
                          {isAdmin && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">{currentUser.email}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Table Header */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="bg-linear-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left cursor-pointer select-none" onClick={() => toggleSort('user')}>
                          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wide">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {t('records.userName')}
                            {sortBy === 'user' && <span className="ml-2">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left">
                          <div className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wide">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                            {t('records.type')}
                          </div>
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wide">{t('records.amount')}</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wide cursor-pointer select-none" onClick={() => toggleSort('currency')}>
                          {t('records.currency')}
                          {sortBy === 'currency' && <span className="ml-2">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                        </th>
                        <th className="px-6 py-4 text-left cursor-pointer select-none" onClick={() => toggleSort('date')}>
                          <div className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wide">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {t('records.dateTime')}
                            {sortBy === 'date' && <span className="ml-2">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                          </div>
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wide">{t('records.input')}</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wide">{t('records.output')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRecords.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-3 sm:px-6 py-8 sm:py-16">
                            <div className="text-center">
                              <svg className="w-12 sm:w-20 h-12 sm:h-20 mx-auto text-gray-300 mb-2 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-gray-500 text-lg font-medium">{t('msg.noRecords')}</p>
                              <p className="text-gray-400 text-sm mt-1">{t('msg.noTransactions')}</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedRecords.map((record) => {
                          const dateTime = new Date(record.createdAt ?? record.dateTime ?? '');
                          // Prefer backend-provided `userName` (added to DTO). Fallback to nested `user` or users list.
                          const userName = getRecordUserName(record);
                          const isIncome = record.income > 0;
                          const isDollar = record.dollarAmount !== 0;
                          const amount = isDollar ? Math.abs(record.dollarAmount) : Math.abs(record.euroAmount);
                          const currency = isDollar ? 'Dollar' : 'Euro';
                          const currencySymbol = isDollar ? '$' : '€';

                          return (
                            <tr 
                              key={record.financialRecordId} 
                              className="border-b border-gray-100 hover:bg-linear-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                                    {userName.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-gray-900 font-medium">{userName}</span>
                                </div>
                              </td>
                              
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                                  isIncome
                                    ? 'bg-linear-to-r from-emerald-50 to-green-50 text-green-700 border border-green-200'
                                    : 'bg-linear-to-r from-red-50 to-rose-50 text-red-700 border border-red-200'
                                }`}>
                                  {isIncome ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                  )}
                                  {isIncome ? 'Input' : 'Output'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-gray-900 font-bold text-lg">
                                  {amount.toFixed(0)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${
                                  isDollar 
                                    ? 'bg-linear-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200'
                                    : 'bg-linear-to-r from-purple-50 to-pink-50 text-purple-700 border border-purple-200'
                                }`}>
                                  <span className="font-bold">{currencySymbol}</span>
                                  {currency}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className={`flex items-center gap-2 ${isIncome ? 'text-green-700' : 'text-red-700'}`}>
                                  <svg className={`w-4 h-4 ${isIncome ? 'text-emerald-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <div>
                                    <div className="font-medium text-sm">
                                      {dateTime.toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        timeZone: 'Europe/Istanbul',
                                      })}
                                    </div>
                                    <div className={`text-xs flex items-center gap-1 ${isIncome ? 'text-emerald-500' : 'text-red-500'}`}>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {dateTime.toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false,
                                        timeZone: 'Europe/Istanbul',
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {isIncome && (
                                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-lg">
                                    {amount.toFixed(0)}
                                    <span className="text-emerald-500">+</span>
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {!isIncome && (
                                  <span className="inline-flex items-center gap-1 text-red-600 font-bold text-lg">
                                    {amount.toFixed(0)}
                                    <span className="text-red-500">-</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {sortedRecords.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Items per page selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{t('pagination.show')}</span>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{t('pagination.perPage')}</span>
                      </div>

                      {/* Pagination info */}
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {t('pagination.showing')} <span className="font-semibold">{startIndex + 1}</span> {t('pagination.to')}{' '}
                        <span className="font-semibold">{endIndex}</span> {t('pagination.of')}{' '}
                        <span className="font-semibold">{totalRecords}</span> {t('pagination.records')}
                      </div>

                      {/* Page navigation */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {t('pagination.previous')}
                        </button>

                        <div className="flex items-center gap-1 mx-2">
                          {getPageNumbers().map((page, idx) => (
                            page === '...' ? (
                              <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
                            ) : (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page as number)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                  currentPage === page
                                    ? 'bg-blue-600 text-white'
                                    : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {page}
                              </button>
                            )
                          ))}
                        </div>

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {t('pagination.next')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-16">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-linear-to-br from-blue-100 to-indigo-100 mb-6">
                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('msg.selectCustomer')}</h3>
                  <p className="text-gray-500">{t('msg.chooseCustomer')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {errorMessage}
        </div>
      )}

      {/* Add Income Modal */}
      {showAddIncomeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="bg-linear-to-r from-emerald-500 to-green-600 px-6 py-4 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">{t('modal.addIncome')}</h2>
            </div>
            <form onSubmit={handleAddIncome} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t('customer.name')} <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={incomeForm.customerId}
                  onChange={(e) => setIncomeForm({ ...incomeForm, customerId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">{t('modal.selectCustomer')}</option>
                  {customers.map((customer) => (
                    <option key={customer.customerId} value={customer.customerId}>
                      {customer.customerName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t('modal.amount')}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm({ ...incomeForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t('records.currency')}
                </label>
                <select
                  value={incomeForm.currency}
                  onChange={(e) => setIncomeForm({ ...incomeForm, currency: e.target.value as 'dollar' | 'euro' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="dollar">{t('currency.dollar')}</option>
                  <option value="euro">{t('currency.euro')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t('modal.note')}
                </label>
                <textarea
                  value={incomeForm.note}
                  onChange={(e) => setIncomeForm({ ...incomeForm, note: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-emerald-500"
                  placeholder={t('modal.addNote')}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  {loading ? t('modal.adding') : t('btn.addIncome')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddIncomeModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  {t('btn.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Outcome Modal */}
      {showAddOutcomeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="bg-linear-to-r from-orange-500 to-red-600 px-6 py-4 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">{t('modal.addOutcome')}</h2>
            </div>
            <form onSubmit={handleAddOutcome} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t('customer.name')} <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={outcomeForm.customerId}
                  onChange={(e) => setOutcomeForm({ ...outcomeForm, customerId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">{t('modal.selectCustomer')}</option>
                  {customers.map((customer) => (
                    <option key={customer.customerId} value={customer.customerId}>
                      {customer.customerName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t('modal.amount')}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={outcomeForm.amount}
                  onChange={(e) => setOutcomeForm({ ...outcomeForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-orange-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t('records.currency')}
                </label>
                <select
                  value={outcomeForm.currency}
                  onChange={(e) => setOutcomeForm({ ...outcomeForm, currency: e.target.value as 'dollar' | 'euro' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="dollar">{t('currency.dollar')}</option>
                  <option value="euro">{t('currency.euro')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t('modal.note')}
                </label>
                <textarea
                  value={outcomeForm.note}
                  onChange={(e) => setOutcomeForm({ ...outcomeForm, note: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-orange-500"
                  placeholder={t('modal.addNote')}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  {loading ? t('modal.adding') : t('btn.addOutcome')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddOutcomeModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  {t('btn.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

