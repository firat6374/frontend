'use client';

import { useEffect, useState, useCallback } from 'react';
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
}

interface FinancialRecord {
  financialRecordId: string;
  userId: string;
  customerId: string;
  dateTime: string;
  dollarAmount: number;
  euroAmount: number;
  income: number;
  outcome: number;
  total: number;
  remaining: number;
  customer?: Customer;
  user?: User;
}

export default function FinancialRecordsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [, setUsers] = useState<User[]>([]);
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchCustomers(token);
    fetchRecords(token);
    fetchUsers(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const fetchCustomers = useCallback(async (token: string) => {
    try {
      const response = await fetch('https://firat63-001-site1.anytempurl.com/api/customer', {
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
  }, []);

  const fetchUsers = useCallback(async (token: string) => {
    try {
      const response = await fetch('https://firat63-001-site1.anytempurl.com/api/auth/users', {
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
  }, []);

  const fetchCustomerCurrencies = async (customerId: string, token: string) => {
    try {
      const response = await fetch(`https://firat63-001-site1.anytempurl.com/api/customercurrency/customer/${customerId}`, {
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
      const response = await fetch('https://firat63-001-site1.anytempurl.com/api/financialrecord', {
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
  }, []);

  const filteredRecords = selectedCustomer
    ? records.filter((r) => r.customerId === selectedCustomer.customerId)
    : [];

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
      
      const response = await fetch('https://firat63-001-site1.anytempurl.com/api/financialrecord', {
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
        if (selectedCustomer && selectedCustomer.customerId === addedCustomerId) {
          fetchCustomerCurrencies(addedCustomerId, token);
        }
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
      
      const response = await fetch('https://firat63-001-site1.anytempurl.com/api/financialrecord', {
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
        if (selectedCustomer && selectedCustomer.customerId === addedCustomerId) {
          fetchCustomerCurrencies(addedCustomerId, token);
        }
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
                                {allCustomerCurrencies[customer.customerId].map((cc) => (
                                  <div
                                    key={cc.customerCurrencyId}
                                    className={`flex items-center justify-between text-xs rounded px-2 py-1 ${
                                      selectedCustomer?.customerId === customer.customerId
                                        ? 'bg-white/10'
                                        : 'bg-gray-200'
                                    }`}
                                  >
                                    <span className="font-medium">{cc.currency?.currencyCode}</span>
                                    <span className="font-semibold">{cc.currency?.currencySymbol}{cc.amount.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className={`text-xs mt-0.5 ${
                                selectedCustomer?.customerId === customer.customerId
                                  ? 'text-blue-100'
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
                {/* Table Header */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="bg-linear-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left">
                          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wide">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {t('records.userName')}
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
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wide">{t('records.currency')}</th>
                        <th className="px-6 py-4 text-left">
                          <div className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wide">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {t('records.dateTime')}
                          </div>
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wide">{t('records.input')}</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wide">{t('records.output')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.length === 0 ? (
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
                        filteredRecords.map((record) => {
                          const dateTime = new Date(record.dateTime);
                          const userName = record.user 
                            ? `${record.user.userFirstName} ${record.user.userLastName}`
                            : 'Unknown';
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
                                <div className="flex items-center gap-2 text-gray-700">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <div>
                                    <div className="font-medium text-sm">
                                      {dateTime.toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                      })}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {dateTime.toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false,
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="bg-linear-to-r from-emerald-500 to-green-600 px-6 py-4 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">{t('modal.addIncome')}</h2>
            </div>
            <form onSubmit={handleAddIncome} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('customer.name')} <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={incomeForm.customerId}
                  onChange={(e) => setIncomeForm({ ...incomeForm, customerId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
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
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('modal.amount')}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm({ ...incomeForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('records.currency')}
                </label>
                <select
                  value={incomeForm.currency}
                  onChange={(e) => setIncomeForm({ ...incomeForm, currency: e.target.value as 'dollar' | 'euro' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="dollar">{t('currency.dollar')}</option>
                  <option value="euro">{t('currency.euro')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('modal.note')}
                </label>
                <textarea
                  value={incomeForm.note}
                  onChange={(e) => setIncomeForm({ ...incomeForm, note: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="bg-linear-to-r from-orange-500 to-red-600 px-6 py-4 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">{t('modal.addOutcome')}</h2>
            </div>
            <form onSubmit={handleAddOutcome} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('customer.name')} <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={outcomeForm.customerId}
                  onChange={(e) => setOutcomeForm({ ...outcomeForm, customerId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('modal.amount')}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={outcomeForm.amount}
                  onChange={(e) => setOutcomeForm({ ...outcomeForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('records.currency')}
                </label>
                <select
                  value={outcomeForm.currency}
                  onChange={(e) => setOutcomeForm({ ...outcomeForm, currency: e.target.value as 'dollar' | 'euro' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="dollar">{t('currency.dollar')}</option>
                  <option value="euro">{t('currency.euro')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('modal.note')}
                </label>
                <textarea
                  value={outcomeForm.note}
                  onChange={(e) => setOutcomeForm({ ...outcomeForm, note: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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

