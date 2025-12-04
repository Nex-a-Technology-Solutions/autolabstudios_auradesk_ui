import React, { useState, useEffect, useCallback } from "react";
import { Ticket, Project } from "@/api/entities";
import { Gmail } from "@/api/integrations";
import { Link, useNavigate } from "react-router-dom";
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
  AlertTriangle,
  Loader2,
  Calendar,
  Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Notification Components
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

export default function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const { branding, theme } = useBranding();
  const navigate = useNavigate();

  // Gmail import state
  const [notifications, setNotifications] = useState([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [timeRange, setTimeRange] = useState("1d"); // NEW: Time range filter
  const [maxEmails, setMaxEmails] = useState([15]); // NEW: Max emails slider
  const [importResults, setImportResults] = useState(null);

  const addNotification = useCallback((type, message) => {
    setNotifications(prev => [...prev, { id: Date.now(), type, message }]);
  }, []);

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
        ticketData = await Ticket.filter({ client__email: user.email }, "-created_date");
        if (user.projects && user.projects.length > 0) {
          const userProjectsData = await Promise.all(
            user.projects.map(projectId => Project.filter({ id: projectId }))
          );
          projectData = userProjectsData.flat().map(response => 
            Array.isArray(response) ? response : (response?.results || response || [])
          ).flat();
        } else {
          projectData = [];
        }
      }

      setTickets(Array.isArray(ticketData) ? ticketData : (ticketData?.results || []));
      setProjects(Array.isArray(projectData) ? projectData : (projectData?.results || []));
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      addNotification('error', 'Failed to load dashboard data. Please try refreshing the page.');
    }
    setIsLoading(false);
  }, [user, addNotification]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleGmailImport = async () => {
    setIsImporting(true);
    setImportResults(null);

    try {
      // Check Gmail connection
      const status = await Gmail.getStatus();
      
      if (!status.connected) {
        addNotification('warning', 'Gmail not connected. Redirecting to integrations...');
        setIsImporting(false);
        setTimeout(() => {
          navigate(createPageUrl("Integrations"));
        }, 1500);
        return;
      }

      // Build Gmail query based on time range
      let query = 'is:unread';
      if (timeRange !== 'all') {
        query += ` newer_than:${timeRange}`;
      }

      console.log('Gmail sync query:', query, 'Max emails:', maxEmails[0]);

      // Call Gmail.sync WITHOUT project_id - AI handles assignment
      const result = await Gmail.sync(null, query, maxEmails[0]);
      
      if (result.success) {
        setImportResults(result);
        
        // Build detailed message
        let message = `Processed ${result.messages_processed} emails. `;
        message += `Created ${result.tickets_created} ticket${result.tickets_created !== 1 ? 's' : ''}`;
        
        if (result.skipped_emails && result.skipped_emails.length > 0) {
          message += `, skipped ${result.skipped_emails.length} non-support email${result.skipped_emails.length !== 1 ? 's' : ''}`;
        }
        
        if (result.errors && result.errors.length > 0) {
          message += `, ${result.errors.length} error${result.errors.length !== 1 ? 's' : ''}`;
        }

        if (result.tickets_created === 0) {
          addNotification('info', message);
        } else {
          addNotification('success', message);
          await loadDashboardData();
        }
        
        setShowImportDialog(false);
        setTimeRange("1d");
        setMaxEmails([15]);
      } else {
        addNotification('error', result.error || 'Gmail sync failed');
      }
      
    } catch (error) {
      console.error("Gmail import error:", error);
      const errorMsg = error.message || 'An unexpected error occurred';
      addNotification('error', `Failed to import from Gmail: ${errorMsg}`);
      
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

  const pageTitle = user?.role === 'admin' ? "Welcome back to Scribe Desk" : branding.displayName;
  const pageDescription = user?.role === 'admin'
    ? 'Complete overview of support activity across all projects and clients.'
    : 'Welcome to your support portal. View your tickets and get help when you need it.';

  // Time range options
  const timeRangeOptions = [
    { value: '1h', label: 'Last 1 hour', description: 'Most recent emails' },
    { value: '1d', label: 'Last 24 hours', description: 'Today\'s emails' },
    { value: '3d', label: 'Last 3 days', description: 'Recent emails' },
    { value: '7d', label: 'Last 7 days', description: 'This week\'s emails' },
    { value: 'all', label: 'All unread', description: 'Every unread email' }
  ];

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
                <DialogContent className="sm:max-w-[550px] p-6 bg-white rounded-lg shadow-xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-800">Import Gmail Tickets</DialogTitle>
                    <DialogDescription className="text-gray-600 mt-2">
                      AI will automatically detect projects and assign tickets intelligently.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-6 space-y-6">
                    {/* Time Range Selection */}
                    <div>
                      <Label htmlFor="timeRange" className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Time Range
                      </Label>
                      <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-full mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeRangeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex flex-col">
                                <span className="font-medium">{option.label}</span>
                                <span className="text-xs text-gray-500">{option.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Max Emails Slider */}
                    <div>
                      <Label htmlFor="maxEmails" className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                        <span className="flex items-center">
                          <Hash className="w-4 h-4 mr-2" />
                          Maximum Emails
                        </span>
                        <span className="text-blue-600 font-bold">{maxEmails[0]}</span>
                      </Label>
                      <Slider
                        id="maxEmails"
                        min={5}
                        max={50}
                        step={5}
                        value={maxEmails}
                        onValueChange={setMaxEmails}
                        className="mt-4"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>5 emails</span>
                        <span>50 emails</span>
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                        <Info className="w-4 h-4 mr-2" />
                        Smart Import Features
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• AI filters out promotions and social emails</li>
                        <li>• Auto-matches senders with existing clients</li>
                        <li>• Detects project from email content</li>
                        <li>• Assigns to user's project if they have one</li>
                        <li>• Leaves unassigned if user has multiple projects</li>
                        <li>• Creates guest accounts for new senders</li>
                      </ul>
                    </div>
                  </div>

                  <DialogFooter className="mt-6 flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowImportDialog(false);
                        setTimeRange("1d");
                        setMaxEmails([15]);
                      }} 
                      disabled={isImporting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleGmailImport} 
                      disabled={isImporting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Import Emails
                        </>
                      )}
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