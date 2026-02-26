import { useState, useEffect } from 'react';
import { FiDownload, FiX } from 'react-icons/fi';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#4880FF',
      color: 'white',
      padding: '16px 24px',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      zIndex: 10000,
      maxWidth: '90%',
      animation: 'slideUp 0.3s ease-out'
    }}>
      <FiDownload size={24} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
          Install StockFlow
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          Install our app for quick access and offline use
        </div>
      </div>
      <button
        onClick={handleInstall}
        style={{
          backgroundColor: 'white',
          color: '#4880FF',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '6px',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Install
      </button>
      <button
        onClick={handleDismiss}
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: '4px'
        }}
      >
        <FiX size={20} />
      </button>
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default InstallPrompt;
