import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import axios from 'axios';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminAttendance() {
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/attendance`, { withCredentials: true });
      setAttendance(data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 flex-1 min-h-screen bg-[#FAFAFA]">
        <div className="p-6 md:p-8" data-testid="admin-attendance-page">
          <h1 className="text-4xl tracking-tighter font-black mb-2" data-testid="admin-attendance-title">
            ATTENDANCE RECORDS
          </h1>
          <p className="text-sm text-zinc-500 mb-8">View all employee attendance</p>

          <div className="bg-white border border-zinc-200">
            <table className="w-full" data-testid="attendance-table">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Employee</th>
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Date</th>
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Check In</th>
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Check Out</th>
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record) => (
                  <tr key={record._id} className="border-b border-zinc-100" data-testid={`attendance-row-${record._id}`}>
                    <td className="p-4 text-sm font-bold">{record.user_name}</td>
                    <td className="p-4 text-sm text-zinc-600">{record.date}</td>
                    <td className="p-4 text-sm text-zinc-600">
                      {record.checkin_time ? new Date(record.checkin_time).toLocaleTimeString() : '-'}
                    </td>
                    <td className="p-4 text-sm text-zinc-600">
                      {record.checkout_time ? new Date(record.checkout_time).toLocaleTimeString() : '-'}
                    </td>
                    <td className="p-4">
                      {record.checkout_time ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-1 bg-green-100 text-green-800 border border-green-800">
                          <CheckCircle size={12} />
                          Complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-1 bg-yellow-100 text-yellow-800 border border-yellow-800">
                          <Clock size={12} />
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {attendance.length === 0 && (
              <div className="p-12 text-center" data-testid="attendance-empty-state">
                <p className="text-sm text-zinc-500">No attendance records found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
