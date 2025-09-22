import React, { useState, useEffect } from "react";
import { useUser } from "../components/auth/UserProvider";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Video, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Settings, 
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Zap,
  Calendar,
  Users,
  MessageSquare
} from "lucide-react";

const IntegrationCard = ({ 
  title, 
  description, 
  icon: Icon, 
  isConnected, 
  onConnect, 
  onDisconnect, 
  onConfigure,
  features,
  status = "available"
}) => {
  return (
    <Card className="relative">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Icon className={`w-6 h-6 ${isConnected ? 'text-green-600' : 'text-gray-600'}`} />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={isConnected ? "default" : "secondary"}
              className={`${
                isConnected 
                  ? "bg-green-100 text-green-800 border-green-200" 
                  : status === "available" 
                    ? "bg-gray-100 text-gray-800 border-gray-200"
                    : "bg-yellow-100 text-yellow-800 border-yellow-200"
              }`}
            >
              {isConnected ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </>
              ) : status === "available" ? (
                <>
                  <XCircle className="w-3 h-3 mr-1" />
                  Not Connected
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Setup Required
                </>
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-sm mb-2 text-gray-900">Features:</h4>
          <ul className="space-y-1">
            {features.map((feature, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                {feature}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="flex gap-2 pt-2">
          {isConnected ? (
            <>
              <Button variant="outline" size="sm" onClick={onConfigure}>
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
              <Button variant="outline" size="sm" onClick={onDisconnect} className="text-red-600 hover:text-red-700">
                <XCircle className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </>
          ) : (
            <Button 
              onClick={onConnect} 
              disabled={status !== "available"}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {status === "available" ? "Connect" : "Setup Required"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function Integrations() {
  const { user, isLoading } = useUser();
  const navigate = useNavigate();
  const [integrations, setIntegrations] = useState({
    gmail: {
      connected: false,
      lastSync: null,
      ticketsImported: 0
    },
    goto: {
      connected: false,
      meetingsScheduled: 0,
      lastMeeting: null
    }
  });

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
          <p className="text-gray-600">Loading integrations...</p>
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

  const handleGmailConnect = () => {
    alert("Gmail OAuth integration would redirect to Google's authorization page. This feature requires backend setup - please contact the base44 team to enable Gmail integration.");
  };

  const handleGmailDisconnect = () => {
    setIntegrations(prev => ({
      ...prev,
      gmail: { connected: false, lastSync: null, ticketsImported: 0 }
    }));
  };

  const handleGmailConfigure = () => {
    alert("Gmail configuration would allow you to set up filters, folders to monitor, and automatic ticket creation rules.");
  };

  const handleGoToConnect = () => {
    alert("GoTo integration would redirect to GoTo's authorization page. This feature requires backend setup - please contact the base44 team to enable GoTo integration.");
  };

  const handleGoToDisconnect = () => {
    setIntegrations(prev => ({
      ...prev,
      goto: { connected: false, meetingsScheduled: 0, lastMeeting: null }
    }));
  };

  const handleGoToConfigure = () => {
    alert("GoTo configuration would allow you to set up automatic meeting scheduling for high-priority tickets and client onboarding.");
  };

  const handleSyncGmail = () => {
    alert("Manual sync would check for new emails and create tickets. This typically runs automatically every 15 minutes when connected.");
  };

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 via-indigo-800 to-blue-800 bg-clip-text text-transparent leading-tight">
            Integrations
          </h1>
          <p className="text-slate-600 text-lg font-medium mt-2">
            Connect external services to enhance your help desk workflow
          </p>
        </div>

        <Alert className="mb-8 bg-blue-50 border-blue-200 text-blue-800">
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> These integrations require backend configuration. Contact the base44 team through the feedback button to enable specific integrations for your app.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="available">Available Integrations</TabsTrigger>
            <TabsTrigger value="connected">Connected Services</TabsTrigger>
            <TabsTrigger value="settings">Integration Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <IntegrationCard
                title="Gmail Integration"
                description="Automatically convert emails into support tickets"
                icon={Mail}
                isConnected={integrations.gmail.connected}
                onConnect={handleGmailConnect}
                onDisconnect={handleGmailDisconnect}
                onConfigure={handleGmailConfigure}
                status="setup_required"
                features={[
                  "Automatic ticket creation from emails",
                  "Email thread tracking in tickets",
                  "Custom email filters and rules",
                  "Attachment handling and storage",
                  "Auto-assignment based on sender",
                  "Bi-directional email sync"
                ]}
              />

              <IntegrationCard
                title="GoTo Integration"
                description="Schedule meetings and screen sharing for complex issues"
                icon={Video}
                isConnected={integrations.goto.connected}
                onConnect={handleGoToConnect}
                onDisconnect={handleGoToDisconnect}
                onConfigure={handleGoToConfigure}
                status="setup_required"
                features={[
                  "Schedule meetings directly from tickets",
                  "Automatic meeting links for urgent tickets",
                  "Screen sharing for technical support",
                  "Meeting recordings attached to tickets",
                  "Calendar integration",
                  "Client meeting reminders"
                ]}
              />
            </div>
          </TabsContent>

          <TabsContent value="connected" className="space-y-6">
            {integrations.gmail.connected || integrations.goto.connected ? (
              <div className="space-y-6">
                {integrations.gmail.connected && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-green-600" />
                        Gmail Integration
                        <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900">Tickets Imported</h4>
                          <p className="text-2xl font-bold text-blue-600">{integrations.gmail.ticketsImported}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900">Last Sync</h4>
                          <p className="text-sm text-gray-600">
                            {integrations.gmail.lastSync || "Never"}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900">Status</h4>
                          <p className="text-sm text-green-600 font-medium">Connected</p>
                        </div>
                      </div>
                      <Button variant="outline" onClick={handleSyncGmail}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Manual Sync
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {integrations.goto.connected && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <Video className="w-5 h-5 text-green-600" />
                        GoTo Integration
                        <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900">Meetings Scheduled</h4>
                          <p className="text-2xl font-bold text-purple-600">{integrations.goto.meetingsScheduled}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900">Last Meeting</h4>
                          <p className="text-sm text-gray-600">
                            {integrations.goto.lastMeeting || "None scheduled"}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900">Status</h4>
                          <p className="text-sm text-green-600 font-medium">Connected</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Connected Services</h3>
                <p className="text-gray-600">Connect to Gmail or GoTo to see active integrations here.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    General Settings
                  </CardTitle>
                  <CardDescription>Configure global integration preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Auto-sync enabled</h4>
                      <p className="text-sm text-gray-600">Automatically sync data every 15 minutes</p>
                    </div>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email notifications</h4>
                      <p className="text-sm text-gray-600">Notify admins of integration issues</p>
                    </div>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>Manage integration security and permissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">OAuth tokens</h4>
                      <p className="text-sm text-gray-600">Secure connection tokens</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Valid</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Data encryption</h4>
                      <p className="text-sm text-gray-600">All integration data is encrypted</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
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