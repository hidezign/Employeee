import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Clock, CheckCircle, Calendar, DollarSign, Bell } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [stats, setStats] = useState({
    totalLeaves: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    lastSalary: 0,
    unreadNotifications: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [attendance, leaves, salary, notifications] = await Promise.all([
        axios.get(`${API_URL}/api/attendance/me`, { withCredentials: true }),
        axios.get(`${API_URL}/api/leaves/me`, { withCredentials: true }),
        axios.get(`${API_URL}/api/salary/me`, { withCredentials: true }),
        axios.get(`${API_URL}/api/notifications/me`, { withCredentials: true }),
      ]);

      const todayRecord = attendance.data.find((a) => a.date === today);
      setTodayAttendance(todayRecord || null);

      setStats({
        totalLeaves: leaves.data.length,
        pendingLeaves: leaves.data.filter((l) => l.status === 'pending').length,
        approvedLeaves: leaves.data.filter((l) => l.status === 'approved').length,
        lastSalary: salary.data[0]?.salary || user?.salary || 0,
        unreadNotifications: notifications.data.filter((n) => !n.read).length,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/attendance/checkin`, {}, { withCredentials: true });
      toast.success('Checked in successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/attendance/checkout`, {}, { withCredentials: true });
      toast.success('Checked out successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to check out');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: Calendar, label: 'Total Leaves', value: stats.totalLeaves },
    { icon: Clock, label: 'Pending Leaves', value: stats.pendingLeaves },
    { icon: CheckCircle, label: 'Approved Leaves', value: stats.approvedLeaves },
    { icon: DollarSign, label: 'Current Salary', value: `$${stats.lastSalary.toLocaleString()}` },
  ];

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 flex-1 min-h-screen bg-[#FAFAFA]">
        <div className="p-6 md:p-8" data-testid="employee-dashboard">
          <h1 className="text-4xl tracking-tighter font-black mb-2" data-testid="employee-dashboard-title">
            EMPLOYEE DASHBOARD
          </h1>
          <p className="text-sm text-zinc-500 mb-8">Welcome back, {user?.name}</p>

          <div className="mb-8 bg-white border border-zinc-200 p-6">
            <h2 className="text-2xl tracking-tight font-bold mb-4">TODAY'S ATTENDANCE</h2>
            <div className="flex items-center gap-4">
              {!todayAttendance ? (
                <Button
                  onClick={handleCheckIn}
                  disabled={loading}
                  data-testid="check-in-button"
                  className="rounded-none border border-zinc-950 shadow-none hover:bg-zinc-900 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
                >
                  <Clock size={16} className="mr-2" />
                  {loading ? 'Processing...' : 'Check In'}
                </Button>
              ) : todayAttendance.checkout_time ? (
                <div data-testid="attendance-complete" className="flex items-center gap-2 text-green-800">
                  <CheckCircle size={20} />
                  <span className="text-sm font-bold">Attendance complete for today</span>
                </div>
              ) : (
                <Button
                  onClick={handleCheckOut}
                  disabled={loading}
                  data-testid="check-out-button"
                  className="rounded-none border border-zinc-950 shadow-none hover:bg-zinc-900 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
                >
                  <Clock size={16} className="mr-2" />
                  {loading ? 'Processing...' : 'Check Out'}
                </Button>
              )}
              {todayAttendance && (
                <div className="text-sm text-zinc-600" data-testid="today-attendance-times">
                  <span className="font-bold">Check-in:</span>{' '}
                  {new Date(todayAttendance.checkin_time).toLocaleTimeString()}
                  {todayAttendance.checkout_time && (
                    <>
                      {' | '}
                      <span className="font-bold">Check-out:</span>{' '}
                      {new Date(todayAttendance.checkout_time).toLocaleTimeString()}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  data-testid={`stat-card-${card.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className="bg-white border border-zinc-200 p-6 transition-colors duration-150 hover:bg-zinc-50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Icon size={24} className="text-zinc-950" />
                  </div>
                  <p className="text-xs tracking-[0.2em] uppercase font-bold text-zinc-500 mb-1">
                    {card.label}
                  </p>
                  <p className="text-2xl tracking-tight font-bold">{card.value}</p>
                </div>
              );
            })}
          </div>

          {stats.unreadNotifications > 0 && (
            <div className="bg-blue-50 border border-blue-200 p-4 flex items-center justify-between" data-testid="notifications-banner">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-blue-800" />
                <p className="text-sm font-bold text-blue-800">
                  You have {stats.unreadNotifications} unread notification{stats.unreadNotifications > 1 ? 's' : ''}
                </p>
              </div>
              <a
                href="/employee/notifications"
                className="text-xs font-bold uppercase tracking-widest text-blue-800 hover:underline"
                data-testid="view-notifications-link"
              >
                View
              </a>
            </div>
          )}

          <div className="mt-8 bg-white border border-zinc-200 p-6">
            <h2 className="text-2xl tracking-tight font-bold mb-4">QUICK ACTIONS</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/employee/leaves"
                data-testid="quick-action-apply-leave"
                className="p-4 border border-zinc-950 text-center transition-all duration-150 hover:bg-zinc-900 hover:text-white"
              >
                <p className="text-xs font-bold uppercase tracking-widest">Apply for Leave</p>
              </a>
              <a
                href="/employee/attendance"
                data-testid="quick-action-view-attendance"
                className="p-4 border border-zinc-950 text-center transition-all duration-150 hover:bg-zinc-900 hover:text-white"
              >
                <p className="text-xs font-bold uppercase tracking-widest">View Attendance</p>
              </a>
              <a
                href="/employee/salary"
                data-testid="quick-action-view-salary"
                className="p-4 border border-zinc-950 text-center transition-all duration-150 hover:bg-zinc-900 hover:text-white"
              >
                <p className="text-xs font-bold uppercase tracking-widest">View Salary</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
