/**
 * Eunoia Notification Service
 * Native support for iOS Web App (Safari iOS 16.4+ standalone Home Screen PWA)
 * and modern desktop/Android browsers.
 */

export interface ReminderConfig {
  enabled: boolean;
  morningEnabled: boolean;
  morningTime: string; // "HH:MM" e.g. "08:00"
  middayEnabled: boolean;
  middayTime: string;  // "HH:MM" e.g. "13:00"
  eveningEnabled: boolean;
  eveningTime: string; // "HH:MM" e.g. "21:00"
}

export const DEFAULT_REMINDER_CONFIG: ReminderConfig = {
  enabled: false,
  morningEnabled: true,
  morningTime: '08:00',
  middayEnabled: false,
  middayTime: '13:00',
  eveningEnabled: true,
  eveningTime: '21:00',
};

const STORAGE_KEY = 'eunoia_notification_config_v1';

/**
 * Detects whether the current device is running iOS (iPhone, iPad, iPod)
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Detects whether the app is running in Standalone PWA mode (added to Home Screen)
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true ||
    document.referrer.includes('homescreen')
  );
}

/**
 * Checks if the Notification API is supported in the current context
 */
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Returns current permission status ('granted' | 'denied' | 'default' | 'unsupported')
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Registers the Service Worker for push notifications & offline support
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('./sw.js', {
      scope: './',
    });
    return registration;
  } catch (err) {
    console.warn('[Eunoia] Service worker registration failed:', err);
    return null;
  }
}

/**
 * Requests notification permission from the user (Must be triggered by user gesture)
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    throw new Error('Notifications are not supported in this browser environment');
  }

  // Ensure service worker is registered first (critical for iOS)
  await registerServiceWorker();

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Sends a notification immediately through the Service Worker (or fallback to Notification constructor)
 */
export async function sendNotification(
  title: string,
  body: string,
  tag = 'eunoia-alert'
): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    if (reg && reg.showNotification) {
      await reg.showNotification(title, {
        body,
        icon: './apple-touch-icon.png',
        badge: './apple-touch-icon.png',
        tag,
        ...({ vibrate: [100, 50, 100] } as any),
      });
      return true;
    }
  } catch (err) {
    console.warn('[Eunoia] SW notification dispatch failed, trying fallback constructor:', err);
  }

  // Fallback for non-SW browsers
  try {
    new Notification(title, {
      body,
      icon: './apple-touch-icon.png',
      tag,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Sends a test notification to verify iPhone / browser notifications
 */
export async function sendTestNotification(isPortuguese = false): Promise<boolean> {
  const title = isPortuguese ? 'Eunoia • Intenção Diária' : 'Eunoia • Daily Deliberation';
  const body = isPortuguese
    ? 'Viva deliberadamente hoje. Cuide da sua mente e do seu corpo.'
    : 'Live deliberately today. Focus on what is within your control.';

  return sendNotification(title, body, 'eunoia-test');
}

/**
 * Loads saved notification reminder preferences
 */
export function loadReminderConfig(): ReminderConfig {
  if (typeof window === 'undefined') return DEFAULT_REMINDER_CONFIG;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_REMINDER_CONFIG;
    return { ...DEFAULT_REMINDER_CONFIG, ...JSON.parse(saved) };
  } catch {
    return DEFAULT_REMINDER_CONFIG;
  }
}

/**
 * Saves notification reminder preferences
 */
export function saveReminderConfig(config: ReminderConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save reminder config:', err);
  }
}

/**
 * Daily scheduler check (checks once every minute if an active reminder is due)
 */
let schedulerInterval: number | null = null;
let lastNotifiedMinute = '';

export function startNotificationScheduler(isPortuguese = false): void {
  if (typeof window === 'undefined' || schedulerInterval !== null) return;

  const checkReminders = () => {
    const config = loadReminderConfig();
    if (!config.enabled || Notification.permission !== 'granted') return;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}`;

    if (currentTimeStr === lastNotifiedMinute) return;

    if (config.morningEnabled && currentTimeStr === config.morningTime) {
      lastNotifiedMinute = currentTimeStr;
      sendNotification(
        isPortuguese ? 'Eunoia • Manhã Deliberada' : 'Eunoia • Morning Intention',
        isPortuguese
          ? 'Qual é a sua intenção principal para hoje? Reserve um momento de clareza.'
          : 'What is your primary focus today? Set your daily intention.',
        'eunoia-morning'
      );
    } else if (config.middayEnabled && currentTimeStr === config.middayTime) {
      lastNotifiedMinute = currentTimeStr;
      sendNotification(
        isPortuguese ? 'Eunoia • Pausa da Tarde' : 'Eunoia • Midday Balance',
        isPortuguese
          ? 'Beba um copo d’água, alongue o corpo e respire conscientemente.'
          : 'Drink water, stretch your body, and take a mindful pause.',
        'eunoia-midday'
      );
    } else if (config.eveningEnabled && currentTimeStr === config.eveningTime) {
      lastNotifiedMinute = currentTimeStr;
      sendNotification(
        isPortuguese ? 'Eunoia • Reflexão Noturna' : 'Eunoia • Evening Reflection',
        isPortuguese
          ? 'Como foi seu dia? O que você fez com virtude? O que pode melhorar amanhã?'
          : 'Review your day. What did you do with virtue? What can you improve tomorrow?',
        'eunoia-evening'
      );
    }
  };

  schedulerInterval = window.setInterval(checkReminders, 45000);
  checkReminders();
}

export function stopNotificationScheduler(): void {
  if (schedulerInterval !== null) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
}
