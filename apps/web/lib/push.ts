import { apiRequest } from './api/client';

const API_BASE = '/api/push';

/**
 * VAPID 공개키 가져오기
 */
async function getVapidPublicKey(): Promise<string | null> {
  try {
    const { publicKey } = await apiRequest<{ publicKey: string }>(`${API_BASE}/vapid-key`);
    return publicKey;
  } catch {
    return null;
  }
}

/**
 * URL-safe base64를 Uint8Array로 변환
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * 푸시 알림 지원 여부
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * 현재 푸시 구독 상태
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

/**
 * 푸시 알림 구독
 */
export async function subscribePush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const vapidKey = await getVapidPublicKey();
    if (!vapidKey) return false;

    const registration = await navigator.serviceWorker.ready;
    const keyArray = urlBase64ToUint8Array(vapidKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyArray.buffer as ArrayBuffer,
    });

    const json = subscription.toJSON();
    await apiRequest(`${API_BASE}/subscribe`, {
      method: 'POST',
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: json.keys,
      }),
    });

    return true;
  } catch (error) {
    console.error('[Push] Subscribe failed:', error);
    return false;
  }
}

/**
 * 푸시 알림 구독 해제
 */
export async function unsubscribePush(): Promise<boolean> {
  try {
    const subscription = await getPushSubscription();
    if (!subscription) return true;

    await apiRequest(`${API_BASE}/subscribe`, {
      method: 'DELETE',
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    await subscription.unsubscribe();
    return true;
  } catch (error) {
    console.error('[Push] Unsubscribe failed:', error);
    return false;
  }
}
