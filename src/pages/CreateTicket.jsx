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
import { Upload, X, FileText, Image as ImageIcon, Send, Mail, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  // Email import modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailContent, setEmailContent] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const loadInitialData = useCallback(async () => {
    if (!user) return;
    try {
      if (user.role === 'admin') {
        const allProjects = await Project.list();
        
        const projectsArray = Array.isArray(allProjects) 
          ? allProjects 
          : (allProjects?.results || []);
          
        setProjects(projectsArray);
        
        let allClients = [];
        try {
          allClients = await User.filter({ role: 'user' });
        } catch (filterError) {
          try {
            const allUsers = await User.list();
            const usersArray = Array.isArray(allUsers) 
              ? allUsers 
              : (allUsers?.results || []);
            allClients = usersArray.filter(u => u.role === 'user');
          } catch (listError) {
            allClients = [];
          }
        }
        
        setClients(Array.isArray(allClients) ? allClients : []);
        
        if (projectsArray.length > 0) {
          setFormData(prev => ({ ...prev, project_id: projectsArray[0].id }));
        }
        if (allClients.length > 0) {
          setFormData(prev => ({ ...prev, client_email: allClients[0].email }));
        }
      } else {
        if (user.projects && user.projects.length > 0) {
          const userProjectPromises = user.projects.map(async (id) => {
            const projectResponse = await Project.filter({ id });
            return Array.isArray(projectResponse) 
              ? projectResponse 
              : (projectResponse?.results || []);
          });
          
          const userProjects = (await Promise.all(userProjectPromises)).flat();
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
  }, [user]);

  useEffect(() => {
    loadInitialData();
    if (user && user.role !== 'admin') {
      setFormData(prev => ({ ...prev, client_email: user.email }));
    }
  }, [loadInitialData, user]);

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

  const handleParseEmail = async () => {
    if (!emailContent.trim()) {
      setError("Please paste email content");
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      // Use AI to parse the email
      const response = await fetch('http://127.0.0.1:8000/api/integrations/Core/InvokeLLM/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          prompt: `You are a support ticket assistant. Parse the following email and extract ticket information.

Email Content:
${emailContent}

Extract and return ONLY a JSON object with these fields:
- title: A clear, concise ticket title (max 100 chars)
- description: The full email content, cleaned up
- priority: One of: low, medium, high, urgent (analyze urgency from content)
- category: One of: bug_report, feature_request, general_inquiry, technical_support, feedback

Return ONLY valid JSON, no other text.`,
          model: 'gpt-4',
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      
      // Parse AI response
      let parsedData;
      try {
        parsedData = JSON.parse(data.response.trim());
      } catch (e) {
        // Fallback
        parsedData = {
          title: emailContent.substring(0, 100),
          description: emailContent,
          priority: 'medium',
          category: 'general_inquiry'
        };
      }

      // Update form with parsed data
      setFormData(prev => ({
        ...prev,
        title: parsedData.title || prev.title,
        description: parsedData.description || prev.description,
        priority: parsedData.priority || prev.priority,
        category: parsedData.category || prev.category
      }));

      setShowEmailModal(false);
      setEmailContent("");
    } catch (error) {
      console.error("Error parsing email:", error);
      setError("Failed to parse email. Please try again or fill the form manually.");
    }

    setIsParsing(false);
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
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 via-indigo-800 to-blue-800 bg-clip-text text-transparent leading-tight">
              Create New Ticket
            </h1>
            <p className="text-slate-600 text-lg font-medium mt-2">
              Report an issue, request a feature, or share feedback.
            </p>
          </div>
          <Button
            onClick={() => setShowEmailModal(true)}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Mail className="w-4 h-4 mr-2" />
            Paste Email
          </Button>
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

        {/* Email Import Modal */}
        <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Import from Email
              </DialogTitle>
              <DialogDescription>
                Paste your email content below. AI will extract the ticket details automatically.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Our AI will analyze the email and automatically fill in the title, description, priority, and category fields.
                </p>
              </div>
              
              <Textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder="Paste the full email content here, including subject and body..."
                rows={12}
                className="bg-white border-gray-300 font-mono text-sm"
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailContent("");
                }}
                disabled={isParsing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleParseEmail}
                disabled={isParsing || !emailContent.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isParsing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Parse with AI
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}