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
      className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-[#b45309] hover:bg-[#8b4006] dark:bg-[#d97706] dark:hover:bg-[#b45309] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all duration-200 cursor-pointer"
    >
      <span className="material-icons text-lg">arrow_upward</span>
    </button>
  );
}
