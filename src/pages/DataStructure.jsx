import React from "react";
import { useUser } from "../components/auth/UserProvider";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Users,
  Ticket,
  MessageSquare,
  Building,
  Settings,
  Shield,
  Bell,
  Mail,
  FileText,
  Link as LinkIcon,
  Key,
  Globe,
  UserCheck
} from "lucide-react";

const EntityCard = ({ icon: Icon, title, description, fields, relationships }) => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Icon className="w-5 h-5" />
        {title}
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <h4 className="font-medium text-sm mb-2">Fields:</h4>
        <div className="space-y-1">
          {fields.map((field, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                {field.name}
              </span>
              <div className="flex gap-1">
                <Badge variant={field.required ? "default" : "secondary"} className="text-xs">
                  {field.type}
                </Badge>
                {field.required && <Badge variant="destructive" className="text-xs">required</Badge>}
              </div>
            </div>
          ))}
        </div>
      </div>
      {relationships && relationships.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-2">Relationships:</h4>
          <div className="space-y-1">
            {relationships.map((rel, index) => (
              <div key={index} className="text-sm flex items-center gap-2">
                <LinkIcon className="w-3 h-3" />
                <span>{rel}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

const FeatureCard = ({ icon: Icon, title, description, features }) => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Icon className="w-5 h-5" />
        {title}
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="text-sm flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
            {feature}
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

export default function DataStructure() {
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
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => navigate(createPageUrl("Dashboard"))}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const entities = [
    {
      icon: Ticket,
      title: "Ticket",
      description: "Core support ticket entity with comprehensive tracking",
      fields: [
        { name: "id", type: "string", required: false, note: "Auto-generated" },
        { name: "title", type: "string", required: true },
        { name: "description", type: "string", required: true },
        { name: "status", type: "enum", required: false, options: ["open", "in_progress", "resolved", "closed"] },
        { name: "priority", type: "enum", required: false, options: ["low", "medium", "high", "urgent"] },
        { name: "category", type: "enum", required: false, options: ["bug_report", "feature_request", "general_inquiry", "technical_support", "feedback"] },
        { name: "assigned_staff", type: "string", required: false, note: "Email of assigned staff member" },
        { name: "project_id", type: "string", required: true, note: "References Project entity" },
        { name: "client_email", type: "string", required: true, note: "References User entity" },
        { name: "attachments", type: "array", required: false, note: "URLs of uploaded files" },
        { name: "created_date", type: "datetime", required: false, note: "Auto-generated" },
        { name: "updated_date", type: "datetime", required: false, note: "Auto-updated" },
        { name: "created_by", type: "string", required: false, note: "Auto-populated with user email" }
      ],
      relationships: [
        "belongs_to: Project (via project_id)",
        "belongs_to: User (via client_email)",
        "assigned_to: User (via assigned_staff)",
        "has_many: TicketMessage"
      ]
    },
    {
      icon: MessageSquare,
      title: "TicketMessage",
      description: "Messages and system logs within ticket conversations",
      fields: [
        { name: "id", type: "string", required: false, note: "Auto-generated" },
        { name: "ticket_id", type: "string", required: true, note: "References Ticket entity" },
        { name: "message", type: "string", required: true },
        { name: "attachments", type: "array", required: false, note: "URLs of uploaded files" },
        { name: "message_type", type: "enum", required: false, options: ["message", "status_change", "assignment"] },
        { name: "sender_name", type: "string", required: false },
        { name: "created_date", type: "datetime", required: false, note: "Auto-generated" },
        { name: "created_by", type: "string", required: false, note: "Auto-populated with user email" }
      ],
      relationships: [
        "belongs_to: Ticket (via ticket_id)",
        "belongs_to: User (via created_by)"
      ]
    },
    {
      icon: Building,
      title: "Project",
      description: "Project containers for organizing tickets and client access with branding",
      fields: [
        { name: "id", type: "string", required: false, note: "Auto-generated" },
        { name: "name", type: "string", required: true },
        { name: "display_name", type: "string", required: false, note: "Branded name for clients" },
        { name: "primary_color", type: "enum", required: false, options: ["blue", "purple", "green", "red", "orange", "teal", "pink", "indigo"] },
        { name: "logo_url", type: "string", required: false, note: "URL to project logo" },
        { name: "created_date", type: "datetime", required: false, note: "Auto-generated" },
        { name: "created_by", type: "string", required: false, note: "Auto-populated with user email" }
      ],
      relationships: [
        "has_many: Ticket",
        "many_to_many: User (via user.projects array)"
      ]
    },
    {
      icon: Users,
      title: "User",
      description: "Extended user entity with role-based permissions and project access",
      fields: [
        { name: "id", type: "string", required: false, note: "Auto-generated" },
        { name: "full_name", type: "string", required: false, note: "Built-in field" },
        { name: "email", type: "string", required: false, note: "Built-in field" },
        { name: "role", type: "enum", required: false, note: "Built-in field", options: ["admin", "user"] },
        { name: "projects", type: "array", required: false, note: "Array of project IDs user has access to" },
        { name: "created_date", type: "datetime", required: false, note: "Built-in field" }
      ],
      relationships: [
        "has_many: Ticket (via client_email)",
        "assigned_to_many: Ticket (via assigned_staff)",
        "many_to_many: Project (via projects array)"
      ]
    }
  ];

  const adminFeatures = [
    {
      icon: Shield,
      title: "User Management",
      description: "Complete user administration and role management",
      features: [
        "View all registered users",
        "Assign projects to clients",
        "Update user project access",
        "Role-based access control",
        "Client invitation workflow",
        "User activity tracking"
      ]
    },
    {
      icon: Building,
      title: "Project Management",
      description: "Create and manage project containers with branding",
      features: [
        "Create new projects with custom branding",
        "Set display names and color themes",
        "Upload project logos",
        "Delete existing projects",
        "View project statistics",
        "White-label client experiences"
      ]
    },
    {
      icon: Ticket,
      title: "Ticket Administration",
      description: "Advanced ticket management and assignment",
      features: [
        "View all tickets across projects",
        "Assign tickets to staff members",
        "Update ticket status and priority",
        "Filter by assignment, status, priority",
        "Bulk ticket operations",
        "Ticket lifecycle management"
      ]
    },
    {
      icon: Bell,
      title: "Real-time Notifications",
      description: "Intelligent notification system for new tickets",
      features: [
        "Real-time new ticket alerts",
        "Rate-limited API polling",
        "Exponential backoff for errors",
        "Unread notification counter",
        "Notification history",
        "Click-to-navigate to tickets"
      ]
    }
  ];

  const systemFeatures = [
    {
      icon: Mail,
      title: "Email Import System",
      description: "Convert Gmail emails into support tickets",
      features: [
        "Parse email headers (From, Subject, Date)",
        "Extract email body content",
        "Automatic client email detection",
        "Project assignment during import",
        "Preserve email formatting",
        "Attachment handling"
      ]
    },
    {
      icon: FileText,
      title: "File Management",
      description: "Secure file upload and attachment system",
      features: [
        "Multi-file upload support",
        "File type validation",
        "Secure URL generation",
        "Attachment preview",
        "File size limits",
        "Integrated with tickets and messages"
      ]
    },
    {
      icon: UserCheck,
      title: "Authentication & Authorization",
      description: "Secure access control and user management",
      features: [
        "Google OAuth integration",
        "Role-based permissions",
        "Session management",
        "Auto-populated user context",
        "Secure API endpoints",
        "Protected routes"
      ]
    },
    {
      icon: Globe,
      title: "Modern UI/UX with Branding",
      description: "Contemporary design with client-specific theming",
      features: [
        "Dynamic branding per project",
        "8 color theme options",
        "Logo integration support",
        "Responsive mobile-first design",
        "Animated transitions and loading states",
        "White-label client experiences"
      ]
    }
  ];

  const dataFlow = [
    {
      step: "1. User Authentication",
      description: "Users log in via Google OAuth, system creates/updates User entity",
      entities: ["User"]
    },
    {
      step: "2. Project Assignment & Branding",
      description: "Admins create Projects with branding and assign them to Users via projects array",
      entities: ["Project", "User"]
    },
    {
      step: "3. Dynamic Theming",
      description: "Client interface adapts to project branding (name, colors, logo)",
      entities: ["Project", "User"]
    },
    {
      step: "4. Ticket Creation",
      description: "Users create Tickets linked to Projects with required client_email",
      entities: ["Ticket", "Project", "User"]
    },
    {
      step: "5. Staff Assignment",
      description: "Admins assign Tickets to staff members via assigned_staff field",
      entities: ["Ticket", "User"]
    },
    {
      step: "6. Conversation",
      description: "TicketMessages are created for each interaction, system messages track changes",
      entities: ["TicketMessage", "Ticket"]
    },
    {
      step: "7. Status Updates",
      description: "Ticket status changes trigger system TicketMessages and notifications",
      entities: ["Ticket", "TicketMessage"]
    }
  ];

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 via-indigo-800 to-blue-800 bg-clip-text text-transparent leading-tight">
            HelpDesk Pro - Complete Data Architecture
          </h1>
          <p className="text-slate-600 text-lg font-medium mt-2">
            Comprehensive overview of entities, relationships, and system functionality
          </p>
        </div>

        <Tabs defaultValue="entities" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="entities">Data Entities</TabsTrigger>
            <TabsTrigger value="admin">Admin Features</TabsTrigger>
            <TabsTrigger value="system">System Features</TabsTrigger>
            <TabsTrigger value="dataflow">Data Flow</TabsTrigger>
            <TabsTrigger value="api">API Structure</TabsTrigger>
          </TabsList>

          <TabsContent value="entities" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {entities.map((entity, index) => (
                <EntityCard key={index} {...entity} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {adminFeatures.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {systemFeatures.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="dataflow" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Application Data Flow
                </CardTitle>
                <CardDescription>
                  Step-by-step breakdown of how data flows through the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {dataFlow.map((flow, index) => (
                    <div key={index} className="flex gap-4 p-4 bg-gradient-to-r from-slate-50 to-indigo-50 rounded-lg border">
                      <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1">{flow.step}</h4>
                        <p className="text-slate-600 text-sm mb-2">{flow.description}</p>
                        <div className="flex gap-1 flex-wrap">
                          {flow.entities.map((entity, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {entity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Entity API Endpoints
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="font-mono text-sm space-y-2">
                    <div className="p-2 bg-gray-100 rounded">
                      <strong>Ticket Operations:</strong><br/>
                      GET /api/entities/Ticket<br/>
                      POST /api/entities/Ticket<br/>
                      PUT /api/entities/Ticket/:id<br/>
                      DELETE /api/entities/Ticket/:id
                    </div>
                    <div className="p-2 bg-gray-100 rounded">
                      <strong>TicketMessage Operations:</strong><br/>
                      GET /api/entities/TicketMessage<br/>
                      POST /api/entities/TicketMessage
                    </div>
                    <div className="p-2 bg-gray-100 rounded">
                      <strong>Project Operations:</strong><br/>
                      GET /api/entities/Project<br/>
                      POST /api/entities/Project<br/>
                      PUT /api/entities/Project/:id<br/>
                      DELETE /api/entities/Project/:id
                    </div>
                    <div className="p-2 bg-gray-100 rounded">
                      <strong>User Operations:</strong><br/>
                      GET /api/entities/User<br/>
                      PUT /api/entities/User/:id<br/>
                      GET /api/entities/User/me
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Integration Endpoints
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="font-mono text-sm space-y-2">
                    <div className="p-2 bg-gray-100 rounded">
                      <strong>File Upload:</strong><br/>
                      POST /integrations/Core/UploadFile
                    </div>
                    <div className="p-2 bg-gray-100 rounded">
                      <strong>Email Processing:</strong><br/>
                      POST /integrations/Core/SendEmail
                    </div>
                    <div className="p-2 bg-gray-100 rounded">
                      <strong>Data Extraction:</strong><br/>
                      POST /integrations/Core/ExtractDataFromUploadedFile
                    </div>
                    <div className="p-2 bg-gray-100 rounded">
                      <strong>AI Processing:</strong><br/>
                      POST /integrations/Core/InvokeLLM<br/>
                      POST /integrations/Core/GenerateImage
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}