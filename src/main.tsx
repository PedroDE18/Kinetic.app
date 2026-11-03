import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker, startNotificationScheduler } from './services/notificationService';

// Initialize Service Worker for iOS PWA and push/local notifications
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    registerServiceWorker();
    startNotificationScheduler();
  });
}

createRoot(document.getElementById('root')!).render(<App />);
