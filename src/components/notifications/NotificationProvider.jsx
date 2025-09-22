import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Ticket } from '@/api/entities';
import { useUser } from '../auth/UserProvider';
import { Bell, X, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [lastChecked, setLastChecked] = useState(Date.now());
  const [showNotifications, setShowNotifications] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const { user } = useUser();

  const checkForNewTickets = useCallback(async () => {
    // Only check for admins and prevent multiple simultaneous checks
    if (!user || user.role !== 'admin' || isChecking) return;
    
    setIsChecking(true);
    try {
      // Only check for tickets created in the last 10 minutes to reduce load
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const recentTickets = await Ticket.filter(
        { 
          created_date: { $gte: tenMinutesAgo.toISOString() }
        },
        '-created_date',
        5 // Limit to 5 most recent tickets to reduce data load
      );
      
      // Filter out tickets we've already seen
      const newTickets = recentTickets.filter(ticket => 
        new Date(ticket.created_date).getTime() > lastChecked
      );
      
      if (newTickets.length > 0) {
        const newNotifications = newTickets.map(ticket => ({
          id: `ticket-${ticket.id}`,
          type: 'new_ticket',
          title: 'New Ticket Created',
          message: `${ticket.title} - ${ticket.client_email}`,
          ticket: ticket,
          timestamp: ticket.created_date,
          read: false
        }));
        
        setNotifications(prev => [...newNotifications, ...prev].slice(0, 20)); // Keep only 20 most recent
      }
      
      setLastChecked(Date.now());
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Error checking for new tickets:', error);
      
      // Implement exponential backoff for errors
      if (error.response?.status === 429 || error.message === 'Network Error') {
        setRetryCount(prev => Math.min(prev + 1, 6)); // Cap at 6 retries (max 10+ minute delay)
      }
      // For other errors, don't spam the logs but still increment retry count
    } finally {
      setIsChecking(false);
    }
  }, [user, lastChecked, isChecking]);

  useEffect(() => {
    if (user?.role === 'admin') {
      // Initial check after 10 seconds to avoid immediate load
      const initialTimer = setTimeout(() => {
        checkForNewTickets();
      }, 10000);
      
      // Then check with exponential backoff based on retry count
      const baseInterval = 300000; // Base: 5 minutes instead of 2
      const interval = baseInterval * Math.pow(1.5, retryCount); // Gentler exponential backoff
      const maxInterval = 1800000; // Max: 30 minutes
      
      const actualInterval = Math.min(interval, maxInterval);
      
      const intervalTimer = setInterval(checkForNewTickets, actualInterval);
      
      return () => {
        clearTimeout(initialTimer);
        clearInterval(intervalTimer);
      };
    }
  }, [user, checkForNewTickets, retryCount]);

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead, 
      clearAll,
      showNotifications,
      setShowNotifications 
    }}>
      {children}
      
      {user?.role === 'admin' && (
        <div className="fixed top-4 right-4 z-50">
          <div className="relative">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="bg-white/90 backdrop-blur-sm border-slate-300 hover:bg-slate-100 rounded-xl shadow-lg"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>

            {showNotifications && (
              <div className="absolute top-12 right-0 w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 backdrop-blur-xl z-10">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearAll} className="text-slate-500 text-xs">
                        Clear All
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowNotifications(false)}
                      className="w-6 h-6"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>No new notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <Link
                        key={notification.id}
                        to={createPageUrl(`TicketDetail?id=${notification.ticket.id}`)}
                        onClick={() => {
                          markAsRead(notification.id);
                          setShowNotifications(false);
                        }}
                        className={`block p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                          !notification.read ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            notification.ticket.priority === 'urgent' ? 'bg-red-100' :
                            notification.ticket.priority === 'high' ? 'bg-orange-100' :
                            'bg-blue-100'
                          }`}>
                            {notification.ticket.priority === 'urgent' ? 
                              <AlertCircle className="w-4 h-4 text-red-600" /> :
                              <Clock className="w-4 h-4 text-blue-600" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 text-sm">
                              {notification.title}
                            </p>
                            <p className="text-slate-600 text-sm truncate">
                              {notification.message}
                            </p>
                            <p className="text-slate-400 text-xs mt-1">
                              {format(new Date(notification.timestamp), 'MMM d, h:mm a')}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}