
import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ExternalLink, User, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors = {
  open: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white",
  in_progress: "bg-gradient-to-r from-amber-500 to-orange-500 text-white", 
  resolved: "bg-gradient-to-r from-emerald-500 to-green-500 text-white",
  closed: "bg-gradient-to-r from-slate-500 to-gray-500 text-white"
};

const priorityColors = {
  low: "bg-gradient-to-r from-sky-400 to-blue-400 text-white",
  medium: "bg-gradient-to-r from-amber-400 to-orange-400 text-white",
  high: "bg-gradient-to-r from-orange-500 to-red-500 text-white", 
  urgent: "bg-gradient-to-r from-red-500 to-pink-500 text-white"
};

export default function RecentTickets({ tickets, isLoading }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/20">
      <div className="p-8 border-b border-slate-200/60 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 rounded-t-3xl">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Recent Tickets</h3>
          <Link 
            to={createPageUrl("Tickets")} 
            className="text-indigo-600 hover:text-indigo-700 transition-colors text-sm flex items-center gap-2 font-semibold group"
          >
            View All 
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-gradient-to-r from-slate-50 to-indigo-50 rounded-2xl p-6 border border-slate-200/60">
              <Skeleton className="h-5 w-3/4 mb-3 bg-slate-200" />
              <Skeleton className="h-4 w-1/2 mb-4 bg-slate-200" />
              <div className="flex gap-3">
                <Skeleton className="h-7 w-24 rounded-full bg-slate-200" />
                <Skeleton className="h-7 w-20 rounded-full bg-slate-200" />
              </div>
            </div>
          ))
        ) : (
          tickets.map((ticket) => (
            <Link
              key={ticket.id}
              to={createPageUrl(`TicketDetail?id=${ticket.id}`)}
              className="block bg-gradient-to-r from-slate-50/80 to-indigo-50/80 rounded-2xl p-6 hover:from-indigo-50 hover:to-blue-50 transition-all duration-300 group border border-slate-200/60 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-200/20"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-slate-800 group-hover:text-indigo-700 text-lg tracking-tight">
                  {ticket.title}
                </h4>
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  {format(new Date(ticket.created_date), "MMM d")}
                </div>
              </div>
              
              <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                {ticket.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex gap-3 flex-wrap">
                  <Badge className={`${statusColors[ticket.status]} border-0 text-xs font-semibold px-3 py-1 rounded-full`}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={`${priorityColors[ticket.priority]} border-0 text-xs font-semibold px-3 py-1 rounded-full`}>
                    {ticket.priority}
                  </Badge>
                </div>
                
                {ticket.assigned_staff && (
                  <div className="flex items-center gap-2 bg-white/60 px-3 py-1 rounded-full border border-indigo-200/40">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {ticket.assigned_staff.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-slate-700 text-sm font-medium">
                      {ticket.assigned_staff.split('@')[0]}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
