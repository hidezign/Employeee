import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import axios from 'axios';
import { Users, Clock, Calendar, DollarSign } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayAttendance: 0,
    pendingLeaves: 0,
    monthlyPayroll: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [employees, attendance, leaves] = await Promise.all([
        axios.get(`${API_URL}/api/employees`, { withCredentials: true }),
        axios.get(`${API_URL}/api/attendance`, { withCredentials: true }),
        axios.get(`${API_URL}/api/leaves`, { withCredentials: true }),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todayCount = attendance.data.filter((a) => a.date === today).length;
      const pendingCount = leaves.data.filter((l) => l.status === 'pending').length;

      setStats({
        totalEmployees: employees.data.length,
        todayAttendance: todayCount,
        pendingLeaves: pendingCount,
        monthlyPayroll: employees.data.reduce((sum, emp) => sum + (emp.salary || 0), 0),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const statCards = [
    { icon: Users, label: 'Total Employees', value: stats.totalEmployees, color: 'zinc' },
    { icon: Clock, label: 'Today Attendance', value: stats.todayAttendance, color: 'zinc' },
    { icon: Calendar, label: 'Pending Leaves', value: stats.pendingLeaves, color: 'zinc' },
    { icon: DollarSign, label: 'Monthly Payroll', value: `$${stats.monthlyPayroll.toLocaleString()}`, color: 'zinc' },
  ];

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 flex-1 min-h-screen bg-[#FAFAFA]">
        <div className="p-6 md:p-8" data-testid="admin-dashboard">
          <h1 className="text-4xl tracking-tighter font-black mb-2" data-testid="admin-dashboard-title">
            ADMIN DASHBOARD
          </h1>
          <p className="text-sm text-zinc-500 mb-8">Overview of your employee management system</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

          <div className="mt-8 bg-white border border-zinc-200 p-6">
            <h2 className="text-2xl tracking-tight font-bold mb-4">QUICK ACTIONS</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/admin/employees"
                data-testid="quick-action-add-employee"
                className="p-4 border border-zinc-950 text-center transition-all duration-150 hover:bg-zinc-900 hover:text-white"
              >
                <p className="text-xs font-bold uppercase tracking-widest">Add Employee</p>
              </a>
              <a
                href="/admin/leaves"
                data-testid="quick-action-manage-leaves"
                className="p-4 border border-zinc-950 text-center transition-all duration-150 hover:bg-zinc-900 hover:text-white"
              >
                <p className="text-xs font-bold uppercase tracking-widest">Manage Leaves</p>
              </a>
              <a
                href="/admin/payroll"
                data-testid="quick-action-run-payroll"
                className="p-4 border border-zinc-950 text-center transition-all duration-150 hover:bg-zinc-900 hover:text-white"
              >
                <p className="text-xs font-bold uppercase tracking-widest">Run Payroll</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
