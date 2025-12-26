'use client';

import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'tr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.financialRecords': 'Financial Records',
    'nav.logout': 'Logout',
    'nav.adminDashboard': 'Admin Dashboard',
    'nav.welcome': 'Welcome',
    
    // Buttons
    'btn.addIncome': 'Add Income',
    'btn.addOutcome': 'Add Outcome',
    'btn.income': 'Income',
    'btn.outcome': 'Outcome',
    'btn.addCustomer': 'Add Customer',
    'btn.addUser': 'Add User',
    'btn.addCurrency': 'Add Currency',
    'btn.create': 'Create',
    'btn.cancel': 'Cancel',
    'btn.save': 'Save',
    'btn.delete': 'Delete',
    'btn.edit': 'Edit',
    'btn.linkCurrency': 'Link Currency',
    'btn.close': 'Close',
    
    // Customer
    'customer.name': 'Customer Name',
    'customer.amount': 'Amount',
    'customer.createNew': 'Create New Customer',
    'customer.select': 'Select a Customer',
    'customer.selectDescription': 'Choose a customer from the list to view their financial records',
    'customer.noCustomers': 'No customers yet. Create one to get started!',
    'customer.allCustomers': 'All Customers',
    'customer.noCustomersYet': 'No customers yet',
    
    // Financial Records
    'records.title': 'Financial Records',
    'records.userName': 'User Name',
    'records.typeOfOperation': 'Type of operation',
    'records.amount': 'Amount',
    'records.currency': 'Currency',
    'records.dateTime': 'Date Time',
    'records.input': 'Input',
    'records.output': 'Output',
    'records.noRecords': 'No records found',
    'records.noRecordsDescription': 'This customer has no financial transactions yet',
    
    // Modals
    'modal.addIncome': 'Add Income',
    'modal.addOutcome': 'Add Outcome',
    'modal.customer': 'Customer',
    'modal.selectCustomer': 'Select a customer...',
    'modal.amount': 'Amount',
    'modal.currency': 'Currency',
    'modal.note': 'Note (Optional)',
    'modal.addNote': 'Add a note...',
    'modal.adding': 'Adding...',
    'modal.creating': 'Creating...',
    
    // Currency
    'currency.dollar': 'Dollar',
    'currency.euro': 'Euro',
    'currency.type': 'Currency Type',
    'currency.code': 'Currency Code',
    'currency.name': 'Currency Name',
    'currency.symbol': 'Currency Symbol',
    'currency.exchangeRate': 'Exchange Rate',
    'currency.allCurrencies': 'All Currencies',
    'currency.noCurrencies': 'No currencies yet',
    'currency.addNew': 'Add New Currency',
    'currency.createNew': 'Create a new currency type',
    
    // User
    'user.email': 'Email Address',
    'user.firstName': 'First Name',
    'user.lastName': 'Last Name',
    'user.password': 'Password',
    'user.createNew': 'Create New User',
    'user.createNewAccount': 'Create a new user account',
    'user.allUsers': 'All Users',
    'user.noUsers': 'No users yet',
    
    // Messages
    'msg.success': 'Success',
    'msg.error': 'Error',
    'msg.loading': 'Loading...',
    'msg.incomeAdded': 'Income added successfully!',
    'msg.outcomeAdded': 'Outcome added successfully!',
    'msg.customerCreated': 'Customer created successfully!',
    'msg.userCreated': 'User created successfully!',
    'msg.currencyCreated': 'Currency created successfully!',
    
    // Operations
    'op.input': 'Input',
    'op.output': 'Output',
    
    // Placeholders
    'placeholder.enterCustomerName': 'Enter customer name',
    'placeholder.selectCurrency': 'Select a currency...',
    'placeholder.amount': '0.00',
    'placeholder.email': 'user@example.com',
    'placeholder.firstName': 'First name',
    'placeholder.lastName': 'Last name',
    'placeholder.password': 'Minimum 6 characters',
  },
  tr: {
    // Navigation
    'nav.dashboard': 'Kontrol Paneli',
    'nav.financialRecords': 'Mali Kayıtlar',
    'nav.logout': 'Çıkış',
    'nav.adminDashboard': 'Yönetici Paneli',
    'nav.welcome': 'Hoş geldiniz',
    
    // Buttons
    'btn.addIncome': 'Gelir Ekle',
    'btn.addOutcome': 'Gider Ekle',
    'btn.income': 'Gelir',
    'btn.outcome': 'Gider',
    'btn.addCustomer': 'Müşteri Ekle',
    'btn.addUser': 'Kullanıcı Ekle',
    'btn.addCurrency': 'Para Birimi Ekle',
    'btn.create': 'Oluştur',
    'btn.cancel': 'İptal',
    'btn.save': 'Kaydet',
    'btn.delete': 'Sil',
    'btn.edit': 'Düzenle',
    'btn.linkCurrency': 'Para Birimi Bağla',
    'btn.close': 'Kapat',
    
    // Customer
    'customer.name': 'Müşteri Adı',
    'customer.amount': 'Tutar',
    'customer.createNew': 'Yeni Müşteri Oluştur',
    'customer.select': 'Müşteri Seçin',
    'customer.selectDescription': 'Mali kayıtlarını görüntülemek için listeden bir müşteri seçin',
    'customer.noCustomers': 'Henüz müşteri yok. Başlamak için bir tane oluşturun!',
    'customer.allCustomers': 'Tüm Müşteriler',
    'customer.noCustomersYet': 'Henüz müşteri yok',
    
    // Financial Records
    'records.title': 'Mali Kayıtlar',
    'records.userName': 'Kullanıcı Adı',
    'records.typeOfOperation': 'İşlem Türü',
    'records.amount': 'Tutar',
    'records.currency': 'Para Birimi',
    'records.dateTime': 'Tarih Saat',
    'records.input': 'Giriş',
    'records.output': 'Çıkış',
    'records.noRecords': 'Kayıt bulunamadı',
    'records.noRecordsDescription': 'Bu müşterinin henüz mali işlemi yok',
    
    // Modals
    'modal.addIncome': 'Gelir Ekle',
    'modal.addOutcome': 'Gider Ekle',
    'modal.customer': 'Müşteri',
    'modal.selectCustomer': 'Bir müşteri seçin...',
    'modal.amount': 'Tutar',
    'modal.currency': 'Para Birimi',
    'modal.note': 'Not (İsteğe Bağlı)',
    'modal.addNote': 'Bir not ekleyin...',
    'modal.adding': 'Ekleniyor...',
    'modal.creating': 'Oluşturuluyor...',
    
    // Currency
    'currency.dollar': 'Dolar',
    'currency.euro': 'Euro',
    'currency.type': 'Para Birimi Türü',
    'currency.code': 'Para Birimi Kodu',
    'currency.name': 'Para Birimi Adı',
    'currency.symbol': 'Para Birimi Sembolü',
    'currency.exchangeRate': 'Döviz Kuru',
    'currency.allCurrencies': 'Tüm Para Birimleri',
    'currency.noCurrencies': 'Henüz para birimi yok',
    'currency.addNew': 'Yeni Para Birimi Ekle',
    'currency.createNew': 'Yeni bir para birimi türü oluşturun',
    
    // User
    'user.email': 'E-posta Adresi',
    'user.firstName': 'Ad',
    'user.lastName': 'Soyad',
    'user.password': 'Şifre',
    'user.createNew': 'Yeni Kullanıcı Oluştur',
    'user.createNewAccount': 'Yeni bir kullanıcı hesabı oluşturun',
    'user.allUsers': 'Tüm Kullanıcılar',
    'user.noUsers': 'Henüz kullanıcı yok',
    
    // Messages
    'msg.success': 'Başarılı',
    'msg.error': 'Hata',
    'msg.loading': 'Yükleniyor...',
    'msg.incomeAdded': 'Gelir başarıyla eklendi!',
    'msg.outcomeAdded': 'Gider başarıyla eklendi!',
    'msg.customerCreated': 'Müşteri başarıyla oluşturuldu!',
    'msg.userCreated': 'Kullanıcı başarıyla oluşturuldu!',
    'msg.currencyCreated': 'Para birimi başarıyla oluşturuldu!',
    
    // Operations
    'op.input': 'Giriş',
    'op.output': 'Çıkış',
    
    // Placeholders
    'placeholder.enterCustomerName': 'Müşteri adını girin',
    'placeholder.selectCurrency': 'Bir para birimi seçin...',
    'placeholder.amount': '0.00',
    'placeholder.email': 'kullanici@example.com',
    'placeholder.firstName': 'Ad',
    'placeholder.lastName': 'Soyad',
    'placeholder.password': 'En az 6 karakter',
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language;
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'tr')) {
        return savedLanguage;
      }
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
