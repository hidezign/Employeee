import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    salary: '',
    position: '',
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/employees`, { withCredentials: true });
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_URL}/api/employees`,
        {
          name: formData.name,
          email: formData.email,
          salary: parseFloat(formData.salary),
          position: formData.position,
        },
        { withCredentials: true }
      );
      toast.success('Employee added successfully');
      setOpen(false);
      setFormData({ name: '', email: '', salary: '', position: '' });
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add employee');
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 flex-1 min-h-screen bg-[#FAFAFA]">
        <div className="p-6 md:p-8" data-testid="employees-page">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl tracking-tighter font-black mb-2" data-testid="employees-page-title">
                EMPLOYEES
              </h1>
              <p className="text-sm text-zinc-500">Manage your employee records</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  data-testid="add-employee-button"
                  className="rounded-none border border-zinc-950 shadow-none hover:bg-zinc-900 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
                >
                  <Plus size={16} className="mr-2" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-none border-zinc-950">
                <DialogHeader>
                  <DialogTitle className="text-2xl tracking-tight font-bold">ADD NEW EMPLOYEE</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4" data-testid="add-employee-form">
                  <div>
                    <Label className="text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      data-testid="add-employee-name-input"
                      className="rounded-none"
                    />
                  </div>
                  <div>
                    <Label className="text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      data-testid="add-employee-email-input"
                      className="rounded-none"
                    />
                  </div>
                  <div>
                    <Label className="text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Position</Label>
                    <Input
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      required
                      data-testid="add-employee-position-input"
                      className="rounded-none"
                    />
                  </div>
                  <div>
                    <Label className="text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Salary</Label>
                    <Input
                      type="number"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      required
                      data-testid="add-employee-salary-input"
                      className="rounded-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    data-testid="add-employee-submit-button"
                    className="w-full rounded-none border border-zinc-950 shadow-none hover:bg-zinc-900 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
                  >
                    Add Employee
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-white border border-zinc-200">
            <table className="w-full" data-testid="employees-table">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Name</th>
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Email</th>
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Position</th>
                  <th className="text-left p-4 text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">Salary</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp._id} className="border-b border-zinc-100" data-testid={`employee-row-${emp._id}`}>
                    <td className="p-4 text-sm font-bold">{emp.name}</td>
                    <td className="p-4 text-sm text-zinc-600">{emp.email}</td>
                    <td className="p-4 text-sm text-zinc-600">{emp.position}</td>
                    <td className="p-4 text-sm font-bold">${emp.salary?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {employees.length === 0 && (
              <div className="p-12 text-center" data-testid="employees-empty-state">
                <p className="text-sm text-zinc-500">No employees found. Add your first employee to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
