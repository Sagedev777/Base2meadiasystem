import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { DEMO_USERS } from '../data/mockData';

export default function Login() {
  const { login, error, clearError, isAuthenticated, user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Redirect as soon as auth succeeds
  useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'admin':   navigate('/admin',   { replace: true }); break;
        case 'staff':   navigate('/staff',   { replace: true }); break;
        case 'student': navigate('/student', { replace: true }); break;
        case 'parent':  navigate('/parent',  { replace: true }); break;
        default:        navigate('/',        { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  // Fill credentials AND immediately submit
  const fillDemo = async (e: string, p: string) => {
    clearError();
    setEmail(e);
    setPassword(p);
    setLoading(true);
    await login(e, p);
    setLoading(false);
  };

  const roleColors: Record<string, string> = {
    admin: '#a855f7', staff: '#3b82f6', student: '#22c55e', parent: '#f97316',
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">B2</div>
          <div>
            <h1>Base2 Science and Media Academy</h1>
            <p>School Management System</p>
          </div>
        </div>

        <p className="login-subtitle">Sign in to access your portal</p>

        {error && <div className="login-error">⚠ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button id="login-submit" className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>
        <div style={{ textAlign: 'right', marginTop: 12 }}>
          <button
            id="btn-forgot-password"
            onClick={() => navigate('/forgot-password')}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Forgot password?
          </button>
        </div>

        <div className="login-demos">
          <p>Quick Demo Access</p>
          <div className="demo-chips">
            {DEMO_USERS.filter(u => u.role === 'admin').map(u => (
              <button
                key={u.role}
                id={`demo-${u.role}`}
                className="demo-chip"
                style={{ background: `${roleColors[u.role]}22`, color: roleColors[u.role], border: `1px solid ${roleColors[u.role]}44` }}
                onClick={() => fillDemo(u.email, u.password)}
              >
                {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
