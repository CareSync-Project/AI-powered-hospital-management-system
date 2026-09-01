import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, User, ArrowRight, X, Eye, EyeOff, Activity, ShieldCheck, HeartPulse, MessageCircle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('patient'); // patient, doctor, admin
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    specialization: '' // For doctors
  });

  const { login, register, registerHospital } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { text: "Hi there! 👋 I'm the CareSync AI assistant. How can I help you today?", isBot: true }
  ]);
  const [chatInput, setChatInput] = useState('');


  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        await login(formData.email, formData.password, role);
      } else {
        if (role === 'admin') {
          if (!formData.hospitalName) throw new Error('Hospital Name is required.');
          if (!formData.name) throw new Error('Admin Full Name is required.');
          await registerHospital(formData.hospitalName, formData.name, formData.email, formData.password);
        } else {
          await register({ ...formData, role });
        }
      }
      
      if (role === 'patient') navigate('/patient-dashboard');
      if (role === 'doctor') navigate('/doctor-dashboard');
      if (role === 'admin') navigate('/admin-dashboard');
      
    } catch (err) {
      setError(err.message);
    }
  };

  // Framer Motion Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { text: userMessage, isBot: false }]);
    setChatInput('');

    setTimeout(() => {
      let botResponse = "I'm sorry, I didn't quite catch that. You can ask me about our services, booking an appointment, or how to use the portals.";
      
      const lowerInput = userMessage.toLowerCase();
      if (lowerInput.includes('service') || lowerInput.includes('what do you do')) {
        botResponse = "We provide an intelligent hospital management system. We use AI to match patients with the right doctors instantly and eliminate wait times. Features include patient portals, doctor dashboards, and admin analytics.";
      } else if (lowerInput.includes('book') || lowerInput.includes('appointment')) {
        botResponse = "To book an appointment, click 'Get Started' and register as a Patient. Once logged in, simply describe your symptoms and our AI will match you with the fastest available specialist!";
      } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
        botResponse = "Hello! How can I assist you with CareSync today?";
      }

      setChatMessages(prev => [...prev, { text: botResponse, isBot: true }]);
    }, 1000);
  };


  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-background)' }}>
      
      {/* Navigation */}
      <nav style={{ padding: '1.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)', backgroundColor: 'var(--color-background)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '700', fontSize: '1.5rem', color: 'var(--color-primary)' }}>
            <div style={{ background: 'var(--color-primary)', color: 'var(--color-background)', padding: '0.5rem', borderRadius: '10px' }}>
              <Stethoscope size={24} />
            </div>
            CareSync
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="btn hover-lift" onClick={() => { setIsLogin(true); setShowAuthModal(true); }} style={{ color: 'var(--color-primary)', fontWeight: '600', background: 'transparent' }}>
              Log in
            </button>
            <button className="btn hover-lift" onClick={() => { setIsLogin(false); setShowAuthModal(true); }} style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-text-main)' }}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', minHeight: 'calc(100vh - 80px)' }}>
          
          {/* Left Content (Text) */}
          <div style={{ flex: '1 1 50%', minWidth: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
            <motion.div 
              initial="hidden" animate="visible" variants={staggerContainer}
              style={{ maxWidth: '600px' }}
            >
              <motion.div variants={fadeInUp} style={{ display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '100vh', border: '2px solid var(--color-primary)', fontSize: '0.875rem', color: 'var(--color-primary)', marginBottom: '2rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                🚀 The Future of Healthcare
              </motion.div>

              <motion.h1 variants={fadeInUp} style={{ fontSize: 'clamp(3rem, 5vw, 5rem)', marginBottom: '1.5rem', lineHeight: '1.1', color: 'var(--color-primary)', letterSpacing: '-0.02em', fontWeight: '700' }}>
                Healthcare scheduling,<br/>
                <span className="text-gradient">fully automated.</span>
              </motion.h1>
              
              <motion.p variants={fadeInUp} style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)', marginBottom: '3rem', lineHeight: '1.6', fontWeight: '500' }}>
                Streamline your hospital visits. Our intelligent platform automatically matches patients with the right doctors instantly, eliminating wait times.
              </motion.p>
              
              <motion.div variants={fadeInUp} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button 
                  className="btn hover-lift" 
                  style={{ padding: '1rem 2rem', fontSize: '1.125rem', backgroundColor: 'var(--color-secondary)', color: '#fff', border: '2px solid var(--color-secondary)' }}
                  onClick={() => { setRole('patient'); setIsLogin(false); setShowAuthModal(true); }}
                >
                  Book Appointment <ArrowRight size={20} style={{ marginLeft: '0.5rem' }} />
                </button>
                <button 
                  className="btn hover-lift" 
                  style={{ padding: '1rem 2rem', fontSize: '1.125rem', backgroundColor: 'transparent', color: 'var(--color-primary)', border: '2px solid var(--color-primary)' }}
                  onClick={() => { setRole('doctor'); setIsLogin(true); setShowAuthModal(true); }}
                >
                  Doctor Portal
                </button>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Content (Image) */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            style={{ flex: '1 1 50%', minWidth: '300px', backgroundImage: 'url(/hero_hospital_saas.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '500px', borderTopLeftRadius: '40px', borderBottomLeftRadius: '40px', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)' }}
          >
          </motion.div>

        </div>
      </main>

      {/* Features Section (Carousel/Grid style) */}
      <section style={{ padding: '8rem 0', backgroundColor: 'var(--color-primary)', color: 'var(--color-background)' }}>
        <div className="container">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
            style={{ textAlign: 'center', marginBottom: '5rem' }}
          >
            <motion.h2 variants={fadeInUp} style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>Smarter infrastructure.</motion.h2>
            <motion.p variants={fadeInUp} style={{ fontSize: '1.25rem', color: 'var(--color-background)', opacity: 0.8, maxWidth: '600px', margin: '0 auto' }}>
              Built for speed, reliability, and unparalleled patient experience.
            </motion.p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            
            {/* Feature 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}
              style={{ backgroundColor: 'var(--color-surface)', padding: '3rem', borderRadius: '24px', border: '1px solid var(--color-border)' }}
            >
              <div style={{ background: 'var(--color-text-main)', color: 'var(--color-primary)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                <Activity size={32} />
              </div>
              <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'var(--color-text-main)' }}>AI Triage</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '1.125rem', lineHeight: '1.6' }}>Our engine instantly prioritizes emergency cases, automatically reorganizing schedules for maximum efficiency.</p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} viewport={{ once: true }}
              style={{ backgroundColor: 'var(--color-secondary)', padding: '3rem', borderRadius: '24px', color: 'var(--color-text-main)' }}
            >
              <div style={{ background: 'var(--color-primary)', color: 'var(--color-secondary)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                <ShieldCheck size={32} />
              </div>
              <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Seamless Records</h3>
              <p style={{ fontSize: '1.125rem', lineHeight: '1.6' }}>Doctors get instant access to your medical history, notes, and previous visits directly in their portal.</p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} viewport={{ once: true }}
              style={{ backgroundColor: 'var(--color-surface)', padding: '3rem', borderRadius: '24px', border: '1px solid var(--color-border)' }}
            >
              <div style={{ background: 'var(--color-text-main)', color: 'var(--color-primary)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                <HeartPulse size={32} />
              </div>
              <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'var(--color-text-main)' }}>Wait-Free Experience</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '1.125rem', lineHeight: '1.6' }}>Say goodbye to crowded waiting rooms. We tell you exactly when to arrive so you walk straight in.</p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Image Showcase Section */}
      <section style={{ padding: '8rem 0', backgroundColor: 'var(--color-background)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
              <img src="/feature_analytics.jpg" alt="Analytics" style={{ width: '100%', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
              <h2 style={{ fontSize: '3rem', color: 'var(--color-primary)', marginBottom: '1.5rem', lineHeight: '1.1' }}>Analytics that drive better outcomes.</h2>
              <p style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Admins can track consultation times, patient loads, and department efficiency in real-time with stunning visual reports.</p>
              <img src="/feature_doctors.jpg" alt="Doctors" style={{ width: '100%', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '4rem 0 2rem 0', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '3rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '700', fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>
                <div style={{ background: 'var(--color-text-main)', color: 'var(--color-primary)', padding: '0.5rem', borderRadius: '10px' }}>
                  <Stethoscope size={24} />
                </div>
                CareSync
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', maxWidth: '300px' }}>
                The intelligent hospital management system designed to eliminate wait times and optimize patient care.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '4rem' }}>
              <div>
                <strong style={{ display: 'block', marginBottom: '1rem', fontSize: '1rem' }}>Platform</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span style={{ cursor: 'pointer' }}>Patient Portal</span>
                  <span style={{ cursor: 'pointer' }}>Doctor Portal</span>
                  <span style={{ cursor: 'pointer' }}>Admin Console</span>
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-muted)' }}>
            <div>© {new Date().getFullYear()} CareSync Hospital AI. All rights reserved.</div>
          </div>
        </div>
      </footer>

      {/* Auth Modal with Glassmorphism (Maintained per request) */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,68,73,0.64)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="glass-panel" 
              style={{ width: '100%', maxWidth: '450px', padding: '3rem', backgroundColor: 'var(--color-surface)' }}
            >
              <button 
                onClick={() => setShowAuthModal(false)}
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'var(--color-text-main)', color: 'var(--color-background)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
              
              <h2 style={{ marginBottom: '2rem', textAlign: 'center', fontSize: '1.75rem', color: 'var(--color-text-main)' }}>
                {isLogin ? 'Sign in to CareSync' : role === 'admin' ? 'Register your Hospital' : 'Create an account'}
              </h2>

              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', padding: '0.25rem', background: 'rgba(0,0,0,0.2)', borderRadius: '100vh', border: '1px solid var(--glass-border)' }}>
                {[
                  { id: 'patient', label: 'Patient' },
                  { id: 'doctor', label: 'Doctor' },
                  { id: 'admin', label: 'Admin' }
                ].map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setRole(r.id); setError(''); }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: 'none',
                      borderRadius: '100vh',
                      cursor: 'pointer',
                      background: role === r.id ? 'var(--color-text-main)' : 'transparent',
                      color: role === r.id ? 'var(--color-background)' : 'var(--color-text-main)',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {error && (
                <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ff8a8a', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {!isLogin && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Full Name</label>
                    <input type="text" name="name" required className="input-field" value={formData.name || ''} onChange={handleInputChange} placeholder={role === 'admin' ? "e.g. John Doe (Admin)" : ""} />
                  </div>
                )}
                
                {!isLogin && role === 'admin' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Hospital Name</label>
                    <input type="text" name="hospitalName" required className="input-field" value={formData.hospitalName || ''} onChange={handleInputChange} placeholder="e.g. City General Hospital" />
                  </div>
                )}
                
                {!isLogin && role === 'doctor' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Specialization</label>
                    <input type="text" name="specialization" required className="input-field" value={formData.specialization || ''} onChange={handleInputChange} placeholder="e.g. Cardiology" />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    {role === 'admin' ? 'Username' : 'Email address'}
                  </label>
                  <input type={role === 'admin' ? "text" : "email"} name="email" required className="input-field" value={formData.email} onChange={handleInputChange} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? "text" : "password"} name="password" required className="input-field" value={formData.password} onChange={handleInputChange} style={{ paddingRight: '2.5rem' }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn hover-lift" style={{ width: '100%', marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--color-secondary)', color: '#fff', border: 'none', fontSize: '1rem' }}>
                  {isLogin ? 'Sign In' : 'Continue'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', fontWeight: '600', cursor: 'pointer' }}
                >
                  {isLogin ? 'Sign up' : 'Log in'}
                </button>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Widget */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 50 }}>
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="glass-panel"
              style={{
                width: '350px',
                height: '450px',
                marginBottom: '1rem',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--color-surface)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                border: '1px solid var(--glass-border)'
              }}
            >
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-primary)', color: 'var(--color-background)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                  <Stethoscope size={18} /> CareSync AI
                </div>
                <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-background)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {chatMessages.map((msg, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: msg.isBot ? 'flex-start' : 'flex-end' }}>
                    <div style={{
                      maxWidth: '80%',
                      padding: '0.75rem 1rem',
                      borderRadius: '16px',
                      borderBottomLeftRadius: msg.isBot ? '0' : '16px',
                      borderBottomRightRadius: msg.isBot ? '16px' : '0',
                      backgroundColor: msg.isBot ? 'rgba(0,0,0,0.05)' : 'var(--color-primary)',
                      color: msg.isBot ? 'var(--color-text-main)' : '#fff',
                      fontSize: '0.875rem',
                      lineHeight: '1.4'
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="input-field"
                    style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '100vh', border: '1px solid var(--glass-border)' }}
                  />
                  <button type="submit" style={{ background: 'var(--color-secondary)', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="hover-lift"
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-background)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
            marginLeft: 'auto'
          }}
        >
          {isChatOpen ? <X size={28} /> : <MessageCircle size={28} />}
        </button>
      </div>

    </div>
  );
};

export default LandingPage;
