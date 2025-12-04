import React, { useState, useEffect } from "react";
import {Invitations } from "@/api/entities";
import { useUser } from "../components/auth/UserProvider";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Building, Users, UserPlus, Mail, Edit2, Save, X, ShieldCheck, Settings } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

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

function ProjectsManager() {
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({
    name: "",
    display_name: "",
    primary_color: "blue"
  });

  const loadProjects = async () => {
    try {
      const projectListResponse = await Project.list();
      console.log("Projects response:", projectListResponse);
      const projectList = extractArrayFromResponse(projectListResponse);
      setProjects(projectList);
    } catch (error) {
      console.error("Error loading projects:", error);
      setProjects([]);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return;

    try {
      const projectData = {
        name: newProject.name,
        display_name: newProject.display_name || `${newProject.name} Help Desk`,
        primary_color: newProject.primary_color
      };

      await Project.create(projectData);
      setNewProject({ name: "", display_name: "", primary_color: "blue" });
      loadProjects();
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      await Project.delete(id);
      loadProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const colorOptions = [
    { value: "blue", label: "Blue", preview: "bg-blue-500" },
    { value: "purple", label: "Purple", preview: "bg-purple-500" },
    { value: "green", label: "Green", preview: "bg-green-500" },
    { value: "red", label: "Red", preview: "bg-red-500" },
    { value: "orange", label: "Orange", preview: "bg-orange-500" },
    { value: "teal", label: "Teal", preview: "bg-teal-500" },
    { value: "pink", label: "Pink", preview: "bg-pink-500" },
    { value: "indigo", label: "Indigo", preview: "bg-indigo-500" }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
          <CardDescription>Add a new project with custom branding for clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  placeholder="e.g., ACME Corp"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="e.g., ACME Support Portal"
                  value={newProject.display_name}
                  onChange={(e) => setNewProject({...newProject, display_name: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="color">Brand Color</Label>
              <Select
                value={newProject.primary_color}
                onValueChange={(value) => setNewProject({...newProject, primary_color: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${color.preview}`}></div>
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleCreateProject} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Projects</CardTitle>
          <CardDescription>Manage your current projects and their branding</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {projects.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No projects created yet</p>
            ) : (
              projects.map(project => (
                <div key={project.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg bg-${project.primary_color || 'blue'}-500 flex items-center justify-center`}>
                      <Building className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {project.display_name || `${project.name} Help Desk`}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Project: {project.name} • Color: {project.primary_color || 'blue'}
                      </p>
                      <p className="text-xs text-gray-400">ID: {project.id.slice(-8)}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteProject(project.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ClientsManager() {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [editingClient, setEditingClient] = useState(null);

  // New client invitation form
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteProjects, setInviteProjects] = useState([]);
  const [inviteRole, setInviteRole] = useState("client");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  const loadData = async () => {
    try {
      // Load clients
      let clientList = [];
      try {
        const clientResponse = await User.filter({ role: 'user' });
        clientList = extractArrayFromResponse(clientResponse);
      } catch (clientError) {
        console.warn("User.filter failed for clients, trying alternative approach:", clientError);
        try {
          const allUsersResponse = await User.list();
          const allUsers = extractArrayFromResponse(allUsersResponse);
          clientList = allUsers.filter(u => u.role === 'user');
        } catch (listError) {
          console.error("Failed to load users:", listError);
          clientList = [];
        }
      }

      // Load projects
      let projectList = [];
      try {
        const projectResponse = await Project.list();
        projectList = extractArrayFromResponse(projectResponse);
      } catch (projectError) {
        console.error("Error loading projects:", projectError);
        projectList = [];
      }

      // Load invitations
      let invitationList = [];
      try {
        const invitationResponse = await Invitations.list();
        invitationList = extractArrayFromResponse(invitationResponse);
      } catch (invitationError) {
        console.error("Error loading invitations:", invitationError);
        invitationList = [];
      }

      setClients(clientList);
      setProjects(projectList);
      setInvitations(invitationList);
      setProjectOptions(projectList.map(p => ({ value: p.id, label: p.name })));
    } catch (error) {
      console.error("Error in loadData:", error);
      setClients([]);
      setProjects([]);
      setInvitations([]);
      setProjectOptions([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProjectAssignment = async (clientId, projectIds) => {
    try {
      await User.update(clientId, { projects: projectIds });
      loadData();
    } catch (error) {
      console.error("Error updating client projects:", error);
    }
  };

  const handleInviteClient = async () => {
    if (!inviteEmail || !inviteName) {
      setInviteError("Name and email are required");
      return;
    }

    setIsInviting(true);
    setInviteError("");
    setInviteSuccess("");

    try {
      const invitationData = {
        email: inviteEmail,
        full_name: inviteName,
        role: inviteRole,
        projects: inviteProjects
      };

      await Invitations.create(invitationData);
      
      setInviteSuccess(`Invitation sent to ${inviteName} (${inviteEmail})`);
      setInviteEmail("");
      setInviteName("");
      setInviteProjects([]);
      setInviteRole("user");
      setShowInviteForm(false);
      
      // Refresh data to show new invitation
      loadData();
      
    } catch (error) {
      console.error("Error sending invitation:", error);
      setInviteError(error.message || "Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleResendInvitation = async (invitationId) => {
    try {
      await Invitations.resend(invitationId);
      alert("Invitation resent successfully!");
    } catch (error) {
      console.error("Error resending invitation:", error);
      alert("Failed to resend invitation: " + error.message);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) return;
    
    try {
      await Invitations.delete(invitationId);
      loadData(); // Refresh data
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      alert("Failed to cancel invitation: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {inviteSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <Mail className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            {inviteSuccess}
          </AlertDescription>
        </Alert>
      )}

      {/* Invite New Client Card */}
      <Card>
        <CardHeader>
          <CardTitle>Invite New Client</CardTitle>
          <CardDescription>Send an invitation email to add new clients to your support system</CardDescription>
        </CardHeader>
        <CardContent>
          {!showInviteForm ? (
            <Button onClick={() => setShowInviteForm(true)} className="bg-green-600 hover:bg-green-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite New Client
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Full Name *</Label>
                  <Input
                    id="clientName"
                    placeholder="Enter client's full name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="clientEmail">Email Address *</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="Enter client's email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="clientRole">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="user">Internal User</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Assign Projects</Label>
                <MultiSelect
                  options={projectOptions}
                  value={inviteProjects}
                  onChange={setInviteProjects}
                  placeholder={projectOptions.length === 0 ? "No projects available" : "Select projects for this client..."}
                />
              </div>

              {inviteError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
                    {inviteError}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleInviteClient}
                  disabled={!inviteEmail || !inviteName || isInviting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isInviting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowInviteForm(false);
                  setInviteError("");
                  setInviteEmail("");
                  setInviteName("");
                  setInviteProjects([]);
                }}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>Manage sent invitations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.filter(inv => inv.status === 'pending').map(invitation => (
                <div key={invitation.id} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{invitation.full_name}</h4>
                      <p className="text-sm text-gray-600">{invitation.email}</p>
                      <p className="text-xs text-gray-500">
                        Role: {invitation.role} | 
                        Projects: {invitation.project_names?.join(', ') || 'None'} |
                        Expires: {new Date(invitation.expires_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendInvitation(invitation.id)}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Resend
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Clients - same as before */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Existing Clients</CardTitle>
          <CardDescription>Assign projects and manage client access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No clients found</p>
                <p className="text-gray-400 text-sm">Invite clients to get started</p>
              </div>
            ) : (
              clients.map(client => (
                <div key={client.id} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{client.full_name}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingClient(editingClient === client.id ? null : client.id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">{client.email}</p>
                      <p className="text-xs text-gray-500">
                        Joined: {new Date(client.created_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        {(client.projects || []).length} project{(client.projects || []).length !== 1 ? 's' : ''} assigned
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Assigned Projects
                    </Label>
                    <MultiSelect
                      options={projectOptions}
                      value={client.projects || []}
                      onChange={(selected) => handleProjectAssignment(client.id, selected)}
                      placeholder={projectOptions.length === 0 ? "No projects available" : "Select projects for this client..."}
                    />
                  </div>

                  {editingClient === client.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">User ID:</span>
                          <p className="text-gray-600">{client.id}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Role:</span>
                          <p className="text-gray-600 capitalize">{client.role}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Admin() {
  const { user, isLoading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      navigate(createPageUrl("Dashboard"));
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => navigate(createPageUrl("Dashboard"))}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600 text-lg">Manage projects, clients, and system settings</p>
        </div>

        <Tabs defaultValue="clients" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Client Management
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Project Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-6">
            <ClientsManager />
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <ProjectsManager />
          </TabsContent>
        </Tabs>

        {/* Quick Links to Other Admin Pages */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(createPageUrl("Integrations"))}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Manage Integrations</h3>
                  <p className="text-gray-600 text-sm">Connect Gmail, GoTo, and other services</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(createPageUrl("DataStructure"))}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Data Structure</h3>
                  <p className="text-gray-600 text-sm">View system architecture and entities</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}