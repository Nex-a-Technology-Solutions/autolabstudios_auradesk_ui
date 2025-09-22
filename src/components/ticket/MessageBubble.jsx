
import React from "react";
import { format } from "date-fns";
import { FileText, Image as ImageIcon, Download, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MessageBubble({ message, isCurrentUser }) {
  const isSystemMessage = message.message_type === "status_change";
  
  if (isSystemMessage) {
    return (
      <div className="flex items-center gap-4 text-sm text-gray-500 my-2">
        <hr className="flex-1 border-gray-200" />
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
          <Settings className="w-4 h-4" />
          <span>{message.message}</span>
          <span>·</span>
          <span>{format(new Date(message.created_date), "h:mm a")}</span>
        </div>
        <hr className="flex-1 border-gray-200" />
      </div>
    );
  }
  
  return (
    <div className={`flex items-start gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {!isCurrentUser && (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-bold flex-shrink-0 mt-1">
          {message.sender_name?.charAt(0).toUpperCase() || 'U'}
        </div>
      )}
      <div className={`max-w-md ${isCurrentUser ? 'text-right' : ''}`}>
        <div className="text-xs text-gray-500 mb-1">
          <span className="font-medium">{isCurrentUser ? 'You' : message.sender_name}</span>
          <span className="ml-2">{format(new Date(message.created_date), "MMM d, h:mm a")}</span>
        </div>
        <div
          className={`rounded-xl p-3 ${
            isCurrentUser 
              ? 'bg-blue-600 text-white rounded-br-none' 
              : 'bg-gray-100 text-gray-900 rounded-bl-none border border-gray-200'
          }`}
        >
          
          {message.message && (
            <p className="whitespace-pre-wrap">{message.message}</p>
          )}
          
          {message.attachments && message.attachments.length > 0 && (
            <div className={`space-y-2 ${message.message ? 'mt-3' : ''}`}>
              {message.attachments.map((attachment, index) => (
                <div key={index} className={`rounded-lg p-2 flex items-center justify-between border ${isCurrentUser ? 'bg-blue-700/50 border-blue-500' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    {attachment.includes('.jpg') || attachment.includes('.png') || attachment.includes('.gif') ? (
                      <ImageIcon className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    <span className="text-sm">
                      Attachment
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`w-6 h-6 ${isCurrentUser ? 'text-white hover:bg-white/20' : 'text-gray-600 hover:bg-gray-100'}`}
                    onClick={() => window.open(attachment, '_blank')}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
