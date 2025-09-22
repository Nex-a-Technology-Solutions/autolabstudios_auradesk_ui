import React, { useState, useEffect, useCallback } from "react";
import { Ticket, Project, User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useUser } from "../components/auth/UserProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, FileText, Image as ImageIcon, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CreateTicket() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "general_inquiry",
    project_id: "",
    client_email: ""
  });
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const loadInitialData = useCallback(async () => {
    if (!user) return; // Guard to ensure user is available
    try {
      if (user.role === 'admin') {
        const allProjects = await Project.list();
        console.log("All projects:", allProjects); // Debug log
        
        // Handle paginated response format for projects too
        const projectsArray = Array.isArray(allProjects) 
          ? allProjects 
          : (allProjects?.results || []);
          
        setProjects(projectsArray);
        
        // Try different approaches to get users
        let allClients = [];
        try {
          // Method 1: Try the original filter approach
          allClients = await User.filter({ role: 'user' });
        } catch (filterError) {
          console.warn("User.filter failed, trying alternative approaches:", filterError);
          
          try {
            // Method 2: Try getting all users and filtering client-side
            const allUsers = await User.list();
            console.log("All users:", allUsers); // Debug log
            
            // Handle paginated response format
            const usersArray = Array.isArray(allUsers) 
              ? allUsers 
              : (allUsers?.results || []);
              
            allClients = usersArray.filter(u => u.role === 'user');
          } catch (listError) {
            console.warn("User.list failed:", listError);
            
            try {
              // Method 3: Try a different filter syntax
              allClients = await User.query({ role: 'user' });
            } catch (queryError) {
              console.warn("User.query failed:", queryError);
              // Method 4: Last resort - empty array with error message
              allClients = [];
              throw new Error("Unable to load clients using any available method");
            }
          }
        }
        
        console.log("Loaded clients:", allClients); // Debug log
        setClients(Array.isArray(allClients) ? allClients : []);
        
        if (projectsArray.length > 0) {
          setFormData(prev => ({ ...prev, project_id: projectsArray[0].id }));
        }
        if (allClients.length > 0) {
          setFormData(prev => ({ ...prev, client_email: allClients[0].email }));
        }
      } else {
        if (user.projects && user.projects.length > 0) {
          // Fetch projects by ID, Project.filter({ id }) usually returns an array
          const userProjectPromises = user.projects.map(async (id) => {
            const projectResponse = await Project.filter({ id });
            // Handle both array and paginated response formats
            return Array.isArray(projectResponse) 
              ? projectResponse 
              : (projectResponse?.results || []);
          });
          
          const userProjects = (await Promise.all(userProjectPromises)).flat();
          console.log("User projects:", userProjects); // Debug log
          setProjects(userProjects);
          
          if (userProjects.length > 0) {
            setFormData(prev => ({ ...prev, project_id: userProjects[0].id }));
          }
        }
      }
    } catch (err) {
      console.error("Failed to load initial data:", err);
      setError(`Failed to load initial data: ${err.message}`);
    }
  }, [user]); // Depend on 'user'

  useEffect(() => {
    loadInitialData();
    if (user && user.role !== 'admin') { // user check is important here if loadInitialData doesn't handle initial null user
      setFormData(prev => ({ ...prev, client_email: user.email }));
    }
  }, [loadInitialData, user]); // Depend on 'loadInitialData' and 'user'

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    setUploading(true);
    
    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await UploadFile({ file });
        return {
          name: file.name,
          url: file_url,
          type: file.type,
          size: file.size
        };
      });
      
      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments(prev => [...prev, ...uploadedFiles]);
    } catch (error) {
      setError("Failed to upload files. Please try again.");
    }
    
    setUploading(false);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.project_id || !formData.client_email) {
      setError("Please fill in all required fields, including project and client.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const ticketData = {
        ...formData,
        attachments: attachments.map(att => att.url)
      };
      
      const newTicket = await Ticket.create(ticketData);
      navigate(createPageUrl(`TicketDetail?id=${newTicket.id}`));
    } catch (error) {
      setError("Failed to create ticket. Please try again.");
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 via-indigo-800 to-blue-800 bg-clip-text text-transparent leading-tight">
            Create New Ticket
          </h1>
          <p className="text-slate-600 text-lg font-medium mt-2">
            Report an issue, request a feature, or share feedback.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Ticket Details</h2>
            
            {error && (
              <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-800">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-gray-700 text-sm font-medium">
                  Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="e.g., Unable to login with new password"
                  className="mt-2 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-700 text-sm font-medium">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Provide as much detail as possible, including steps to reproduce the issue."
                  rows={6}
                  className="mt-2 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="project" className="text-gray-700 text-sm font-medium">Project *</Label>
                <Select value={formData.project_id} onValueChange={(value) => handleInputChange("project_id", value)}>
                  <SelectTrigger className="mt-2 bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {user?.role === 'admin' && (
                <div>
                  <Label htmlFor="client" className="text-gray-700 text-sm font-medium">Client *</Label>
                  <Select value={formData.client_email} onValueChange={(value) => handleInputChange("client_email", value)}>
                    <SelectTrigger className="mt-2 bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {clients.map(c => <SelectItem key={c.id} value={c.email}>{c.full_name || c.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-700 text-sm font-medium">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleInputChange("priority", value)}
                  >
                    <SelectTrigger className="mt-2 bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-700 text-sm font-medium">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange("category", value)}
                  >
                    <SelectTrigger className="mt-2 bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="bug_report">Bug Report</SelectItem>
                      <SelectItem value="feature_request">Feature Request</SelectItem>
                      <SelectItem value="general_inquiry">General Inquiry</SelectItem>
                      <SelectItem value="technical_support">Technical Support</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Feature Request Disclaimer */}
              {formData.category === 'feature_request' && (
                <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm font-bold">!</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-900 mb-2">Feature Request Development Notice</h4>
                      <p className="text-sm leading-relaxed">
                        Thank you for your feature request! Please note that implementing new features or customizations 
                        may require additional development work, which could involve fees depending on the complexity and scope. 
                        Our team will review your request and reach out to discuss the requirements, timeline, and any 
                        associated costs before proceeding with development.
                      </p>
                      <p className="text-sm mt-2 font-medium">
                        We'll keep you informed throughout the process and won't begin any paid work without your approval.
                      </p>
                    </div>
                  </div>
                </Alert>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors bg-gray-50 hover:bg-blue-50">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 font-medium mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-gray-500 text-sm">
                  Max file size: 10MB
                </p>
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="mt-6 space-y-2">
                <p className="text-gray-700 font-medium">Attached Files:</p>
                {attachments.map((file, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between border border-gray-200">
                    <div className="flex items-center gap-3">
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-gray-600" />
                      )}
                      <div>
                        <p className="text-gray-900 text-sm font-medium">{file.name}</p>
                        <p className="text-gray-500 text-xs">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttachment(index)}
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {formData.category === 'feature_request' ? 'Submit Feature Request' : 'Create Ticket'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}