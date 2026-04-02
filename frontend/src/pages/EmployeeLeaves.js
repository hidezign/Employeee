import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function EmployeeLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: '',
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/leaves/me`, { withCredentials: true });
      setLeaves(data);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/leaves`, formData, { withCredentials: true });
      toast.success('Leave request submitted successfully');
      setOpen(false);
      setFormData({ start_date: '', end_date: '', reason: '' });
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit leave request');
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
        <div className="p-6 md:p-8" data-testid="employee-leaves-page">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl tracking-tighter font-black mb-2" data-testid="employee-leaves-title">
                MY LEAVES
              </h1>
              <p className="text-sm text-zinc-500">Apply for and track your leave requests</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  data-testid="apply-leave-button"
                  className="rounded-none border border-zinc-950 shadow-none hover:bg-zinc-900 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
                >
                  <Plus size={16} className="mr-2" />
                  Apply Leave
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-none border-zinc-950">
                <DialogHeader>
                  <DialogTitle className="text-2xl tracking-tight font-bold">APPLY FOR LEAVE</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4" data-testid="apply-leave-form">
                  <div>
                    <Label className="text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Start Date</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                      data-testid="leave-start-date-input"
                      className="rounded-none"
                    />
                  </div>
                  <div>
                    <Label className="text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">End Date</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                      data-testid="leave-end-date-input"
                      className="rounded-none"
                    />
                  </div>
                  <div>
                    <Label className="text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Reason</Label>
                    <Textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      required
                      data-testid="leave-reason-input"
                      className="rounded-none"
                      rows={4}
                    />
                  </div>
                  <Button
                    type="submit"
                    data-testid="submit-leave-button"
                    className="w-full rounded-none border border-zinc-950 shadow-none hover:bg-zinc-900 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
                  >
                    Submit Request
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-white border border-zinc-200">
            <table className="w-full" data-testid="employee-leaves-table">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Start Date</th>
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">End Date</th>
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Reason</th>
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Status</th>
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave._id} className="border-b border-zinc-100" data-testid={`leave-row-${leave._id}`}>
                    <td className="p-4 text-sm font-bold">{leave.start_date}</td>
                    <td className="p-4 text-sm text-zinc-600">{leave.end_date}</td>
                    <td className="p-4 text-sm text-zinc-600">{leave.reason}</td>
                    <td className="p-4">{getStatusBadge(leave.status)}</td>
                    <td className="p-4 text-sm text-zinc-600">
                      {leave.created_at ? new Date(leave.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leaves.length === 0 && (
              <div className="p-12 text-center" data-testid="leaves-empty-state">
                <p className="text-sm text-zinc-500">No leave requests found. Apply for your first leave.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
