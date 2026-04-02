import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminLeaves() {
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/leaves`, { withCredentials: true });
      setLeaves(data);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.post(`${API_URL}/api/leaves/${id}/approve`, {}, { withCredentials: true });
      toast.success('Leave approved successfully');
      fetchLeaves();
    } catch (error) {
      toast.error('Failed to approve leave');
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.post(`${API_URL}/api/leaves/${id}/reject`, {}, { withCredentials: true });
      toast.success('Leave rejected successfully');
      fetchLeaves();
    } catch (error) {
      toast.error('Failed to reject leave');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-1 bg-green-100 text-green-800 border border-green-800">
          <CheckCircle size={12} />
          Approved
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-1 bg-red-100 text-red-800 border border-red-800">
          <XCircle size={12} />
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-1 bg-yellow-100 text-yellow-800 border border-yellow-800">
        <Clock size={12} />
        Pending
      </span>
    );
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 flex-1 min-h-screen bg-[#FAFAFA]">
        <div className="p-6 md:p-8" data-testid="admin-leaves-page">
          <h1 className="text-4xl tracking-tighter font-black mb-2" data-testid="admin-leaves-title">
            LEAVE REQUESTS
          </h1>
          <p className="text-sm text-zinc-500 mb-8">Manage employee leave requests</p>

          <div className="bg-white border border-zinc-200">
            <table className="w-full" data-testid="leaves-table">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Employee</th>
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Start Date</th>
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">End Date</th>
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Reason</th>
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Status</th>
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave._id} className="border-b border-zinc-100" data-testid={`leave-row-${leave._id}`}>
                    <td className="p-4 text-sm font-bold">{leave.user_name}</td>
                    <td className="p-4 text-sm text-zinc-600">{leave.start_date}</td>
                    <td className="p-4 text-sm text-zinc-600">{leave.end_date}</td>
                    <td className="p-4 text-sm text-zinc-600">{leave.reason}</td>
                    <td className="p-4">{getStatusBadge(leave.status)}</td>
                    <td className="p-4">
                      {leave.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApprove(leave._id)}
                            data-testid={`approve-leave-${leave._id}`}
                            size="sm"
                            className="rounded-none border border-green-800 bg-green-100 text-green-800 shadow-none hover:bg-green-800 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReject(leave._id)}
                            data-testid={`reject-leave-${leave._id}`}
                            size="sm"
                            className="rounded-none border border-red-800 bg-red-100 text-red-800 shadow-none hover:bg-red-800 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leaves.length === 0 && (
              <div className="p-12 text-center" data-testid="leaves-empty-state">
                <p className="text-sm text-zinc-500">No leave requests found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
