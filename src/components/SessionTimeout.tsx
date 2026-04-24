import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_MS = 2  * 60 * 1000; // show warning at 2 minutes left

export default function SessionTimeout() {
  const logout  = useAuthStore(s => s.logout);
  const isAuth  = useAuthStore(s => s.isAuthenticated);
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown]     = useState(120); // seconds

  useEffect(() => {
    if (!isAuth) return;

    let warningTimer: ReturnType<typeof setTimeout>;
    let logoutTimer:  ReturnType<typeof setTimeout>;
    let countdownInterval: ReturnType<typeof setInterval>;

    const resetTimers = () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      clearInterval(countdownInterval);
      setShowWarning(false);
      setCountdown(120);

      warningTimer = setTimeout(() => {
        setShowWarning(true);
        setCountdown(120);
        countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) { clearInterval(countdownInterval); return 0; }
            return prev - 1;
          });
        }, 1000);
      }, TIMEOUT_MS - WARNING_MS);

      logoutTimer = setTimeout(() => {
        logout();
        navigate('/login');
      }, TIMEOUT_MS);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimers, { passive: true }));
    resetTimers();

    return () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      clearInterval(countdownInterval);
      events.forEach(e => window.removeEventListener(e, resetTimers));
    };
  }, [isAuth, logout, navigate]);

  if (!showWarning) return null;

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: 'var(--bg-surface)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 14, padding: '18px 22px', maxWidth: 320, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', animation: 'slideUp 0.3s ease' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ background: 'rgba(245,158,11,0.15)', borderRadius: 8, padding: 8, flexShrink: 0 }}>
          <AlertTriangle size={18} color="#f59e0b"/>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Session Expiring</div>
          <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
            You'll be logged out in <span style={{ color: '#f59e0b', fontWeight: 700 }}>{countdown}s</span> due to inactivity.
          </div>
          <button
            id="btn-stay-logged-in"
            onClick={() => { setShowWarning(false); window.dispatchEvent(new MouseEvent('mousemove')); }}
            style={{ marginTop: 10, padding: '7px 14px', background: '#f59e0b', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#000' }}
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}
