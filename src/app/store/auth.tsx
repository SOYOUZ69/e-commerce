import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearCustomerToken,
  customerLogin,
  customerMe,
  customerRegister,
  getCustomerToken,
  setCustomerToken,
} from '../api/auth';

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
};

const AuthContext = createContext<{
  customer: Customer | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
} | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = async () => {
    const token = getCustomerToken();
    if (!token) {
      setCustomer(null);
      setLoading(false);
      return;
    }
    try {
      const data = await customerMe();
      setCustomer(data);
    } catch {
      clearCustomerToken();
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrate();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await customerLogin({ email, password });
    setCustomerToken(data.token);
    setCustomer(data.customer);
  };

  const register = async (payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }) => {
    const data = await customerRegister(payload);
    setCustomerToken(data.token);
    setCustomer(data.customer);
  };

  const logout = () => {
    clearCustomerToken();
    setCustomer(null);
  };

  const refresh = async () => {
    try {
      const data = await customerMe();
      setCustomer(data);
    } catch {
      clearCustomerToken();
      setCustomer(null);
    }
  };

  const value = useMemo(
    () => ({
      customer,
      loading,
      login,
      register,
      logout,
      refresh,
    }),
    [customer, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
