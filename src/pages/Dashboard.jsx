import React, { useState, useEffect, useCallback } from "react";
import { Ticket, Project } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useUser } from "../components/auth/UserProvider";
import { useBranding } from "../components/branding/BrandingProvider";
import {
  TicketIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Mail,
  XCircle,
  Info,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StatsCard from "../components/dashboard/StatsCard";
import RecentTickets from "../components/dashboard/RecentTickets";
import TicketChart from "../components/dashboard/TicketChart";
import ProjectTicketBreakdown from "../components/dashboard/ProjectTicketBreakdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// --- NotificationsList Component (defined within this file for self-containment) ---
const NotificationItem = ({ notification, onDismiss }) => {
  let icon;
  let bgColor;
  let textColor;

  switch (notification.type) {
    case 'success':
      icon = <CheckCircle className="h-5 w-5 text-green-500" />;
      bgColor = 'bg-green-50';
      textColor = 'text-green-800';
      break;
    case 'error':
      icon = <XCircle className="h-5 w-5 text-red-500" />;
      bgColor = 'bg-red-50';
      textColor = 'text-red-800';
      break;
    case 'info':
      icon = <Info className="h-5 w-5 text-blue-500" />;
      bgColor = 'bg-blue-50';
      textColor = 'text-blue-800';
      break;
    case 'warning':
      icon = <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      bgColor = 'bg-yellow-50';
      textColor = 'text-yellow-800';
      break;
    default:
      icon = <Info className="h-5 w-5 text-gray-500" />;
      bgColor = 'bg-gray-50';
      textColor = 'text-gray-800';
  }

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg shadow-sm ${bgColor} ${textColor}`}>
      <div className="flex items-center">
        {icon}
        <span className="ml-3 font-medium text-sm">{notification.message}</span>
      </div>
      <button onClick={() => onDismiss(notification.id)} className="text-gray-500 hover:text-gray-700">
        <XCircle className="h-5 w-5" />
      </button>
    </div>
  );
};

const NotificationsList = ({ notifications, onDismiss }) => {
  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {notifications.map(notification => (
        <NotificationItem key={notification.id} notification={notification} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
// --- End NotificationsList Component ---


export default function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const { branding, theme } = useBranding();

  // New state for notifications and Gmail import
  const [notifications, setNotifications] = useState([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Function to add a notification
  const addNotification = useCallback((type, message) => {
    setNotifications(prev => [...prev, { id: Date.now(), type, message }]);
  }, []);

  // Function to remove a notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!user) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
      let ticketData;
      let projectData;

      if (user.role === 'admin') {
        ticketData = await Ticket.list("-created_date");
        projectData = await Project.list();
      } else {
        ticketData = await Ticket.filter({ client_email: user.email }, "-created_date");
        if (user.projects && user.projects.length > 0) {
          const userProjectsData = await Promise.all(
            user.projects.map(projectId => Project.filter({ id: projectId }))
          );
          // Flatten and extract results from paginated responses
          projectData = userProjectsData.flat().map(response => response?.results || []).flat();
        } else {
          projectData = [];
        }
      }

      // Extract the results arrays from paginated responses
      setTickets(ticketData?.results || []);
      setProjects(projectData?.results || []);
      addNotification('info', 'Dashboard data loaded successfully.');
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      addNotification('error', 'Failed to load dashboard data. Please try refreshing the page.');
    }
    setIsLoading(false);
  }, [user, addNotification]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Function to handle Gmail import
  const handleGmailImport = async () => {
    setIsImporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      console.log("Gmail import initiated successfully!");
      addNotification('success', 'Gmail import process started. New tickets will appear shortly.');
      setShowImportDialog(false);
    } catch (error) {
      console.error("Error importing Gmail:", error);
      addNotification('error', 'Failed to import from Gmail. Please ensure permissions are granted and try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const getStats = () => {
    const openTickets = tickets.filter(t => t.status === 'open').length;
    const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
    const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
    const urgentTickets = tickets.filter(t => t.priority === 'urgent').length;

    return { openTickets, inProgressTickets, resolvedTickets, urgentTickets };
  };

  const stats = getStats();

  // Dynamic content based on user role
  const pageTitle = user?.role === 'admin' ? "Welcome back to aura dashboard" : branding.displayName;
  const pageDescription = user?.role === 'admin'
    ? 'Complete overview of support activity across all projects and clients.'
    : 'Welcome to your support portal. View your tickets and get help when you need it.';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg}`}>
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div className="space-y-2">
              <h1 className={`text-4xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent leading-tight`}>
                {pageTitle}
              </h1>
              <p className="text-slate-600 text-lg font-medium max-w-2xl leading-relaxed">
                {pageDescription}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to={createPageUrl("CreateTicket")}>
                <Button className={`w-full sm:w-auto bg-gradient-to-r ${theme.primary} hover:${theme.primaryHover} text-white shadow-xl ${theme.shadow} px-8 py-3 rounded-2xl font-semibold tracking-tight transition-all duration-300 hover:scale-105`}>
                  <Plus className="w-5 h-5 mr-3" />
                  New Ticket
                </Button>
              </Link>

              {user?.role === 'admin' && (
                <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full sm:w-auto ${theme.text} border-slate-300 hover:bg-slate-50 hover:border-slate-400 px-8 py-3 rounded-2xl font-semibold tracking-tight transition-all duration-300 hover:scale-105`}
                    >
                      <Mail className="w-5 h-5 mr-3" />
                      Import from Gmail
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] p-6 bg-white rounded-lg shadow-xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold text-gray-800">Import Gmail Tickets</DialogTitle>
                      <DialogDescription className="text-gray-600 mt-2">
                        This action will connect to your Gmail account and import relevant support emails as new tickets.
                        Ensure you have granted necessary permissions.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 text-sm text-gray-700">
                      Please note: This is a simulated import. In a real application, this would redirect
                      to a Gmail OAuth flow or similar, and then process emails on the backend.
                    </div>
                    <DialogFooter className="mt-6 flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowImportDialog(false)} disabled={isImporting}>
                        Cancel
                      </Button>
                      <Button onClick={handleGmailImport} disabled={isImporting}>
                        {isImporting ? 'Importing...' : 'Continue Import'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatsCard
              title="Open Tickets"
              value={stats.openTickets}
              icon={TicketIcon}
              color="blue"
              trend={isLoading ? "Loading..." : "+12% from last week"}
            />
            <StatsCard
              title="In Progress"
              value={stats.inProgressTickets}
              icon={Clock}
              color="amber"
              trend={isLoading ? "Loading..." : "3 assigned today"}
            />
            <StatsCard
              title="Resolved"
              value={stats.resolvedTickets}
              icon={CheckCircle}
              color="emerald"
              trend={isLoading ? "Loading..." : "+18% resolution rate"}
            />
            <StatsCard
              title="Urgent"
              value={stats.urgentTickets}
              icon={AlertCircle}
              color="rose"
              trend={isLoading ? "Loading..." : "2 need attention"}
            />
          </div>

          {/* Notifications Section */}
          <NotificationsList notifications={notifications} onDismiss={removeNotification} />

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <RecentTickets
                tickets={tickets.slice(0, 5)}
                isLoading={isLoading}
              />
              <ProjectTicketBreakdown
                tickets={tickets}
                projects={projects}
                isLoading={isLoading}
              />
            </div>
            <div>
              <TicketChart tickets={tickets} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}