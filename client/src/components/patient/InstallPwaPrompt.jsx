import { useEffect, useState } from 'react';
export default function InstallPwaPrompt() {
  const [prompt, setPrompt] = useState(null); const [update, setUpdate] = useState(false);
  useEffect(() => {
    const install = (event) => { event.preventDefault(); setPrompt(event); };
    addEventListener('beforeinstallprompt', install);
    const updateAvailable = () => setUpdate(true);
    addEventListener('caresync-pwa-update', updateAvailable);
    return () => { removeEventListener('beforeinstallprompt', install); removeEventListener('caresync-pwa-update', updateAvailable); };
  }, []);
  if (update) return <button className="patient-install" onClick={() => location.reload()}>A new version is available. Refresh to update.</button>;
  if (!prompt) return null;
  return <button className="patient-install" onClick={async () => { await prompt.prompt(); setPrompt(null); }}>Install CareSync</button>;
}
