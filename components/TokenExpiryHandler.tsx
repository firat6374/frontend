'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

function parseJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(decoded)));
  } catch {
    return null;
  }
}

export default function TokenExpiryHandler() {
  const router = useRouter();
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    function scheduleLogout() {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const token = localStorage.getItem('token');
      if (!token) return;

      const payload = parseJwt(token);
      if (!payload || !payload.exp) {
        // can't parse token expiry — be conservative and force logout
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }

      const expiryMs = payload.exp * 1000;
      const now = Date.now();
      const msUntil = expiryMs - now;

      if (msUntil <= 0) {
        // token already expired
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }

      // schedule logout a little after expiry (add 500ms buffer)
      timeoutRef.current = window.setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      }, msUntil + 500);
    }

    // schedule on mount
    scheduleLogout();

    // wrap global fetch to logout on 401 responses
    const win = window as any;
    const originalFetch = win.fetch;
    let wrapped = false;
    if (originalFetch && !win.__fetchWrappedByTokenHandler) {
      win.__fetchWrappedByTokenHandler = true;
      wrapped = true;
      win.fetch = async (...args: any[]) => {
        try {
          const response = await originalFetch(...args);
          if (response && response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/login');
          }
          return response;
        } catch (err) {
          throw err;
        }
      };
    }

    // also listen for storage changes (token changed in another tab)
    function onStorage(e: StorageEvent) {
      if (e.key === 'token') scheduleLogout();
      if (e.key === 'user' && !e.newValue) {
        // user removed -> navigate to login
        router.push('/login');
      }
    }

    window.addEventListener('storage', onStorage);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      window.removeEventListener('storage', onStorage);
      // restore original fetch if we wrapped it
      const win = window as any;
      if (win.__fetchWrappedByTokenHandler && wrapped) {
        win.fetch = originalFetch;
        delete win.__fetchWrappedByTokenHandler;
      }
    };
  }, [router]);

  return null;
}
