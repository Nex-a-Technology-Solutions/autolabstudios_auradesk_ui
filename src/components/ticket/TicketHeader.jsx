import React, { useState, useEffect } from "react";
import { User, Project } from "@/api/entities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, User as UserIcon, Tag, Flag, AlertCircle, MessageSquare, Bell, Clock, Building } from "lucide-react";
import { format } from "date-fns";
import { Alert } from "@/components/ui/alert";

const statusColors = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-gray-100 text-gray-700 border-gray-300"
};

const priorityColors = {
  low: "bg-sky-50 text-sky-700 border-sky-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  urgent: "bg-red-50 text-red-700 border-red-200"
};

const categoryColors = {
  bug_report: "bg-red-50 text-red-700 border-red-200",
  feature_request: "bg-purple-50 text-purple-700 border-purple-200",
  general_inquiry: "bg-blue-50 text-blue-700 border-blue-200",
  technical_support: "bg-green-50 text-green-700 border-green-200",
  feedback: "bg-indigo-50 text-indigo-700 border-indigo-200"
};

// Helper function to extract array from paginated response
const extractArrayFromResponse = (response) => {
  if (Array.isArray(response)) {
    return response;
  }
  if (response && response.results && Array.isArray(response.results)) {
    return response.results;
  }
  return [];
};

