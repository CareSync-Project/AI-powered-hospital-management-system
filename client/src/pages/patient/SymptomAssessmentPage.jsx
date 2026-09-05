import React, { useEffect, useRef, useState } from 'react';
import { 
  Bot, Send, RotateCcw, Sparkles, CalendarPlus, 
  History, User, ShieldAlert, X, ChevronRight
} from 'lucide-react';
import { careAssistantService } from '../../services/careAssistantService';
import { symptomAssessmentService } from '../../services/symptomAssessmentService';
import PossibleConditionCard from '../../components/symptoms/PossibleConditionCard';

const QUICK_PROMPTS = [
  'I have a fever and headache for 2 days',
  'I have a persistent dry cough and sore throat',
  'I feel dizzy, fatigued and have mild nausea',
  'Check my upcoming appointments',
  'What clinic departments are open today?'
];

const SYMPTOM_TAGS = [
  'Fever', 'Headache', 'Cough', 'Chest Pain', 'Shortness of Breath', 
  'Dizziness', 'Sore Throat', 'Ear Pain', 'Fatigue', 'Nausea'
];

export default function SymptomAssessmentPage({ onBook }) {
  const [messages, setMessages] = useState([
    {
      id: 'init',
      role: 'assistant',
      text: `**Hello! I am your CareSync AI Clinical Assistant.** 👋\n\nI am powered by live medical intelligence to assist you with symptom triage, health inquiries, and clinic department routing.\n\nPlease describe what symptoms you are experiencing, how long they have lasted, and how severe they feel.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  const chatEndRef = useRef(null);

  const loadHistory = () => {
    symptomAssessmentService.list()
      .then((r) => {
        const list = Array.isArray(r) ? r : (Array.isArray(r?.data) ? r.data : (r?.data?.data || []));
        setHistory(list);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const handleToggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSend = async (customText = null) => {
    const textToSend = (customText || input).trim();
    if (!textToSend && selectedTags.length === 0) return;

    let fullPrompt = textToSend;
    if (selectedTags.length > 0) {
      const tagsString = `Associated symptoms: ${selectedTags.join(', ')}.`;
      fullPrompt = fullPrompt ? `${fullPrompt}\n${tagsString}` : tagsString;
    }

    if (!navigator.onLine) {
      setError('Network connection required. Please check your internet.');
      return;
    }

    const userMessageId = `user-${Date.now()}`;
    const userMsg = {
      id: userMessageId,
      role: 'user',
      text: fullPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSelectedTags([]);
    setBusy(true);
    setError('');

    try {
      const res = await careAssistantService.message({ message: fullPrompt });
      const responseData = res?.data || res || {};
      const generativeText = responseData.response || responseData.message || 'I have evaluated your inquiry.';
      const triageData = responseData.data || null;

      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: generativeText,
        data: triageData,
        intent: responseData.intent || null,
        requiresConfirmation: responseData.requiresConfirmation || false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to analyze symptoms.');
    } finally {
      setBusy(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'init-reset',
        role: 'assistant',
        text: 'Chat restarted. What health symptoms or concerns would you like to discuss today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setError('');
  };

  return (
    <div className="symptom-chat-page" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 130px)', minHeight: '750px', width: '100%' }}>
      {/* Streamlined Top Header Bar */}
      <div className="symptom-chat-toolbar" style={{
        padding: '0.9rem 1.5rem',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: '0 2px 6px rgba(0, 68, 73, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #004449, #007A83)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bot size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#004449', margin: 0 }}>
                CareSync Clinical AI Assistant
              </h3>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                padding: '0.12rem 0.5rem',
                borderRadius: '999px',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
                Live LLM Active
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem' }}>
              Preliminary triage guidance · Not an emergency diagnosis tool
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              padding: '0.45rem 0.9rem',
              backgroundColor: showHistory ? '#004449' : '#f1f5f9',
              color: showHistory ? '#ffffff' : '#004449',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <History size={15} />
            History ({history.length})
          </button>
          <button
            onClick={handleResetChat}
            style={{
              padding: '0.45rem 0.8rem',
              backgroundColor: '#f8fafc',
              color: '#64748b',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            title="Clear and restart conversation"
          >
            <RotateCcw size={14} /> Restart
          </button>
        </div>
      </div>

      {/* Main Expansive Chat & History Area */}
      <div className="symptom-chat-layout" style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: showHistory ? '1fr 340px' : '1fr',
        gap: '1rem',
        minHeight: 0,
        height: '100%'
      }}>
        {/* Full-Height Chat Stream Container */}
        <div className="symptom-chat-card" style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 20px rgba(0, 68, 73, 0.04)',
          overflow: 'hidden',
          height: '100%'
        }}>
          {/* Scrollable Messages Stream */}
          <div className="symptom-chat-messages" style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.75rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            backgroundColor: '#f8fafc'
          }}>
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const assessmentData = msg.data;

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: isUser ? '80%' : '90%',
                    alignSelf: isUser ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: isUser ? '#004449' : '#007A83',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      {isUser ? <User size={15} /> : <Bot size={15} />}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>
                      {isUser ? 'You' : 'CareSync AI Assistant'} · {msg.timestamp}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div style={{
                    padding: '1.25rem 1.6rem',
                    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    backgroundColor: isUser ? '#004449' : '#ffffff',
                    color: isUser ? '#ffffff' : '#0f172a',
                    border: isUser ? 'none' : '1px solid #e2e8f0',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                    fontSize: '0.98rem',
                    lineHeight: 1.65,
                    whiteSpace: 'pre-wrap',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    {msg.text}

                    {/* Rich Triage Card Details (if assessment was returned) */}
                    {assessmentData && (
                      <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                        {/* Urgency Badge */}
                        {assessmentData.urgency && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem 1.15rem',
                            borderRadius: '12px',
                            backgroundColor: 
                              assessmentData.urgency === 'EMERGENCY' ? '#fef2f2' :
                              assessmentData.urgency === 'HIGH' ? '#fff7ed' :
                              assessmentData.urgency === 'MEDIUM' ? '#fefce8' : '#f0fdf4',
                            border: `1.5px solid ${
                              assessmentData.urgency === 'EMERGENCY' ? '#f87171' :
                              assessmentData.urgency === 'HIGH' ? '#fb923c' :
                              assessmentData.urgency === 'MEDIUM' ? '#facc15' : '#4ade80'
                            }`,
                            color: 
                              assessmentData.urgency === 'EMERGENCY' ? '#991b1b' :
                              assessmentData.urgency === 'HIGH' ? '#9a3412' :
                              assessmentData.urgency === 'MEDIUM' ? '#854d0e' : '#166534',
                            fontWeight: '700',
                            fontSize: '0.9rem'
                          }}>
                            <span>Suggested Urgency Level:</span>
                            <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {assessmentData.urgency}
                            </span>
                          </div>
                        )}

                        {/* Red Flag Warning */}
                        {assessmentData.redFlagDetected && (
                          <div style={{ padding: '0.9rem 1.15rem', borderRadius: '12px', backgroundColor: '#991b1b', color: '#ffffff', fontSize: '0.9rem', fontWeight: '600' }}>
                            ⚠️ Urgent Red-Flag Symptoms Detected. Please seek urgent or emergency medical consultation immediately.
                          </div>
                        )}

                        {/* Possible Conditions Matched */}
                        {Array.isArray(assessmentData.possibleConditions) && assessmentData.possibleConditions.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#005a60', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                              Possible Health Causes to Discuss with Doctor:
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                              {assessmentData.possibleConditions.map((cond, idx) => (
                                <PossibleConditionCard key={cond.displayName || cond.name || idx} item={cond} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommended Department Booking Action */}
                        {assessmentData.recommendedDepartment && (
                          <div style={{
                            padding: '1.25rem 1.5rem',
                            backgroundColor: '#f0fdfa',
                            border: '1.5px solid #007A83',
                            borderRadius: '14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem'
                          }}>
                            <div>
                              <div style={{ fontSize: '0.8rem', color: '#007A83', fontWeight: '700', textTransform: 'uppercase' }}>
                                Recommended Clinic Department
                              </div>
                              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#004449', marginTop: '0.2rem' }}>
                                {assessmentData.recommendedDepartment.name || assessmentData.recommendedDepartmentCategory}
                              </div>
                              {assessmentData.recommendedAction && (
                                <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem' }}>
                                  {assessmentData.recommendedAction}
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => onBook({
                                departmentId: assessmentData.recommendedDepartment.id,
                                assessmentId: assessmentData.id
                              })}
                              style={{
                                padding: '0.75rem 1.4rem',
                                background: 'linear-gradient(135deg, #004449, #007A83)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: '700',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 4px 14px rgba(0, 68, 73, 0.25)'
                              }}
                            >
                              <CalendarPlus size={18} /> Book with {assessmentData.recommendedDepartment.name} →
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {busy && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#007A83', fontSize: '0.9rem', fontWeight: '600', padding: '0.5rem 1rem' }}>
                <Sparkles size={18} className="animate-spin" />
                CareSync AI is evaluating clinical rules and generating response...
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts Suggestions */}
          <div className="symptom-quick-prompts" style={{ padding: '0.65rem 1.5rem', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                disabled={busy}
                onClick={() => handleSend(prompt)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '0.35rem 0.8rem',
                  borderRadius: '999px',
                  backgroundColor: '#f1f5f9',
                  color: '#004449',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Symptom Tag Selector */}
          <div className="symptom-quick-tags" style={{ padding: '0.45rem 1.5rem', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Quick Tags:</span>
            {SYMPTOM_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    border: isSelected ? '1.5px solid #004449' : '1px solid #cbd5e1',
                    backgroundColor: isSelected ? '#004449' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#475569',
                    fontSize: '0.72rem',
                    fontWeight: isSelected ? '700' : '500',
                    cursor: 'pointer'
                  }}
                >
                  {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                </button>
              );
            })}
          </div>

          {/* Error message */}
          {error && (
            <div style={{ padding: '0.6rem 1.5rem', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.85rem', fontWeight: '600' }}>
              {error}
            </div>
          )}

          {/* Input Form Box */}
          <form className="symptom-chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{ padding: '1rem 1.5rem', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', alignItems: 'center' }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your health symptoms, medical complaints, or questions in detail..."
              disabled={busy}
              style={{
                flex: 1,
                padding: '0.95rem 1.35rem',
                borderRadius: '12px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.95rem',
                outline: 'none',
                color: '#0f172a',
                fontFamily: 'inherit'
              }}
            />
            <button
              type="submit"
              disabled={busy || (!input.trim() && selectedTags.length === 0)}
              style={{
                padding: '0.95rem 1.75rem',
                backgroundColor: busy || (!input.trim() && selectedTags.length === 0) ? '#94a3b8' : '#004449',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '0.95rem',
                cursor: busy || (!input.trim() && selectedTags.length === 0) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(0, 68, 73, 0.2)'
              }}
            >
              <Send size={18} /> Send
            </button>
          </form>
        </div>

        {/* Assessment History Drawer */}
        {showHistory && (
          <div className="symptom-history-drawer" style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 16px rgba(0, 68, 73, 0.04)',
            overflowY: 'auto',
            height: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#004449', margin: 0 }}>
                Triage History
              </h4>
              <button
                onClick={() => setShowHistory(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {history.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: '800',
                      padding: '0.12rem 0.45rem',
                      borderRadius: '999px',
                      backgroundColor: item.urgency === 'EMERGENCY' ? '#fee2e2' : '#e0f2fe',
                      color: item.urgency === 'EMERGENCY' ? '#dc2626' : '#0369a1'
                    }}>
                      {item.urgency}
                    </span>
                    <small style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '0.82rem', color: '#0f172a' }}>
                    {item.recommendedDepartment?.name || item.recommendedDepartmentCategory || 'General Assessment'}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.25rem 0' }}>
                    {item.symptomsText || 'Reported symptoms'}
                  </p>
                  {item.recommendedDepartment && (
                    <button
                      onClick={() => onBook({
                        departmentId: item.recommendedDepartment.id,
                        assessmentId: item.id
                      })}
                      style={{
                        marginTop: '0.4rem',
                        padding: '0.3rem 0.6rem',
                        backgroundColor: '#004449',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      Book {item.recommendedDepartment.name} →
                    </button>
                  )}
                </div>
              ))}

              {!history.length && (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                  No prior assessments.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
