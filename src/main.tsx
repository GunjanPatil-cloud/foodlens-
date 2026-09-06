// Environment guard: ensure window.fetch can be assigned without throwing read-only getter errors
if (typeof window !== 'undefined') {
  try {
    const desc = Object.getOwnPropertyDescriptor(window, 'fetch') ||
                 Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window), 'fetch');
    if (desc && desc.get && !desc.set) {
      let customFetch: typeof window.fetch | null = null;
      const nativeFetch = window.fetch.bind(window);
      Object.defineProperty(window, 'fetch', {
        get() {
          return customFetch || nativeFetch;
        },
        set(fn) {
          customFetch = fn;
        },
        configurable: true,
        enumerable: true
      });
    }
  } catch (_) {
    // Ignore if not permitted
  }
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
