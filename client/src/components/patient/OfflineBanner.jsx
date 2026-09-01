import { useEffect, useState } from 'react';
export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => { const update = () => setOnline(navigator.onLine); addEventListener('online', update); addEventListener('offline', update); return () => { removeEventListener('online', update); removeEventListener('offline', update); }; }, []);
  return online ? null : <div className="offline-banner" role="status">You are offline. Some hospital services are temporarily unavailable.</div>;
}