export default function TicketHeader({ 
  ticket, 
  messages = [],
  onStatusUpdate, 
  onAssignmentUpdate, 
  onProjectUpdate,
  onAddNotification,
  userRole 
}) {
  const [staffMembers, setStaffMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [notificationText, setNotificationText] = useState("");

  // Get recent admin updates/notifications
  const getRecentUpdates = () => {
    if (!messages || messages.length === 0) return [];
    
    const adminUpdates = messages
      .filter(message => 
        message.message_type === "status_change" || 
        message.message_type === "assignment" ||
        (message.message_type === "status_change" && message.sender_name?.includes("Admin"))
      )
      .slice(-2)
      .reverse();
    
    return adminUpdates;
  };

  const recentUpdates = getRecentUpdates();

  useEffect(() => {
    if (userRole === 'admin') {
      loadStaffMembers();
      loadProjects();
    }
  }, [userRole]);

  const loadStaffMembers = async () => {
    try {
      let adminUsers = [];
      
      try {
        const staffResponse = await User.filter({ role: 'user' });
        adminUsers = extractArrayFromResponse(staffResponse);
      } catch (filterError) {
        console.warn("User.filter failed, trying alternative approach:", filterError);
        
        try {
          const allUsersResponse = await User.list();
          const allUsers = extractArrayFromResponse(allUsersResponse);
          adminUsers = allUsers.filter(u => u.role === 'admin');
        } catch (listError) {
          console.error("Failed to load users with list method:", listError);
          adminUsers = [];
        }
      }
      
      setStaffMembers(adminUsers);
    } catch (error) {
      console.error("Error loading staff members:", error);
      setStaffMembers([]);
    }
  };

  const loadProjects = async () => {
    try {
      const projectResponse = await Project.list();
      const projectData = extractArrayFromResponse(projectResponse);
      setProjects(projectData);
    } catch (error) {
      console.error("Error loading projects:", error);
      setProjects([]);
    }
  };

  const handleAddNotification = async () => {
    if (!notificationText.trim()) return;
    
    await onAddNotification(notificationText);
    setNotificationText("");
    setShowNotificationForm(false);
  };

  const handleQuickResolve = () => {
    onStatusUpdate('resolved');
  };

  const handleQuickClose = () => {
    onStatusUpdate('closed');
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? (project.display_name || project.name) : 'Unassigned';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex-1">
          <div className="flex flex-wrap gap-3 mb-4">
            <Badge className={`${statusColors[ticket.status]} border text-sm font-semibold px-3 py-1 rounded-full`}>
              {ticket.status.replace('_', ' ')}
            </Badge>
            <Badge className={`${priorityColors[ticket.priority]} border text-sm font-semibold px-3 py-1 rounded-full`}>
              <Flag className="w-3 h-3 mr-1.5" />
              {ticket.priority}
            </Badge>
            <Badge className={`${categoryColors[ticket.category]} border text-sm font-semibold px-3 py-1 rounded-full`}>
              <Tag className="w-3 h-3 mr-1.5" />
              {ticket.category?.replace(/_/g, ' ')}
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              <span>{ticket.client_email?.split('@')[0] || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              <span className={!ticket.project_id ? "text-orange-600 font-semibold" : ""}>
                {getProjectName(ticket.project_id)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Created {format(new Date(ticket.created_date), "MMM d, yyyy 'at' h:mm a")}</span>
            </div>
            {ticket.assigned_staff && (
              <div className="flex items-center gap-2 bg-indigo-50 px-2 py-1 rounded-full">
                <UserIcon className="w-4 h-4 text-indigo-600" />
                <span className="text-indigo-700 font-medium">
                  Assigned to {ticket.assigned_staff.split('@')[0]}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Admin Controls */}
        {userRole === 'admin' && (
          <div className="flex flex-col gap-3 w-full lg:w-auto">
            {/* Status, Assignment, and Project Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={ticket.status} onValueChange={onStatusUpdate}>
                <SelectTrigger className="w-full sm:w-40 bg-white border-gray-300 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={ticket.project_id || "unassigned"} 
                onValueChange={(value) => onProjectUpdate(value === "unassigned" ? null : value)}
              >
                <SelectTrigger className="w-full sm:w-48 bg-white border-gray-300 text-gray-900">
                  <Building className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Assign project..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="unassigned">No Project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.display_name || project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={ticket.assigned_staff || "unassigned"} 
                onValueChange={(value) => onAssignmentUpdate(value === "unassigned" ? null : value)}
              >
                <SelectTrigger className="w-full sm:w-48 bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Assign to..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff.id} value={staff.email}>
                      {staff.full_name || staff.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {ticket.status !== 'resolved' && (
                <Button
                  onClick={handleQuickResolve}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Quick Resolve
                </Button>
              )}
              
              {ticket.status !== 'closed' && (
                <Button
                  onClick={handleQuickClose}
                  size="sm"
                  variant="outline"
                  className="border-gray-400 text-gray-700"
                >
                  Close Ticket
                </Button>
              )}

              <Button
                onClick={() => setShowNotificationForm(!showNotificationForm)}
                size="sm"
                variant="outline"
                className="border-blue-400 text-blue-700"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Add Update
              </Button>
            </div>

            {/* Admin Notification Form */}
            {showNotificationForm && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Add Status Update or Notification
                  </label>
                  <Textarea
                    placeholder="e.g., 'Investigating the issue with the development team' or 'Scheduled for next release'"
                    value={notificationText}
                    onChange={(e) => setNotificationText(e.target.value)}
                    className="bg-white border-blue-300 text-gray-900 placeholder:text-gray-500"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={() => setShowNotificationForm(false)}
                    size="sm"
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddNotification}
                    size="sm"
                    disabled={!notificationText.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Add Update
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Client Status Display (Read-only) */}
        {userRole !== 'admin' && (
          <div className="text-center lg:text-right">
            <p className="text-sm text-gray-500 mb-2">Ticket Status</p>
            <div className="space-y-2">
              <Badge className={`${statusColors[ticket.status]} border text-lg font-semibold px-4 py-2 rounded-full`}>
                {ticket.status.replace('_', ' ')}
              </Badge>
              {ticket.status === 'closed' && (
                <p className="text-xs text-gray-400">This ticket has been closed</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recent Admin Updates - Prominent Display */}
      {recentUpdates.length > 0 && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-indigo-600" />
            <h4 className="font-semibold text-indigo-900 text-sm">Latest Updates</h4>
          </div>
          <div className="space-y-2">
            {recentUpdates.map((update, index) => (
              <Alert key={index} className="bg-indigo-50 border-indigo-200 text-indigo-800 py-3">
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-indigo-900">{update.message}</p>
                    <p className="text-xs text-indigo-600 mt-1">
                      {update.sender_name} • {format(new Date(update.created_date), "MMM d 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Feature Request Development Notice for Open Feature Requests */}
      {ticket.category === 'feature_request' && ticket.status === 'open' && (
        <Alert className="mt-4 bg-purple-50 border-purple-200 text-purple-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-purple-900 mb-1">Feature Request Under Review</h4>
              <p className="text-sm">
                Our development team is reviewing this feature request. We'll contact you to discuss 
                implementation details, timeline, and any development costs before proceeding.
              </p>
            </div>
          </div>
        </Alert>
      )}

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Description</h4>
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
      </div>
    </div>
  );
}