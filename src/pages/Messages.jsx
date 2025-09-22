import React from "react";
import { MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Messages() {
  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Messages
          </h1>
          <p className="text-gray-600 text-lg">
            All ticket conversations in one place
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <MessageSquare className="w-20 h-20 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Messages are in Individual Tickets
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Each ticket has its own chat thread where you can communicate with your team and clients.
            Navigate to any ticket to view and send messages.
          </p>
          <Link to={createPageUrl("Tickets")}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              View All Tickets
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}