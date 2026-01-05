'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeSwitcher from '@/components/ThemeSwitcher';

interface User {
  userId?: string;
  email: string;
  userFirstName?: string;
  userLastName?: string;
  isAdmin?: boolean;
}

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
  exchangeRate: number;
  isActive: boolean;
}

interface CustomerCurrency {
  customerCurrencyId: string;
  customerId: string;
  currencyId: string;
  amount: number;
  currency?: Currency;
}

interface NewUser {
  email: string;
  userFirstName: string;
  userLastName: string;
  userPassword: string;
}

interface UserListItem {
  userId: string;
  email: string;
  userFirstName: string;
  userLastName: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [allCustomerCurrencies, setAllCustomerCurrencies] = useState<Record<string, CustomerCurrency[]>>({});
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showLinkCurrencyModal, setShowLinkCurrencyModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showEditCurrencyModal, setShowEditCurrencyModal] = useState(false);
  const [showSetUserPasswordModal, setShowSetUserPasswordModal] = useState(false);
  const [showSetCustomerPasswordModal, setShowSetCustomerPasswordModal] = useState(false);
  const [, setEditingCustomer] = useState<Customer | null>(null);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<UserListItem | null>(null);
  const [selectedCustomerForPassword, setSelectedCustomerForPassword] = useState<Customer | null>(null);

  // Form states
  const [customerForm, setCustomerForm] = useState({
    customerId: '',
    customerName: '',
    customerAmount: 0,
    currencyId: '',
    amount: 0,
  });

  const [currencyForm, setCurrencyForm] = useState({
    currencyCode: '',
    currencyName: '',
  });

  const [linkCurrencyForm, setLinkCurrencyForm] = useState({
    currencyId: '',
    amount: 0,
  });

  const [userForm, setUserForm] = useState<NewUser>({
    email: '',
    userFirstName: '',
    userLastName: '',
    userPassword: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    password: '',
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchCustomers = useCallback(async (authToken: string) => {
    try {
      console.log('Fetching customers with token:', authToken ? 'Present' : 'Missing');
      const response = await fetch('https://firat63-001-site1.anytempurl.com/api/customer', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log('Customers fetch response status:', response.status);

      if (response.status === 401) {
        console.error('Token expired or invalid, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
        // Fetch currencies for all customers
        data.forEach((customer: Customer) => {
          fetchCustomerCurrencies(customer.customerId, authToken);
        });
      } else {
        const errorText = await response.text();
        console.error('Customers fetch error:', response.status, errorText);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  }, [router]);

  const fetchCurrencies = useCallback(async (authToken: string) => {
    try {
      console.log('Fetching currencies with token:', authToken ? 'Present' : 'Missing');
      const response = await fetch('https://firat63-001-site1.anytempurl.com/api/currency', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log('Currencies fetch response status:', response.status);

      if (response.status === 401) {
        console.error('Token expired or invalid, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setCurrencies(data);
      } else {
        const errorText = await response.text();
        console.error('Currencies fetch error:', response.status, errorText);
      }
    } catch (error) {
      console.error('Failed to fetch currencies:', error);
    }
  }, [router]);

  const fetchUsers = useCallback(async (authToken: string) => {
    try {
      const response = await fetch('https://firat63-001-site1.anytempurl.com/api/auth/users', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Failed to fetch users:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, [router]);

  // Auto logout after 10 minutes of inactivity
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      
      inactivityTimer = setTimeout(() => {
        console.log('10 minutes of inactivity, logging out...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      }, 10 * 60 * 1000); // 10 minutes
    };

    // Activity events to track
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Start the timer
    resetTimer();

    // Cleanup
    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [router]);

  useEffect(() => {
    // Guard against SSR: access localStorage only in browser
    if (typeof window === 'undefined') return;

    const userData = window.localStorage.getItem('user');
    let parsedUser: any = null;
    try {
      parsedUser = userData ? JSON.parse(userData) : null;
    } catch {
      parsedUser = null;
    }

    const savedToken = window.localStorage.getItem('token');

    if (!savedToken || !parsedUser) {
      router.push('/login');
      return;
    }

    // normalize parsed user
    const normalizedUser: User | null = parsedUser
      ? {
          userId: parsedUser.userId || parsedUser.userId || undefined,
          email: parsedUser.email || parsedUser.Email || '',
          userFirstName: parsedUser.userFirstName || parsedUser.firstName || parsedUser.userFirstName || undefined,
          userLastName: parsedUser.userLastName || parsedUser.lastName || parsedUser.userLastName || undefined
        }
      : null;

    setUser(normalizedUser);
    setToken(savedToken);
    // Use stable callbacks as dependencies to satisfy exhaustive-deps without loops
    fetchCustomers(savedToken);
    fetchCurrencies(savedToken);
    fetchUsers(savedToken);
  }, [router, fetchCustomers, fetchCurrencies, fetchUsers]);

  const isAdmin = user && user.email === 'admin@nur18gold.com';

  const fetchCustomerCurrencies = async (customerId: string, authToken: string) => {
    try {
      const response = await fetch(`https://firat63-001-site1.anytempurl.com/api/customercurrency/customer/${customerId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
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
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (!token) {
        setErrorMessage('Authentication token missing. Please log in again.');
        return;
      }
      // Basic client-side validation to prevent 400s
      const name = customerForm.customerName?.trim();
      if (!name) {
        setErrorMessage('Customer name is required.');
        return;
      }
      const response = await fetch('https://firat63-001-site1.anytempurl.com/api/customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerName: name,
          customerAmount: 0,
        }),
      });

      if (response.ok) {
        const newCustomer = await response.json();
        
        // Link currency to customer if selected
        if (customerForm.currencyId && customerForm.amount > 0) {
          try {
            await fetch('https://firat63-001-site1.anytempurl.com/api/customercurrency', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                customerId: newCustomer.customerId,
                currencyId: customerForm.currencyId,
                amount: customerForm.amount,
              }),
            });
          } catch (currencyError) {
            console.error('Failed to link currency:', currencyError);
          }
        }
        
        setSuccessMessage('Customer created successfully!');
        setCustomerForm({ customerId: '', customerName: '', customerAmount: 0, currencyId: '', amount: 0 });
        setShowCustomerModal(false);
        fetchCustomers(token);
      } else {
        // Try to extract a meaningful error message from ASP.NET validation
        let message = 'Failed to create customer';
        try {
          const errJson = await response.json();
          console.error('Create customer error:', errJson);
          
          // Handle ASP.NET validation errors
          if (errJson.errors) {
            const errorMessages = Object.values(errJson.errors).flat();
            message = errorMessages.join(', ');
          } else if (errJson.message) {
            message = errJson.message;
          } else if (errJson.title) {
            message = errJson.title;
          }
        } catch {
          try {
            const errText = await response.text();
            console.error('Create customer error text:', errText);
            message = errText || message;
          } catch {
            message = `Failed to create customer (${response.status})`;
          }
        }
        setErrorMessage(message);
      }
    } catch {
      setErrorMessage('An error occurred while creating customer');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('https://firat63-001-site1.anytempurl.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userForm),
      });

      if (response.ok) {
        setSuccessMessage('User created successfully!');
        setUserForm({
          email: '',
          userFirstName: '',
          userLastName: '',
          userPassword: '',
        });
        setShowUserModal(false);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Failed to create user');
      }
    } catch {
      setErrorMessage('An error occurred while creating user');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Validate form fields
    if (!currencyForm.currencyCode.trim() || !currencyForm.currencyName.trim()) {
      setErrorMessage('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (!token) {
      setErrorMessage('Authentication token missing. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        currencyCode: currencyForm.currencyCode.trim(),
        currencyName: currencyForm.currencyName.trim(),
        isActive: true,
      };

      console.log('Creating currency with payload:', payload);
      console.log('Token:', token ? 'Present' : 'Missing');

      const response = await fetch('https://firat63-001-site1.anytempurl.com/api/currency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log('Currency creation response status:', response.status);

      if (response.ok) {
        setSuccessMessage('Currency created successfully!');
        setCurrencyForm({
          currencyCode: '',
          currencyName: '',
        });
        setShowCurrencyModal(false);
        if (token) {
          fetchCurrencies(token);
        }
      } else {
        const errorText = await response.text();
        console.error('Currency creation error response:', errorText);
        
        let errorMessage = 'Failed to create currency';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        setErrorMessage(errorMessage);
      }
    } catch {
      setErrorMessage('An error occurred while creating currency');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedCustomer) {
      setErrorMessage('Please select a customer first');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('https://firat63-001-site1.anytempurl.com/api/customercurrency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: selectedCustomer.customerId,
          currencyId: linkCurrencyForm.currencyId,
          amount: parseFloat(linkCurrencyForm.amount.toString()),
        }),
      });

      if (response.ok) {
        setSuccessMessage('Currency linked successfully!');
        setLinkCurrencyForm({ currencyId: '', amount: 0 });
        setShowLinkCurrencyModal(false);
        if (token) {
          fetchCustomerCurrencies(selectedCustomer.customerId, token);
        }
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Failed to link currency');
      }
    } catch {
      setErrorMessage('An error occurred while linking currency');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCustomerCurrency = async (customerCurrencyId: string) => {
    if (!confirm('Are you sure you want to remove this currency from the customer?')) {
      return;
    }

    if (!token) {
      setErrorMessage('Authentication token missing. Please log in again.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`https://firat63-001-site1.anytempurl.com/api/customercurrency/${customerCurrencyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccessMessage('Currency removed successfully!');
        if (selectedCustomer && token) {
          fetchCustomerCurrencies(selectedCustomer.customerId, token);
        }
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Failed to remove currency');
      }
    } catch {
      setErrorMessage('An error occurred while removing currency');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      customerId: customer.customerId,
      customerName: customer.customerName,
      customerAmount: customer.customerAmount,
      currencyId: '',
      amount: 0,
    });
    setShowEditCustomerModal(true);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const name = customerForm.customerName?.trim();
      if (!name) {
        setErrorMessage('Customer name is required.');
        setLoading(false);
        return;
      }
      const response = await fetch(`https://firat63-001-site1.anytempurl.com/api/customer/${customerForm.customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: customerForm.customerId,
          customerName: name,
          customerAmount: parseFloat(customerForm.customerAmount.toString()),
        }),
      });

      if (response.ok) {
        setSuccessMessage('Customer updated successfully!');
        setShowEditCustomerModal(false);
        if (token) fetchCustomers(token);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Failed to update customer');
      }
    } catch {
      setErrorMessage('An error occurred while updating customer');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    setLoading(true);
    try {
      const response = await fetch(`https://firat63-001-site1.anytempurl.com/api/customer/${customerId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccessMessage('Customer deleted successfully!');
        if (token) fetchCustomers(token);
      } else {
        setErrorMessage('Failed to delete customer');
      }
    } catch {
      setErrorMessage('An error occurred while deleting customer');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserListItem) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      userFirstName: user.userFirstName,
      userLastName: user.userLastName,
      userPassword: '',
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(`https://firat63-001-site1.anytempurl.com/api/auth/users/${editingUser?.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userForm),
      });

      if (response.ok) {
        setSuccessMessage('User updated successfully!');
        setShowEditUserModal(false);
        if (token) fetchUsers(token);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Failed to update user');
      }
    } catch {
      setErrorMessage('An error occurred while updating user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    setLoading(true);
    try {
      const response = await fetch(`https://firat63-001-site1.anytempurl.com/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccessMessage('User deleted successfully!');
        if (token) fetchUsers(token);
      } else {
        setErrorMessage('Failed to delete user');
      }
    } catch {
      setErrorMessage('An error occurred while deleting user');
    } finally {
      setLoading(false);
    }
  };

  const handleSetUserPassword = (user: UserListItem) => {
    setSelectedUserForPassword(user);
    setPasswordForm({ password: '' });
    setShowSetUserPasswordModal(true);
  };

  const handleSetCustomerPassword = (customer: Customer) => {
    setSelectedCustomerForPassword(customer);
    setPasswordForm({ password: '' });
    setShowSetCustomerPasswordModal(true);
  };

  const handleSubmitUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (!passwordForm.password || passwordForm.password.length < 6) {
        setErrorMessage('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      const response = await fetch(`https://firat63-001-site1.anytempurl.com/api/auth/users/${selectedUserForPassword?.userId}/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: passwordForm.password,
        }),
      });

      if (response.ok) {
        setSuccessMessage(`Password set for ${selectedUserForPassword?.email} successfully!`);
        setShowSetUserPasswordModal(false);
        setPasswordForm({ password: '' });
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Failed to set password');
      }
    } catch {
      setErrorMessage('An error occurred while setting password');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCustomerPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (!passwordForm.password || passwordForm.password.length < 6) {
        setErrorMessage('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      const response = await fetch(`https://firat63-001-site1.anytempurl.com/api/auth/customers/${selectedCustomerForPassword?.customerId}/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: passwordForm.password,
        }),
      });

      if (response.ok) {
        setSuccessMessage(`Password set for ${selectedCustomerForPassword?.customerName} successfully!`);
        setShowSetCustomerPasswordModal(false);
        setPasswordForm({ password: '' });
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Failed to set password');
      }
    } catch {
      setErrorMessage('An error occurred while setting password');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCurrency = (currency: Currency) => {
    setEditingCurrency(currency);
    setCurrencyForm({
      currencyCode: currency.currencyCode,
      currencyName: currency.currencyName,
    });
    setShowEditCurrencyModal(true);
  };

  const handleUpdateCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(`https://firat63-001-site1.anytempurl.com/api/currency/${editingCurrency?.currencyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currencyId: editingCurrency?.currencyId,
          currencyCode: currencyForm.currencyCode,
          currencyName: currencyForm.currencyName,
          currencySymbol: editingCurrency?.currencySymbol,
          exchangeRate: editingCurrency?.exchangeRate,
          isActive: true,
        }),
      });

      if (response.ok) {
        setSuccessMessage('Currency updated successfully!');
        setShowEditCurrencyModal(false);
        if (token) fetchCurrencies(token);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Failed to update currency');
      }
    } catch {
      setErrorMessage('An error occurred while updating currency');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCurrency = async (currencyId: string) => {
    if (!confirm('Are you sure you want to delete this currency?')) return;

    setLoading(true);
    try {
      const response = await fetch(`https://firat63-001-site1.anytempurl.com/api/currency/${currencyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccessMessage('Currency deleted successfully!');
        if (token) fetchCurrencies(token);
      } else {
        setErrorMessage('Failed to delete currency');
      }
    } catch {
      setErrorMessage('An error occurred while deleting currency');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/80">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t('nav.dashboard')}
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <ThemeSwitcher />
              <LanguageSwitcher />
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                {user.email}
              </span>
              <a
                href="/financial-records"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              >
                {t('nav.financialRecords')}
              </a>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              >
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-8">
        {/* Messages */}
        {successMessage && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-400 rounded-lg text-sm">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-400 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <button
            onClick={() => setShowCustomerModal(true)}
            className="p-4 sm:p-6 bg-linear-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="text-2xl sm:text-3xl mb-2">➕</div>
            <div className="font-bold text-base sm:text-lg">{t('btn.addCustomer')}</div>
            <div className="text-xs sm:text-sm text-blue-100">{t('customer.createNew')}</div>
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowUserModal(true)}
              className="p-4 sm:p-6 bg-linear-to-br from-purple-500 to-pink-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-2xl sm:text-3xl mb-2">👤</div>
              <div className="font-bold text-base sm:text-lg">{t('btn.addUser')}</div>
              <div className="text-xs sm:text-sm text-purple-100">{t('user.createAccount')}</div>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setShowCurrencyModal(true)}
              className="p-4 sm:p-6 bg-linear-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-2xl sm:text-3xl mb-2">💱</div>
              <div className="font-bold text-base sm:text-lg">{t('btn.addCurrency')}</div>
              <div className="text-xs sm:text-sm text-emerald-100">{t('currency.createNew')}</div>
            </button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {/* Customers Summary */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 dark:bg-gray-800/80">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">All Customers</h3>
              <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full p-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{customers.length}</p>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {customers.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No customers yet</p>
              ) : (
                customers.map((customer) => (
                  <div key={customer.customerId} className="text-sm text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{customer.customerName}</p>
                      <p className="text-xs">Amount: ${customer.customerAmount.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleSetCustomerPassword(customer)}
                        className="p-1 text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30 rounded"
                        title="Set Password"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEditCustomer(customer)}
                        className="p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteCustomer(customer.customerId)}
                          className="p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Users Summary */}
          {isAdmin && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 dark:bg-gray-800/80">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">All Users</h3>
              <div className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{users.length}</p>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {users.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No users yet</p>
              ) : (
                users.map((u) => (
                  <div key={u.userId} className="text-sm text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{u.userFirstName} {u.userLastName}</p>
                      <p className="text-xs">{u.email}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleSetUserPassword(u)}
                        className="p-1 text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30 rounded"
                        title="Set Password"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEditUser(u)}
                        className="p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.userId)}
                        className="p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          )}

          {/* Currencies Summary */}
          {isAdmin && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 dark:bg-gray-800/80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">All Currencies</h3>
              <div className="bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{currencies.length}</p>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {currencies.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No currencies yet</p>
              ) : (
                currencies.map((currency) => (
                  <div key={currency.currencyId} className="text-sm text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{currency.currencyCode} - {currency.currencyName}</p>
                      <p className="text-xs">{currency.currencySymbol} | Rate: {currency.exchangeRate}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditCurrency(currency)}
                        className="p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteCurrency(currency.currencyId)}
                        className="p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          )}
        </div>

        {/* Customers List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 dark:bg-gray-800/80">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Customers ({customers.length})
            </h2>
            {customers.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No customers yet. Create one to get started!
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {customers.map((customer) => (
                  <button
                    key={customer.customerId}
                    onClick={() => {
                      setSelectedCustomer(customer);
                    }}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      selectedCustomer?.customerId === customer.customerId
                        ? 'bg-linear-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                        : 'bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <h3 className="font-bold text-sm">{customer.customerName}</h3>
                    {allCustomerCurrencies[customer.customerId] && allCustomerCurrencies[customer.customerId].length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {allCustomerCurrencies[customer.customerId].map((cc) => (
                          <span
                            key={cc.customerCurrencyId}
                            className={`text-xs px-2 py-0.5 rounded ${
                              selectedCustomer?.customerId === customer.customerId
                                ? 'bg-white/10 text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {cc.currency?.currencyCode}: {cc.currency?.currencySymbol}{cc.amount.toFixed(2)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs mt-1 opacity-75">Amount: ${customer.customerAmount?.toFixed(2) || '0.00'}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Customer Details */}
          {selectedCustomer && (
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">{selectedCustomer.customerName}</h2>
                <p className="text-blue-100">Customer Amount: ${selectedCustomer.customerAmount?.toFixed(2) || '0.00'}</p>
              </div>

              {/* Currencies for Customer */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 dark:bg-gray-800/80">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Currencies ({allCustomerCurrencies[selectedCustomer.customerId]?.length || 0})
                  </h3>
                  <button
                    onClick={() => setShowLinkCurrencyModal(true)}
                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    + Link Currency
                  </button>
                </div>

                {!allCustomerCurrencies[selectedCustomer.customerId] || allCustomerCurrencies[selectedCustomer.customerId].length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                    No currencies linked yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {allCustomerCurrencies[selectedCustomer.customerId].map((cc) => (
                      <div
                        key={cc.customerCurrencyId}
                        className="bg-linear-to-r from-emerald-50 to-teal-50 dark:from-gray-700 dark:to-gray-800 p-4 rounded-lg border border-emerald-200 dark:border-gray-700"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 dark:text-white">
                              {cc.currency?.currencyCode} - {cc.currency?.currencyName}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Amount: {cc.currency?.currencySymbol}{cc.amount.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-xs text-gray-600 dark:text-gray-400">Rate</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {cc.currency?.exchangeRate}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveCustomerCurrency(cc.customerCurrencyId)}
                              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                              title="Remove currency"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Create New Customer
            </h2>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  value={customerForm.customerName}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      customerName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currency Type
                </label>
                <select
                  required
                  value={customerForm.currencyId}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      currencyId: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a currency...</option>
                  {currencies.map((currency) => (
                    <option key={currency.currencyId} value={currency.currencyId}>
                      {currency.currencyCode} - {currency.currencyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={Number.isFinite(customerForm.amount) ? customerForm.amount : ''}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      amount: e.target.value === '' ? (undefined as unknown as number) : parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Customer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-8 max-w-md w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Create New User
            </h2>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm({ ...userForm, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={userForm.userFirstName}
                  onChange={(e) =>
                    setUserForm({ ...userForm, userFirstName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="First name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={userForm.userLastName}
                  onChange={(e) =>
                    setUserForm({ ...userForm, userLastName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Last name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={userForm.userPassword}
                  onChange={(e) =>
                    setUserForm({ ...userForm, userPassword: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  {loading ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Currency Creation Modal */}
      {showCurrencyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-linear-to-r from-emerald-500 to-teal-600 px-6 py-4 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">Add New Currency</h2>
            </div>
            <form onSubmit={handleCreateCurrency} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Currency Code (e.g., USD, EUR)
                </label>
                <input
                  type="text"
                  required
                  maxLength={3}
                  value={currencyForm.currencyCode}
                  onChange={(e) =>
                    setCurrencyForm({
                      ...currencyForm,
                      currencyCode: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white uppercase"
                  placeholder="USD"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Currency Name (e.g., US Dollar)
                </label>
                <input
                  type="text"
                  required
                  value={currencyForm.currencyName}
                  onChange={(e) =>
                    setCurrencyForm({
                      ...currencyForm,
                      currencyName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                  placeholder="US Dollar"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Currency'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCurrencyModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Currency Modal */}
      {showLinkCurrencyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-linear-to-r from-emerald-500 to-teal-600 px-6 py-4 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">Link Currency to Customer</h2>
            </div>
            {!selectedCustomer ? (
              <div className="p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Please select a customer first to link currencies.
                </p>
                <button
                  onClick={() => setShowLinkCurrencyModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleLinkCurrency} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Customer: {selectedCustomer.customerName}
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Select a currency to link to this customer
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Currency
                  </label>
                  <select
                    required
                    value={linkCurrencyForm.currencyId}
                    onChange={(e) =>
                      setLinkCurrencyForm({
                        ...linkCurrencyForm,
                        currencyId: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">-- Select Currency --</option>
                    {currencies.map((curr) => (
                      <option key={curr.currencyId} value={curr.currencyId}>
                        {curr.currencyCode} - {curr.currencyName} ({curr.currencySymbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={Number.isFinite(linkCurrencyForm.amount) ? linkCurrencyForm.amount : ''}
                    onChange={(e) =>
                      setLinkCurrencyForm({
                        ...linkCurrencyForm,
                        amount: e.target.value === '' ? 0 : parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading || !linkCurrencyForm.currencyId}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    {loading ? 'Linking...' : 'Link Currency'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLinkCurrencyModal(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditCustomerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Edit Customer
            </h2>

            <form onSubmit={handleUpdateCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  value={customerForm.customerName}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      customerName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer Amount ($)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={Number.isFinite(customerForm.customerAmount) ? customerForm.customerAmount : ''}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      customerAmount: e.target.value === '' ? (undefined as unknown as number) : parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  {loading ? 'Updating...' : 'Update Customer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditCustomerModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 my-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Edit User
            </h2>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm({ ...userForm, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={userForm.userFirstName}
                  onChange={(e) =>
                    setUserForm({ ...userForm, userFirstName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="First name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={userForm.userLastName}
                  onChange={(e) =>
                    setUserForm({ ...userForm, userLastName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Last name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password (Leave empty to keep current)
                </label>
                <input
                  type="password"
                  value={userForm.userPassword}
                  onChange={(e) =>
                    setUserForm({ ...userForm, userPassword: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="New password (optional)"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  {loading ? 'Updating...' : 'Update User'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Currency Modal */}
      {showEditCurrencyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-linear-to-r from-emerald-500 to-teal-600 px-6 py-4 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">Edit Currency</h2>
            </div>
            <form onSubmit={handleUpdateCurrency} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Currency Code (e.g., USD, EUR)
                </label>
                <input
                  type="text"
                  required
                  maxLength={3}
                  disabled
                  value={currencyForm.currencyCode}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed uppercase"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Code cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Currency Name (e.g., US Dollar)
                </label>
                <input
                  type="text"
                  required
                  value={currencyForm.currencyName}
                  onChange={(e) =>
                    setCurrencyForm({
                      ...currencyForm,
                      currencyName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                  placeholder="US Dollar"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  {loading ? 'Updating...' : 'Update Currency'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditCurrencyModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set User Password Modal */}
      {showSetUserPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Set User Password
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Setting password for: <span className="font-semibold">{selectedUserForPassword?.email}</span>
            </p>

            <form onSubmit={handleSubmitUserPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  {loading ? 'Setting...' : 'Set Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSetUserPasswordModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Customer Password Modal */}
      {showSetCustomerPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Set Customer Password
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Setting password for: <span className="font-semibold">{selectedCustomerForPassword?.customerName}</span>
            </p>

            <form onSubmit={handleSubmitCustomerPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  {loading ? 'Setting...' : 'Set Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSetCustomerPasswordModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

