import { useState } from 'react';
import { Bell, X, CheckCheck, GraduationCap, BookOpen, ClipboardCheck, DollarSign } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'grade' | 'attendance' | 'payment' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'grade', title: 'New Grade Posted', message: 'Your score for Media Production Fundamentals has been recorded: 85% (A — Excellent)', time: '2 hours ago', read: false },
  { id: 'n2', type: 'attendance', title: 'Attendance Marked', message: 'Your attendance for today (April 24) has been marked as Present', time: '5 hours ago', read: false },
  { id: 'n3', type: 'payment', title: 'Payment Received', message: 'Your term fee payment of UGX 800 has been confirmed', time: '1 day ago', read: true },
  { id: 'n4', type: 'info', title: 'Term 2 Results', message: 'End of Term 2 grade reports are now available in your portal', time: '2 days ago', read: true },
  { id: 'n5', type: 'grade', title: 'Grade Updated', message: 'Your score for Digital Photography has been updated: 72% (B — Good)', time: '3 days ago', read: true },
];

const TYPE_ICON: Record<string, React.ReactNode> = {
  grade:      <BookOpen size={14}/>,
  attendance: <ClipboardCheck size={14}/>,
  payment:    <DollarSign size={14}/>,
  info:       <Bell size={14}/>,
};
const TYPE_COLOR: Record<string, string> = {
  grade: '#22c55e', attendance: '#3b82f6', payment: '#f97316', info: '#a855f7',
};

interface NotificationBellProps {
  role: string;
}

export default function NotificationBell({ role }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unread = notifications.filter(n => !n.read).length;
  const accentColor = role === 'admin' ? '#a855f7' : role === 'staff' ? '#3b82f6' : role === 'student' ? '#22c55e' : '#f97316';

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const dismiss = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  return (
    <div style={{ position: 'relative' }}>
      <button
        id="btn-notifications"
        onClick={() => setOpen(o => !o)}
        style={{ position: 'relative', background: open ? `${accentColor}18` : 'var(--bg-card)', border: `1px solid ${open ? accentColor + '44' : 'var(--border)'}`, borderRadius: 10, padding: '8px 10px', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
      >
        <Bell size={18} color={unread > 0 ? accentColor : '#64748b'}/>
        {unread > 0 && (
          <span style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', fontSize: 9, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setOpen(false)}/>
          <div style={{ position: 'absolute', top: '110%', right: 0, width: 360, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.5)', zIndex: 1000, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Notifications</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{unread} unread</div>
              </div>
              {unread > 0 && (
                <button id="btn-mark-all-read" onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: accentColor, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCheck size={12}/> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#4b6080', fontSize: 13 }}>
                  <Bell size={28} style={{ marginBottom: 8, opacity: 0.3 }}/><br/>No notifications
                </div>
              ) : notifications.map(n => {
                const color = TYPE_COLOR[n.type];
                return (
                  <div
                    key={n.id}
                    id={`notif-${n.id}`}
                    onClick={() => markRead(n.id)}
                    style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: n.read ? 'transparent' : `${color}08`, transition: 'background 0.2s', display: 'flex', gap: 12, alignItems: 'flex-start' }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {TYPE_ICON[n.type]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ fontWeight: n.read ? 500 : 700, fontSize: 13 }}>{n.title}</div>
                        <button onClick={e => { e.stopPropagation(); dismiss(n.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b6080', flexShrink: 0, padding: '2px 4px' }}><X size={12}/></button>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 1.5 }}>{n.message}</div>
                      <div style={{ fontSize: 10, color: '#4b6080', marginTop: 4 }}>{n.time}</div>
                    </div>
                    {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 6 }}/>}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
