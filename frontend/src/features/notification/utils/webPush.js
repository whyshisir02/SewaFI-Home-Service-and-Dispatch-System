const SW_PATH = '/sw.js';

export const isWebPushSupported = () => {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

export const registerPushServiceWorker = async () => {
  if (!isWebPushSupported()) {
    throw new Error('Web push is not supported on this browser.');
  }

  return navigator.serviceWorker.register(SW_PATH);
};

export const getCurrentPushSubscription = async () => {
  if (!isWebPushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
};

export const requestNotificationPermission = async () => {
  if (!isWebPushSupported()) return 'denied';
  return Notification.requestPermission();
};

const base64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const normalized = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(normalized);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const subscribeBrowserToPush = async (publicKey) => {
  if (!publicKey) {
    throw new Error('Push public key is missing.');
  }

  const registration = await registerPushServiceWorker();
  const currentSubscription = await registration.pushManager.getSubscription();
  if (currentSubscription) return currentSubscription;

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64ToUint8Array(publicKey),
  });
};

export const unsubscribeBrowserPush = async () => {
  const subscription = await getCurrentPushSubscription();
  if (!subscription) return null;
  await subscription.unsubscribe();
  return subscription;
};
