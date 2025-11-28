import React, { useState, useEffect } from "react";
import { useUser } from "../components/auth/UserProvider";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Gmail, GoTo } from "../api/integrations";
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
  MessageSquare,
  Loader2
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
  status = "available",
  isLoading = false
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
                  Coming Soon
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
              <Button variant="outline" size="sm" onClick={onConfigure} disabled={isLoading}>
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onDisconnect} 
                className="text-red-600 hover:text-red-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Disconnect
              </Button>
            </>
          ) : (
            <Button 
              onClick={onConnect} 
              disabled={status !== "available" || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              {status === "available" ? "Connect" : "Coming Soon"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function Integrations() {
  const { user, isLoading: userLoading } = useUser();
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
  const [loading, setLoading] = useState({
    gmail: false,
    goto: false,
    sync: false
  });

  useEffect(() => {
    if (!userLoading && (!user || user.role !== 'admin')) {
      navigate(createPageUrl("Dashboard"));
    }
  }, [user, userLoading, navigate]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadIntegrationStatus();
      handleOAuthCallback();
    }
  }, [user]);

  const loadIntegrationStatus = async () => {
    try {
      const gmailStatus = await Gmail.getStatus();
      setIntegrations(prev => ({
        ...prev,
        gmail: {
          connected: gmailStatus.connected || false,
          lastSync: gmailStatus.last_sync,
          ticketsImported: gmailStatus.tickets_imported || 0
        }
      }));

      try {
        const gotoStatus = await GoTo.getStatus();
        setIntegrations(prev => ({
          ...prev,
          goto: {
            connected: gotoStatus.connected || false,
            meetingsScheduled: gotoStatus.meetings_scheduled || 0,
            lastMeeting: gotoStatus.last_meeting
          }
        }));
      } catch (e) {
        // GoTo not implemented yet
      }
    } catch (error) {
      console.error('Error loading integration status:', error);
    }
  };

  const handleOAuthCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      handleGmailCallback(code, state);
    }
  };

  const handleGmailConnect = async () => {
    setLoading(prev => ({ ...prev, gmail: true }));
    try {
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      const result = await Gmail.connect(redirectUri);
      
      if (result.success && result.auth_url) {
        window.location.href = result.auth_url;
      }
    } catch (error) {
      alert(`Failed to connect Gmail: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, gmail: false }));
    }
  };

  const handleGmailCallback = async (code, state) => {
    setLoading(prev => ({ ...prev, gmail: true }));
    try {
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      const result = await Gmail.handleCallback(code, state, redirectUri);
      
      if (result.success) {
        window.history.replaceState({}, document.title, window.location.pathname);
        await loadIntegrationStatus();
        alert('Gmail connected successfully!');
      }
    } catch (error) {
      alert(`Failed to complete Gmail connection: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, gmail: false }));
    }
  };

  const handleGmailDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Gmail? This will stop automatic ticket creation from emails.')) {
      return;
    }
    
    setLoading(prev => ({ ...prev, gmail: true }));
    try {
      await Gmail.disconnect();
      setIntegrations(prev => ({
        ...prev,
        gmail: { connected: false, lastSync: null, ticketsImported: 0 }
      }));
      alert('Gmail disconnected successfully');
    } catch (error) {
      alert(`Failed to disconnect Gmail: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, gmail: false }));
    }
  };

  const handleGmailConfigure = () => {
    alert("Gmail configuration allows you to set up filters, folders to monitor, and automatic ticket creation rules. Feature coming soon!");
  };

  const handleGoToConnect = () => {
    alert("GoTo integration is coming soon! This will allow you to schedule meetings directly from tickets.");
  };

  const handleGoToDisconnect = () => {
    alert("GoTo integration is coming soon!");
  };

  const handleGoToConfigure = () => {
    alert("GoTo configuration would allow you to set up automatic meeting scheduling for high-priority tickets and client onboarding.");
  };

  const handleSyncGmail = async () => {
    setLoading(prev => ({ ...prev, sync: true }));
    try {
      const result = await Gmail.sync();
      
      if (result.success) {
        alert(`Sync completed! Created ${result.tickets_created} new tickets from ${result.messages_processed} emails.`);
        await loadIntegrationStatus();
      }
    } catch (error) {
      alert(`Failed to sync Gmail: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, sync: false }));
    }
  };

  if (userLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
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
            <strong>Gmail Integration Active!</strong> Connect your Gmail account to automatically convert support emails into tickets.
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
                status="available"
                isLoading={loading.gmail}
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
                status="coming_soon"
                isLoading={loading.goto}
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
                            {integrations.gmail.lastSync 
                              ? new Date(integrations.gmail.lastSync).toLocaleString()
                              : "Never"}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900">Status</h4>
                          <p className="text-sm text-green-600 font-medium">Connected</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={handleSyncGmail}
                        disabled={loading.sync}
                      >
                        {loading.sync ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Manual Sync
                          </>
                        )}
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