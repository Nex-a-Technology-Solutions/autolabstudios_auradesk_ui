import React, { useState, useEffect, useCallback } from "react";
import { Ticket, Project, User } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useUser } from "../components/auth/UserProvider";
import { useBranding } from "../components/branding/BrandingProvider";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  Plus,
  Calendar,
  User as UserIcon,
  Flag,
  Tag,
  Building,
  UserCheck,
  Mail,
  CheckSquare,
  X
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import EmailImportModal from "../components/import/EmailImportModal";

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

const extractArrayFromResponse = (response) => {
  if (Array.isArray(response)) {
    return response;
  }
  if (response && response.results && Array.isArray(response.results)) {
    return response.results;
  }
  return [];
};

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const { user } = useUser();
  const { branding, theme } = useBranding();

  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Bulk project assignment state
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [showProjectAssignDialog, setShowProjectAssignDialog] = useState(false);
  const [bulkProjectId, setBulkProjectId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const loadTickets = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      let ticketData;
      let projectData;
      let staffData = [];

      if (user.role === 'admin') {
        const ticketResponse = await Ticket.list("-created_date");
        ticketData = extractArrayFromResponse(ticketResponse);

        const projectResponse = await Project.list();
        projectData = extractArrayFromResponse(projectResponse);

        try {
          const staffResponse = await User.filter({ role: 'admin' });
          staffData = extractArrayFromResponse(staffResponse);
        } catch (staffError) {
          console.warn("Failed to load staff using filter, trying alternative approach:", staffError);
          try {
            const allUsersResponse = await User.list();
            const allUsers = extractArrayFromResponse(allUsersResponse);
            staffData = allUsers.filter(u => u.role === 'admin');
          } catch (listError) {
            console.error("Failed to load staff members:", listError);
            staffData = [];
          }
        }
      } else {
        const ticketResponse = await Ticket.filter({ client_email: user.email }, "-created_date");
        ticketData = extractArrayFromResponse(ticketResponse);

        if (user.projects && user.projects.length > 0) {
          try {
            const userProjectPromises = user.projects.map(async (projectId) => {
              const projectResponse = await Project.filter({ id: projectId });
              return extractArrayFromResponse(projectResponse);
            });
            
            const userProjectsData = await Promise.all(userProjectPromises);
            projectData = userProjectsData.flat();
          } catch (projectError) {
            console.error("Failed to load user projects:", projectError);
            projectData = [];
          }
        } else {
          projectData = [];
        }
      }

      setTickets(ticketData);
      setProjects(projectData);
      setStaffMembers(staffData);
    } catch (error) {
      console.error("Error loading tickets:", error);
      setTickets([]);
      setProjects([]);
      setStaffMembers([]);
    }
    setIsLoading(false);
  }, [user]);

  const filterTickets = useCallback(() => {
    let filtered = [...tickets];

    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    if (projectFilter !== "all") {
      if (projectFilter === "unassigned") {
        filtered = filtered.filter(ticket => !ticket.project_id);
      } else {
        filtered = filtered.filter(ticket => ticket.project_id === projectFilter);
      }
    }

    if (assignedFilter !== "all") {
      if (assignedFilter === "unassigned") {
        filtered = filtered.filter(ticket => !ticket.assigned_staff);
      } else {
        filtered = filtered.filter(ticket => ticket.assigned_staff === assignedFilter);
      }
    }

    setFilteredTickets(filtered);
  }, [tickets, searchTerm, statusFilter, priorityFilter, projectFilter, assignedFilter]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    filterTickets();
  }, [filterTickets]);

  const handleEmailImport = async (ticketData) => {
    setIsImporting(true);
    try {
      await Ticket.create(ticketData);
      setShowImportModal(false);
      loadTickets();
      alert('Ticket created successfully from email import!');
    } catch (error) {
      console.error('Error creating ticket from email:', error);
      alert('Failed to create ticket. Please try again.');
    }
    setIsImporting(false);
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unassigned';
  };

  // Toggle individual ticket selection
  const toggleTicketSelection = (ticketId) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  // Select all filtered tickets
  const toggleSelectAll = () => {
    if (selectedTickets.length === filteredTickets.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(filteredTickets.map(t => t.id));
    }
  };

  // Handle bulk project assignment
  const handleBulkProjectAssign = async () => {
    if (!bulkProjectId || selectedTickets.length === 0) {
      return;
    }

    setIsAssigning(true);
    try {
      // Update each selected ticket
      await Promise.all(
        selectedTickets.map(ticketId => 
          Ticket.update(ticketId, { project_id: bulkProjectId })
        )
      );

      // Success - refresh and clear selection
      await loadTickets();
      setSelectedTickets([]);
      setShowProjectAssignDialog(false);
      setBulkProjectId("");
      
      alert(`Successfully assigned ${selectedTickets.length} ticket(s) to project!`);
    } catch (error) {
      console.error('Error assigning projects:', error);
      alert('Failed to assign projects. Please try again.');
    }
    setIsAssigning(false);
  };

  const pageTitle = user?.role === 'admin' ? "All Tickets" : "My Tickets";
  const pageDescription = user?.role === 'admin' 
    ? "Manage and track all support tickets across all projects." 
    : "Track your submitted support tickets across your projects.";

  return (
    <div className={`p-4 md:p-8 min-h-screen bg-gradient-to-br ${theme.bg}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent leading-tight">
              {pageTitle}
            </h1>
            <p className="text-slate-600 text-lg font-medium">
              {pageDescription}
            </p>
          </div>
          <div className="flex gap-3">
            {user?.role === 'admin' && selectedTickets.length > 0 && (
              <Button 
                onClick={() => setShowProjectAssignDialog(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl font-semibold tracking-tight transition-all duration-300 hover:scale-105"
              >
                <Building className="w-5 h-5 mr-2" />
                Assign Project ({selectedTickets.length})
              </Button>
            )}
            {user?.role === 'admin' && (
              <Button 
                variant="outline"
                onClick={() => setShowImportModal(true)}
                className={`${theme.text} border-slate-300 hover:bg-slate-50 hover:border-slate-400 px-6 py-3 rounded-2xl font-semibold tracking-tight transition-all duration-300 hover:scale-105`}
              >
                <Mail className="w-5 h-5 mr-2" />
                Import from Email
              </Button>
            )}
            <Link to={createPageUrl("CreateTicket")}>
              <Button className={`w-full sm:w-auto bg-gradient-to-r ${theme.primary} hover:${theme.primaryHover} text-white shadow-xl ${theme.shadow} px-8 py-3 rounded-2xl font-semibold tracking-tight transition-all duration-300 hover:scale-105`}>
                <Plus className="w-5 h-5 mr-2" />
                New Ticket
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 mb-8 shadow-lg shadow-slate-200/20">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 rounded-xl"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="sm:w-40 bg-white border-slate-300 text-slate-900 rounded-xl">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 rounded-xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="sm:w-40 bg-white border-slate-300 text-slate-900 rounded-xl">
                  <Flag className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 rounded-xl">
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="sm:w-48 bg-white border-slate-300 text-slate-900 rounded-xl">
                  <Building className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 rounded-xl">
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {user?.role === 'admin' && (
                <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                  <SelectTrigger className="sm:w-48 bg-white border-slate-300 text-slate-900 rounded-xl">
                    <UserCheck className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Assigned" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 rounded-xl">
                    <SelectItem value="all">All Assignments</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.email}>
                        {staff.full_name || staff.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Select All Checkbox (Admin Only) */}
          {user?.role === 'admin' && filteredTickets.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedTickets.length === filteredTickets.length && filteredTickets.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium text-slate-700 cursor-pointer">
                Select all {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
                {selectedTickets.length > 0 && ` (${selectedTickets.length} selected)`}
              </label>
              {selectedTickets.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTickets([])}
                  className="ml-auto text-slate-500 hover:text-slate-700"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear selection
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                 <Skeleton className="h-6 w-3/4 mb-4 bg-gray-200" />
                 <Skeleton className="h-4 w-full mb-4 bg-gray-100" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full bg-gray-200" />
                  <Skeleton className="h-6 w-20 rounded-full bg-gray-200" />
                  <Skeleton className="h-6 w-32 rounded-full bg-gray-200" />
                </div>
              </div>
            ))
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 group shadow-md"
              >
                <div className="flex gap-4">
                  {/* Checkbox for bulk selection (Admin Only) */}
                  {user?.role === 'admin' && (
                    <div className="flex items-start pt-1">
                      <Checkbox
                        checked={selectedTickets.includes(ticket.id)}
                        onCheckedChange={() => toggleTicketSelection(ticket.id)}
                      />
                    </div>
                  )}

                  {/* Ticket Content - Clickable Link */}
                  <Link
                    to={createPageUrl(`TicketDetail?id=${ticket.id}`)}
                    className="flex-1"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 mb-2 tracking-tight">
                          {ticket.title}
                        </h3>
                        <div className="flex items-center gap-4 text-slate-500 text-sm flex-wrap font-medium">
                          <div className="flex items-center gap-1.5">
                            <UserIcon className="w-4 h-4" />
                            <span>{ticket.client_email?.split('@')[0] || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Building className="w-4 h-4" />
                            <span className={!ticket.project_id ? "text-orange-600 font-semibold" : ""}>
                              {getProjectName(ticket.project_id)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(ticket.created_date), "MMM d, yyyy")}</span>
                          </div>
                          {ticket.assigned_staff && (
                            <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-1 rounded-full">
                              <UserCheck className="w-4 h-4 text-indigo-600" />
                              <span className="text-indigo-700 font-medium">
                                {ticket.assigned_staff.split('@')[0]}
                              </span>
                            </div>
                          )}
                          <span className="text-slate-400 font-mono text-xs">
                            #{ticket.id.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-600 line-clamp-2 text-sm mb-4 leading-relaxed">
                      {ticket.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Badge className={`${statusColors[ticket.status]} border text-xs font-semibold px-3 py-1 rounded-full`}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={`${priorityColors[ticket.priority]} border text-xs font-semibold px-3 py-1 rounded-full`}>
                        <Flag className="w-3 h-3 mr-1.5" />
                        {ticket.priority}
                      </Badge>
                      <Badge className="bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border-purple-200 text-xs font-semibold px-3 py-1 rounded-full">
                        <Tag className="w-3 h-3 mr-1.5" />
                        {ticket.category?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {!isLoading && filteredTickets.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
            <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filter criteria, or create a new ticket
            </p>
            <Link to={createPageUrl("CreateTicket")}>
              <Button className={`bg-gradient-to-r ${theme.primary} hover:${theme.primaryHover} text-white shadow-xl ${theme.shadow} px-8 py-3 rounded-2xl font-semibold tracking-tight transition-all duration-300 hover:scale-105`}>
                <Plus className="w-5 h-5 mr-2" />
                Create First Ticket
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Email Import Modal */}
      <EmailImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleEmailImport}
        projects={projects}
        isImporting={isImporting}
      />

      {/* Bulk Project Assignment Dialog */}
      <Dialog open={showProjectAssignDialog} onOpenChange={setShowProjectAssignDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Project to Tickets</DialogTitle>
            <DialogDescription>
              Select a project to assign to {selectedTickets.length} selected ticket{selectedTickets.length !== 1 ? 's' : ''}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={bulkProjectId} onValueChange={setBulkProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.display_name || project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowProjectAssignDialog(false);
                setBulkProjectId("");
              }}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkProjectAssign}
              disabled={!bulkProjectId || isAssigning}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isAssigning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Assigning...
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Assign Project
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}