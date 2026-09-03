import { useEffect, useState } from 'react';
import { Check, Download, Share2 } from 'lucide-react';

let deferredPrompt = null;
if (typeof window !== 'undefined' && !window.__careSyncInstallListener) {
  window.__careSyncInstallListener = true;
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    window.dispatchEvent(new Event('caresync-install-ready'));
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.dispatchEvent(new Event('caresync-installed'));
  });
}

export default function InstallPwaPrompt({ className = 'patient-install' }) {
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const [ready,setReady]=useState(Boolean(deferredPrompt));
  const [installed,setInstalled]=useState(standalone);
  const [help,setHelp]=useState(false);
  const [update,setUpdate]=useState(null);
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  useEffect(()=>{
    const available=()=>setReady(Boolean(deferredPrompt));
    const done=()=>{setInstalled(true);setReady(false)};
    const updateAvailable=event=>setUpdate(event.detail || true);
    addEventListener('caresync-install-ready',available);addEventListener('caresync-installed',done);addEventListener('caresync-pwa-update',updateAvailable);
    return()=>{removeEventListener('caresync-install-ready',available);removeEventListener('caresync-installed',done);removeEventListener('caresync-pwa-update',updateAvailable)};
  },[]);
  const install=async()=>{
    if(installed)return;
    if(deferredPrompt){await deferredPrompt.prompt();const choice=await deferredPrompt.userChoice;if(choice.outcome==='accepted')setInstalled(true);deferredPrompt=null;setReady(false);return}
    setHelp(true);
  };
  const applyUpdate=()=>{const registration=update?.waiting?update:null;if(registration?.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});else location.reload()};
  if(update)return <button type="button" className={className} onClick={applyUpdate}><Download size={17}/>Update CareSync</button>;
  return <div className="pwa-install-control">
    <button type="button" className={className} onClick={install} disabled={installed}>{installed?<><Check size={17}/>CareSync installed</>:<><Download size={17}/>{ready?'Install CareSync':'Install CareSync app'}</>}</button>
    {help&&<div className="pwa-install-help" role="status">{ios?<><Share2 size={17}/>Tap Share, then “Add to Home Screen”.</>:<>Open your browser menu and choose “Install CareSync” or “Install app”. Installation requires a supported browser and HTTPS or localhost.</>}<button type="button" onClick={()=>setHelp(false)} aria-label="Close install help">×</button></div>}
  </div>;
}
