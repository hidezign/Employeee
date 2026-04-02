import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminPayroll() {
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/payroll`, { withCredentials: true });
      setPayroll(data);
    } catch (error) {
      console.error('Error fetching payroll:', error);
    }
  };

  const handleRunPayroll = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/payroll/run`, {}, { withCredentials: true });
      toast.success(data.message);
      fetchPayroll();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to run payroll');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 flex-1 min-h-screen bg-[#FAFAFA]">
        <div className="p-6 md:p-8" data-testid="admin-payroll-page">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl tracking-tighter font-black mb-2" data-testid="admin-payroll-title">
                PAYROLL
              </h1>
              <p className="text-sm text-zinc-500">Manage employee salaries and payroll</p>
            </div>
            <Button
              onClick={handleRunPayroll}
              disabled={loading}
              data-testid="run-payroll-button"
              className="rounded-none border border-zinc-950 shadow-none hover:bg-zinc-900 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
            >
              <DollarSign size={16} className="mr-2" />
              {loading ? 'Processing...' : 'Run Payroll'}
            </Button>
          </div>

          <div className="bg-white border border-zinc-200">
            <table className="w-full" data-testid="payroll-table">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Employee</th>
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Month</th>
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Salary</th>
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Status</th>
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Processed At</th>
                </tr>
              </thead>
              <tbody>
                {payroll.map((record) => (
                  <tr key={record._id} className="border-b border-zinc-100" data-testid={`payroll-row-${record._id}`}>
                    <td className="p-4 text-sm font-bold">{record.user_name}</td>
                    <td className="p-4 text-sm text-zinc-600">{record.month}</td>
                    <td className="p-4 text-sm font-bold">${record.salary?.toLocaleString()}</td>
                    <td className="p-4">
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-green-100 text-green-800 border border-green-800">
                        {record.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-zinc-600">
                      {record.processed_at ? new Date(record.processed_at).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payroll.length === 0 && (
              <div className="p-12 text-center" data-testid="payroll-empty-state">
                <p className="text-sm text-zinc-500">No payroll records found. Run payroll to generate records.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
