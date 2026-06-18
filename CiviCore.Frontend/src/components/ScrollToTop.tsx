// @ts-nocheck
import { useState, useEffect } from 'react';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(globalThis.scrollY > 300);
    globalThis.addEventListener('scroll', onScroll);
    return () => globalThis.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => globalThis.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 active:scale-95 transition-all duration-200"
    >
      <span className="material-icons text-lg">arrow_upward</span>
    </button>
  );
}
