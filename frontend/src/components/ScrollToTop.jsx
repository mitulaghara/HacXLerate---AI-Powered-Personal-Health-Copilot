import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, search, hash, key } = useLocation();

  const performScrollTop = () => {
    // If there is an in-page hash anchor (e.g. #sec-history), scroll to it if found
    if (hash && hash !== '#') {
      try {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      } catch {}
    }

    // Unconditionally scroll window to top
    try {
      window.scrollTo(0, 0);
    } catch {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }

    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }

    const root = document.getElementById('root');
    if (root) root.scrollTop = 0;

    const mains = document.querySelectorAll('main');
    mains.forEach(m => {
      m.scrollTop = 0;
    });
  };

  // Disable browser automatic scroll restoration to prevent landing at previous scroll/footer
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      try {
        window.history.scrollRestoration = 'manual';
      } catch {}
    }
  }, []);

  // Synchronous reset before browser paint
  useLayoutEffect(() => {
    performScrollTop();
  }, [pathname, search, key]);

  // Secondary checks on next animation frame and after DOM layout settles
  useEffect(() => {
    performScrollTop();
    const raf = requestAnimationFrame(performScrollTop);
    const t1 = setTimeout(performScrollTop, 50);
    const t2 = setTimeout(performScrollTop, 150);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [pathname, search, key]);

  return null;
}
