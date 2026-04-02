import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { DollarSign, Calendar } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function EmployeeSalary() {
  const { user } = useAuth();
  const [salaryRecords, setSalaryRecords] = useState([]);

  useEffect(() => {
    fetchSalary();
  }, []);

  const fetchSalary = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/salary/me`, { withCredentials: true });
      setSalaryRecords(data);
    } catch (error) {
      console.error('Error fetching salary:', error);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 flex-1 min-h-screen bg-[#FAFAFA]">
        <div className="p-6 md:p-8" data-testid="employee-salary-page">
          <h1 className="text-4xl tracking-tighter font-black mb-2" data-testid="employee-salary-title">
            MY SALARY
          </h1>
          <p className="text-sm text-zinc-500 mb-8">View your salary details and payment history</p>

          <div className="mb-8 bg-white border border-zinc-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign size={32} className="text-zinc-950" />
              <div>
                <p className="text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Current Monthly Salary</p>
                <p className="text-4xl tracking-tighter font-black" data-testid="current-salary-amount">
                  ${(user?.salary || 0).toLocaleString()}
                </p>
              </div>
            </div>
            {user?.position && (
              <div className="mt-4 pt-4 border-t border-zinc-200">
                <p className="text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Position</p>
                <p className="text-sm font-bold mt-1" data-testid="employee-position">{user.position}</p>
              </div>
            )}
          </div>

          <h2 className="text-2xl tracking-tight font-bold mb-4">PAYMENT HISTORY</h2>
          <div className="bg-white border border-zinc-200">
            <table className="w-full" data-testid="salary-history-table">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Month</th>
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Amount</th>
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Status</th>
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Processed Date</th>
                </tr>
              </thead>
              <tbody>
                {salaryRecords.map((record) => (
                  <tr key={record._id} className="border-b border-zinc-100" data-testid={`salary-row-${record._id}`}>
                    <td className="p-4 text-sm font-bold">{record.month}</td>
                    <td className="p-4 text-sm font-bold">${record.salary?.toLocaleString()}</td>
                    <td className="p-4">
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-green-100 text-green-800 border border-green-800">
                        {record.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-zinc-600">
                      {record.processed_at ? new Date(record.processed_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {salaryRecords.length === 0 && (
              <div className="p-12 text-center" data-testid="salary-empty-state">
                <p className="text-sm text-zinc-500">No salary records found. Payroll will be processed soon.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
