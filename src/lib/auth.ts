import { useState, useEffect } from 'react';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role?: string;
}

export function getMockUser(): User | null {
  const data = localStorage.getItem('mockUser');
  return data ? JSON.parse(data) : null;
}

export function setMockUser(user: User | null) {
  if (user) {
    localStorage.setItem('mockUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('mockUser');
  }
  window.dispatchEvent(new Event('auth-change'));
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(getMockUser());

  useEffect(() => {
    const handleAuthChange = () => setUser(getMockUser());
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  return { user };
}
