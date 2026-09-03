import { useState } from 'react';
import { Bot, MessageCircle, RotateCcw, Send, X } from 'lucide-react';
import { careAssistantService } from '../../services/careAssistantService';

const PROMPTS = ['Summarize my assigned patients', 'How do I record vitals?', 'Explain the nurse workflow', 'How do I triage a patient?', 'Where are announcements?'];

export default function NurseCareAssistant() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([{ role:'assistant', text:'Hello. I can help with your assigned workload and the CareSync nurse workflow.' }]);
  const send = async (value) => {
    const message = (value || input).trim();
    if (!message || busy) return;
    setMessages(old => [...old, { role:'user', text:message }]);
    setInput(''); setBusy(true); setError('');
    try {
      const result = (await careAssistantService.nurseMessage({ message })).data;
      setMessages(old => [...old, { role:'assistant', text:result.response }]);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  return <div className="care-assistant nurse-care-assistant">
    <button className="care-assistant-launch" onClick={() => setOpen(!open)} aria-label={open ? 'Close Nurse Assistant' : 'Open Nurse Assistant'}>{open ? <X/> : <MessageCircle/>}<span>Nurse Assistant</span></button>
    {open && <section className="care-assistant-panel" aria-label="Nurse Assistant conversation">
      <header><Bot/><div><strong>CareSync Nurse Assistant</strong><small>Workflow support · not a diagnosis</small></div></header>
      <div className="assistant-prompts">{PROMPTS.map(prompt => <button key={prompt} onClick={() => send(prompt)}>{prompt}</button>)}</div>
      <div className="assistant-messages" aria-live="polite">{messages.map((item,index) => <div key={index} className={item.role}><p>{item.text}</p></div>)}{busy && <div className="assistant"><p>Checking your CareSync workspace…</p></div>}</div>
      {error && <p className="patient-error">{error}<button onClick={() => send(messages.at(-1)?.text)} aria-label="Retry"><RotateCcw size={16}/></button></p>}
      <form onSubmit={event => { event.preventDefault(); send(); }}><input value={input} maxLength="1000" onChange={event => setInput(event.target.value)} placeholder="Ask about assignments, vitals or triage" aria-label="Message Nurse Assistant"/><button disabled={busy || !input.trim()} aria-label="Send message"><Send/></button></form>
    </section>}
  </div>;
}
