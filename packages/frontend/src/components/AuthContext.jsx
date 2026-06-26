'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) throw new Error('No token');
        
        const res = await fetch('http://localhost:4000/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Token invalid');
        
        const data = await res.json();
        setUser(data.data);
      } catch (err) {
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/documents') || pathname?.startsWith('/search')) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [pathname, router]);

  const login = async (email, password) => {
    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Login failed');
      }
      
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      setUser(data.data.user);
      router.push('/dashboard');
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Network error: Unable to reach the server.');
      }
      throw err;
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await fetch('http://localhost:4000/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
