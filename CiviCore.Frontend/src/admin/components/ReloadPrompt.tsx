// @ts-nocheck
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useState, useEffect } from 'react';

export default function ReloadPrompt() {
  const [show, setShow] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every 60 seconds
      if (r) setInterval(() => r.update(), 60 * 1000);
    },
  });

  useEffect(() => {
    if (needRefresh) setShow(true);
  }, [needRefresh]);

  const close = () => {
    setShow(false);
    setNeedRefresh(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] animate-slide-up">
      <div className="flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-2xl shadow-2xl shadow-primary/30 border border-white/10">
        <span className="material-icons text-[20px] text-white/80">system_update</span>
        <p className="text-sm font-medium">A new version is available!</p>
        <button
          onClick={() => updateServiceWorker(true)}
          className="ml-2 px-3 py-1.5 bg-white text-primary text-xs font-bold rounded-lg hover:bg-white/90 transition-colors"
        >
          Update
        </button>
        <button
          onClick={close}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <span className="material-icons text-[16px]">close</span>
        </button>
      </div>
    </div>
  );
}
