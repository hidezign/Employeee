import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import axios from 'axios';
import { Bell, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function EmployeeNotifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/notifications/me`, { withCredentials: true });
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await axios.post(`${API_URL}/api/notifications/${id}/read`, {}, { withCredentials: true });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 flex-1 min-h-screen bg-[#FAFAFA]">
        <div className="p-6 md:p-8" data-testid="employee-notifications-page">
          <h1 className="text-4xl tracking-tighter font-black mb-2" data-testid="employee-notifications-title">
            NOTIFICATIONS
          </h1>
          <p className="text-sm text-zinc-500 mb-8">Stay updated with your leave and payroll status</p>

          <div className="space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                data-testid={`notification-${notif._id}`}
                className={`bg-white border p-4 flex items-start gap-4 ${
                  notif.read ? 'border-zinc-200' : 'border-zinc-950'
                }`}
              >
                <Bell size={20} className={notif.read ? 'text-zinc-400' : 'text-zinc-950'} />
                <div className="flex-1">
                  <p className={`text-sm ${notif.read ? 'text-zinc-600' : 'font-bold text-zinc-950'}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {notif.created_at ? new Date(notif.created_at).toLocaleString() : '-'}
                  </p>
                </div>
                {!notif.read && (
                  <Button
                    onClick={() => handleMarkRead(notif._id)}
                    data-testid={`mark-read-${notif._id}`}
                    size="sm"
                    className="rounded-none border border-zinc-950 shadow-none hover:bg-zinc-900 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
                  >
                    <CheckCircle size={14} className="mr-1" />
                    Mark Read
                  </Button>
                )}
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="bg-white border border-zinc-200 p-12 text-center" data-testid="notifications-empty-state">
                <Bell size={48} className="mx-auto mb-4 text-zinc-300" />
                <p className="text-sm text-zinc-500">No notifications yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
