'use client';

import { useEffect, useState } from 'react';
import { isPushSupported, getPushSubscription, subscribePush, unsubscribePush } from '@/lib/push';
import { authApi } from '@/lib/api/auth';

export default function PushNotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(true);

  useEffect(() => {
    const check = async () => {
      const pushOk = isPushSupported();
      setSupported(pushOk);

      const authenticated = authApi.isAuthenticated();
      setIsGuest(!authenticated);

      if (pushOk && authenticated) {
        const sub = await getPushSubscription();
        setSubscribed(!!sub);
      }
      setLoading(false);
    };
    check();
  }, []);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (subscribed) {
        const ok = await unsubscribePush();
        if (ok) setSubscribed(false);
      } else {
        const ok = await subscribePush();
        if (ok) setSubscribed(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!supported || isGuest) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
        subscribed
          ? 'bg-green-50 border-green-200 text-green-700'
          : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-green-300'
      } ${loading ? 'opacity-50' : ''}`}
    >
      <span>{subscribed ? '🔔' : '🔕'}</span>
      <span>{loading ? '...' : subscribed ? '저녁 알림 ON' : '저녁 알림 OFF'}</span>
    </button>
  );
}
