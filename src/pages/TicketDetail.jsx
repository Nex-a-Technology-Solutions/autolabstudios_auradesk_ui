
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Ticket, TicketMessage, User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useUser } from "../components/auth/UserProvider";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Send,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Lock,
  MessageCircle
} from "lucide-react";
import MessageBubble from "../components/ticket/MessageBubble";
import TicketHeader from "../components/ticket/TicketHeader";

export default function TicketDetail() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const { user, isLoading: isUserLoading } = useUser();

  const ticketId = new URLSearchParams(window.location.search).get('id');

  const loadTicketData = useCallback(async () => {
    if (!ticketId || !user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const ticketData = await Ticket.filter({ id: ticketId });
      
      if (ticketData.length > 0) {
        // Security check
        if (user.role !== 'admin' && ticketData[0].client_email !== user.email) {
          navigate(createPageUrl("Tickets"));
          return;
        }

        const messagesData = await TicketMessage.filter({ ticket_id: ticketId }, "created_date");
        setTicket(ticketData[0]);
        setMessages(messagesData);
      } else {
        navigate(createPageUrl("Dashboard"));
      }
    } catch (error) {
      console.error("Error loading ticket data:", error);
      setError("Failed to load ticket data. Please try again.");
    }
    setIsLoading(false);
  }, [ticketId, navigate, user]);

  useEffect(() => {
    if (!isUserLoading && user) {
      loadTicketData();
    }
  }, [loadTicketData, isUserLoading, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);

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
      console.error("Error uploading files:", error);
      setError("Failed to upload files. Please try again.");
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() && attachments.length === 0) return;

    setIsSending(true);
    setError(null);

    try {
      const messageData = {
        ticket_id: ticketId,
        message: newMessage,
        attachments: attachments.map(att => att.url),
        sender_name: user?.full_name || user?.email || "Anonymous"
      };

      await TicketMessage.create(messageData);
      setNewMessage("");
      setAttachments([]);
      
      setTimeout(() => {
        loadTicketData();
      }, 1000);
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    }

    setIsSending(false);
  };

  const updateTicketStatus = async (newStatus) => {
    try {
      // Include ALL required fields for the update
      const updateData = {
        title: ticket.title,
        description: ticket.description,
        project_id: ticket.project_id,
        client_email: ticket.client_email,
        status: newStatus,
        priority: ticket.priority,
        category: ticket.category,
        assigned_staff: ticket.assigned_staff,
        attachments: ticket.attachments || []
      };

      await Ticket.update(ticketId, updateData);

      await TicketMessage.create({
        ticket_id: ticketId,
        message: `Ticket status changed to: ${newStatus.replace('_', ' ')}`,
        message_type: "status_change",
        sender_name: user?.full_name || "System"
      });

      setTimeout(() => {
        loadTicketData();
      }, 1000);
    } catch (error) {
      console.error("Error updating ticket status:", error);
      setError("Failed to update ticket status. Please try again.");
    }
  };

  const updateTicketAssignment = async (staffEmail) => {
    try {
      // Include ALL required fields for the update
      const updateData = {
        title: ticket.title,
        description: ticket.description,
        project_id: ticket.project_id,
        client_email: ticket.client_email,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        assigned_staff: staffEmail,
        attachments: ticket.attachments || []
      };

      await Ticket.update(ticketId, updateData);

      const message = staffEmail 
        ? `Ticket assigned to ${staffEmail.split('@')[0]}` 
        : 'Ticket unassigned';
      
      await TicketMessage.create({
        ticket_id: ticketId,
        message: message,
        message_type: "assignment",
        sender_name: user?.full_name || "System"
      });

      setTimeout(() => {
        loadTicketData();
      }, 1000);
    } catch (error) {
      console.error("Error updating ticket assignment:", error);
      setError("Failed to update ticket assignment. Please try again.");
    }
  };

  const addNotification = async (notificationText) => {
    try {
      await TicketMessage.create({
        ticket_id: ticketId,
        message: notificationText,
        message_type: "status_change",
        sender_name: user?.full_name || "Admin"
      });

      setTimeout(() => {
        loadTicketData();
      }, 1000);
    } catch (error) {
      console.error("Error adding notification:", error);
      setError("Failed to add notification. Please try again.");
    }
  };

  // Check if client can send messages (only if ticket is not closed)
  const canClientSendMessage = user?.role !== 'admin' && ticket?.status !== 'closed';
  const isTicketClosed = ticket?.status === 'closed';

  if (isLoading || isUserLoading) {
    return (
      <div className="p-4 md:p-8 min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-md">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border border-red-200 rounded-xl p-8 text-center shadow-md">
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Refresh Page
            </Button>
            <Button
              onClick={() => navigate(createPageUrl("Dashboard"))}
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-4 md:p-8 min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-md">
          <p className="text-gray-600 mb-4">Ticket not found</p>
          <Button
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Tickets"))}
            className="border-slate-300 text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              {ticket?.title}
            </h1>
            <p className="text-slate-600 font-medium">Ticket #{ticket?.id.slice(-6)}</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {ticket && (
          <TicketHeader 
            ticket={ticket}
            messages={messages}
            onStatusUpdate={updateTicketStatus}
            onAssignmentUpdate={updateTicketAssignment}
            onAddNotification={addNotification}
            userRole={user?.role} 
          />
        )}

        <div className="bg-white border border-gray-200 rounded-xl flex-1 flex flex-col mb-6 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-semibold text-gray-900">Conversation</h3>
              {isTicketClosed && user?.role !== 'admin' && (
                <Badge className="bg-gray-100 text-gray-700 border-gray-300">
                  <Lock className="w-3 h-3 mr-1" />
                  Closed
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            <div className="space-y-6">
              {messages.map((message) => (
                <MessageBubble 
                  key={message.id} 
                  message={message}
                  isCurrentUser={message.created_by === user?.email}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {(user?.role === 'admin' || canClientSendMessage) ? (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <form onSubmit={handleSendMessage} className="space-y-3">
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="bg-white rounded-lg p-2 flex items-center justify-between border border-gray-200">
                        <div className="flex items-center gap-3">
                          {file.type.startsWith('image/') ? (
                            <ImageIcon className="w-4 h-4 text-blue-600" />
                          ) : (
                            <FileText className="w-4 h-4 text-gray-600" />
                          )}
                          <span className="text-gray-900 text-sm">{file.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAttachment(index)}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 w-6 h-6"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-gray-300 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={user?.role === 'admin' ? "Type your response..." : "Type your message..."}
                    className="flex-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500"
                    disabled={isSending}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isSending || (!newMessage.trim() && attachments.length === 0)}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
                  >
                    {isSending ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-6 border-t border-gray-200 bg-gray-50 text-center">
              <div className="flex items-center justify-center gap-3 text-gray-500 mb-2">
                <Lock className="w-5 h-5" />
                <span className="font-medium">This ticket has been closed</span>
              </div>
              <p className="text-sm text-gray-400">
                You can view the conversation history, but can no longer add new messages.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
