import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Step = 'email' | 'sent';

export default function ForgotPassword() {
  const navigate   = useNavigate();
  const [step, setStep]   = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { setError('Please enter a valid email address.'); return; }
    setError('');
    setLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setStep('sent');
  };

  return (
    <div className="login-bg">
      <div className="login-card" style={{ maxWidth: 420 }}>
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">B2</div>
          <div>
            <h1>Base2 Science and Media Academy</h1>
            <p>School Management System</p>
          </div>
        </div>

        {step === 'email' ? (
          <>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Reset Password</h2>
              <p className="login-subtitle">Enter your registered email address and we'll send you a reset link.</p>
            </div>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}/>
                  <input
                    id="input-reset-email"
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: 36 }}
                    placeholder="admin@base2media.ac"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button id="btn-send-reset" type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>

            <button
              id="btn-back-to-login"
              onClick={() => navigate('/login')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', marginTop: 20, padding: 0 }}
            >
              <ArrowLeft size={14}/> Back to Login
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', paddingTop: 8 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={32} color="#22c55e"/>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Email Sent!</h2>
            <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
              A password reset link has been sent to<br/>
              <strong style={{ color: '#f0f4ff' }}>{email}</strong>.<br/>
              Check your inbox and click the link to reset your password.
            </p>
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#fbbf24', marginBottom: 20 }}>
              ⏱ The link will expire in 30 minutes.
            </div>
            <button id="btn-back-login" className="login-btn" onClick={() => navigate('/login')}>
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
