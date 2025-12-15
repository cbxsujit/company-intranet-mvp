
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Notification, EntityType } from '../types';
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Bell, Check, ExternalLink, MailOpen } from 'lucide-react';

interface NotificationsProps {
  currentUser: User;
}

export const Notifications: React.FC<NotificationsProps> = ({ currentUser }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, [currentUser.id]);

  const loadNotifications = () => {
    setNotifications(getNotifications(currentUser.id));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(currentUser.id);
    loadNotifications();
  };

  const handleOpen = async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }
    
    // Refresh to update UI
    loadNotifications();

    if (!notification.entityId || notification.entityType === 'Other') return;

    switch (notification.entityType) {
      case EntityType.Page:
        navigate(`/pages/${notification.entityId}`);
        break;
      case EntityType.DocumentItem:
        navigate(`/documents/${notification.entityId}`);
        break;
      case EntityType.Announcement:
        navigate(`/announcements/${notification.entityId}`);
        break;
      default:
        break;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">Stay updated with the latest activities.</p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <Button variant="secondary" onClick={handleMarkAllRead}>
            <Check size={18} /> Mark all as read
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`p-5 transition-colors ${!notification.isRead ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className={`mt-1 p-2 rounded-full shrink-0 ${!notification.isRead ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                    {notification.isRead ? <MailOpen size={20} /> : <Bell size={20} />}
                  </div>
                  <div>
                    <h3 className={`font-medium text-slate-900 ${!notification.isRead ? 'font-bold' : ''}`}>
                      {notification.title}
                    </h3>
                    <p className="text-slate-600 mt-1">{notification.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span>{new Date(notification.createdOn).toLocaleString()}</span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded-full border border-slate-200">
                        {notification.entityType}
                      </span>
                    </div>
                  </div>
                </div>
                
                {notification.entityId && notification.entityType !== 'Other' && (
                  <Button size="sm" variant="ghost" onClick={() => handleOpen(notification)} className="shrink-0">
                    Open <ExternalLink size={14} className="ml-1" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {notifications.length === 0 && (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
              <div className="bg-slate-50 p-4 rounded-full mb-4">
                 <Bell size={32} className="text-slate-300" />
              </div>
              <p className="font-medium">You're all caught up!</p>
              <p className="text-sm">No new notifications.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
