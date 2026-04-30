import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, getRoleColor, getRoleLabel } from '../store/authStore';
import {
  LayoutDashboard, Users, UserCog, DollarSign, BookOpen,
  ClipboardCheck, Trophy, TrendingUp, LogOut, GraduationCap,
  Heart, Calendar, Shield, User, BookMarked, FileText
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import SessionTimeout from './SessionTimeout';

interface NavItem { icon: React.ReactNode; label: string; path: string; id: string; }

function getNavItems(role: string): { section: string; items: NavItem[] }[] {
  switch (role) {
    case 'admin': return [
      { section: 'Overview', items: [
        { icon: <LayoutDashboard size={18}/>, label: 'Dashboard',        path: '/admin',           id: 'nav-admin-dash' },
      ]},
      { section: 'Management', items: [
        { icon: <Users size={18}/>,     label: 'Students',        path: '/admin/students',   id: 'nav-admin-students' },
        { icon: <UserCog size={18}/>,   label: 'Staff',           path: '/admin/staff',      id: 'nav-admin-staff' },
        { icon: <DollarSign size={18}/>,label: 'Financials',      path: '/admin/financials', id: 'nav-admin-finance' },
        { icon: <Calendar size={18}/>,  label: 'Academic Setup',  path: '/admin/academic',   id: 'nav-admin-academic' },
        { icon: <BookMarked size={18}/>,label: 'Subject Assign',  path: '/admin/subjects',   id: 'nav-admin-subjects' },
        { icon: <FileText size={18}/>,  label: 'Fee Structures',  path: '/admin/fees',       id: 'nav-admin-fees' },
      ]},
      { section: 'System', items: [
        { icon: <Shield size={18}/>,    label: 'Audit Logs',      path: '/admin/audit',      id: 'nav-admin-audit' },
      ]},
    ];
    case 'staff': return [
      { section: 'Overview', items: [
        { icon: <LayoutDashboard size={18}/>, label: 'Dashboard',     path: '/staff',             id: 'nav-staff-dash' },
      ]},
      { section: 'Classroom', items: [
        { icon: <BookOpen size={18}/>,        label: 'Grading',      path: '/staff/grading',     id: 'nav-staff-grading' },
        { icon: <ClipboardCheck size={18}/>,  label: 'Attendance',   path: '/staff/attendance',  id: 'nav-staff-attendance' },
        { icon: <GraduationCap size={18}/>,   label: 'Report Cards', path: '/staff/reportcards', id: 'nav-staff-reports' },
      ]},
    ];
    case 'student': return [
      { section: 'My Portal', items: [
        { icon: <LayoutDashboard size={18}/>, label: 'Dashboard',   path: '/student',             id: 'nav-student-dash' },
        { icon: <TrendingUp size={18}/>,      label: 'My Grades',   path: '/student/grades',      id: 'nav-student-grades' },
        { icon: <ClipboardCheck size={18}/>,  label: 'Attendance',  path: '/student/attendance',  id: 'nav-student-att' },
        { icon: <Trophy size={18}/>,          label: 'Leaderboard', path: '/student/leaderboard', id: 'nav-student-lb' },
        { icon: <FileText size={18}/>,        label: 'Report Card', path: '/student/reportcard',  id: 'nav-student-rc' },
        { icon: <User size={18}/>,            label: 'My Profile',  path: '/student/profile',     id: 'nav-student-profile' },
      ]},
    ];
    case 'parent': return [
      { section: "Child's Progress", items: [
        { icon: <Heart size={18}/>, label: 'Dashboard', path: '/parent', id: 'nav-parent-dash' },
      ]},
    ];
    default: return [];
  }
}

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();

  if (!user) return null;

  const accent    = getRoleColor(user.role);
  const navGroups = getNavItems(user.role);
  const initials  = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const roleTitles: Record<string, { title: string; sub: string }> = {
    admin:   { title: 'Administrator Portal', sub: 'Base2 Science and Media Academy' },
    staff:   { title: 'Staff Portal',         sub: 'Base2 Science and Media Academy' },
    student: { title: 'Student Portal',       sub: 'Base2 Science and Media Academy' },
    parent:  { title: 'Parent Portal',        sub: 'Base2 Science and Media Academy' },
  };
  const { title, sub } = roleTitles[user.role];

  const roleIcons: Record<string, React.ReactNode> = {
    admin:   <GraduationCap size={20}/>,
    staff:   <BookOpen size={20}/>,
    student: <TrendingUp size={20}/>,
    parent:  <Heart size={20}/>,
  };

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon" style={{ background: `${accent}22`, color: accent }}>B2</div>
          <div className="logo-text">
            <h2>Base2 Science and Media Academy</h2>
            <span>School Management</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navGroups.map(group => (
            <div key={group.section}>
              <div className="nav-section-label">{group.section}</div>
              {group.items.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    id={item.id}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    style={isActive ? { background: `${accent}18`, color: accent } : {}}
                    onClick={() => navigate(item.path)}
                  >
                    <span style={isActive ? { color: accent } : {}}>{item.icon}</span>
                    {item.label}
                    {isActive && <span style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: accent }} />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            {user.avatar ? (
              <div className="avatar" style={{ width: 32, height: 32 }}><img src={user.avatar} alt="" /></div>
            ) : (
              <div className="user-avatar" style={{ background: `${accent}22`, color: accent }}>{initials}</div>
            )}
            <div className="user-info">
              <div className="name">{user.name}</div>
              <div className="role-tag">{getRoleLabel(user.role)}</div>
            </div>
            <button id="btn-logout" className="logout-btn" onClick={() => { logout(); navigate('/login'); }} title="Logout">
              <LogOut size={15}/>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-area">
        <header className="top-header">
          <div className="header-title">
            <h1>{title}</h1>
            <p>{sub}</p>
          </div>
          <div className="header-right">
            <NotificationBell role={user.role}/>
            <span className="header-badge" style={{ background: `${accent}18`, color: accent }}>
              {roleIcons[user.role]}
              {getRoleLabel(user.role)}
            </span>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
      <SessionTimeout />
    </div>
  );
}
