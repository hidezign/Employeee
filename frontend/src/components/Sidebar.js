import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, Calendar, FileText, DollarSign, LogOut, Clock, Bell } from 'lucide-react';

export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const adminLinks = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/employees', icon: Users, label: 'Employees' },
    { path: '/admin/attendance', icon: Clock, label: 'Attendance' },
    { path: '/admin/leaves', icon: Calendar, label: 'Leaves' },
    { path: '/admin/payroll', icon: DollarSign, label: 'Payroll' },
  ];

  const employeeLinks = [
    { path: '/employee', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/employee/attendance', icon: Clock, label: 'Attendance' },
    { path: '/employee/leaves', icon: Calendar, label: 'Leaves' },
    { path: '/employee/salary', icon: DollarSign, label: 'Salary' },
    { path: '/employee/notifications', icon: Bell, label: 'Notifications' },
  ];

  const links = user?.role === 'admin' ? adminLinks : employeeLinks;

  return (
    <div className="w-64 border-r border-zinc-200 bg-white flex flex-col h-screen fixed left-0 top-0" data-testid="sidebar">
      <div className="p-6 border-b border-zinc-200">
        <h1 className="text-2xl tracking-tight font-black" data-testid="sidebar-title">EMP SYSTEM</h1>
        <p className="text-xs tracking-[0.2em] uppercase font-bold text-zinc-500 mt-1" data-testid="sidebar-user-role">
          {user?.role}
        </p>
      </div>

      <nav className="flex-1 p-4">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.path);
          return (
            <Link
              key={link.path}
              to={link.path}
              data-testid={`sidebar-nav-${link.label.toLowerCase()}`}
              className={`flex items-center gap-3 px-4 py-3 mb-1 text-sm font-bold uppercase tracking-widest transition-colors duration-150 ${
                active
                  ? 'bg-zinc-950 text-white'
                  : 'text-zinc-700 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-200">
        <div className="mb-4">
          <p className="text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">User</p>
          <p className="text-sm font-bold mt-1" data-testid="sidebar-user-name">{user?.name}</p>
          <p className="text-xs text-zinc-500" data-testid="sidebar-user-email">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          data-testid="sidebar-logout-button"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-zinc-950 text-xs font-bold uppercase tracking-widest transition-colors duration-150 hover:bg-zinc-900 hover:text-white"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}
