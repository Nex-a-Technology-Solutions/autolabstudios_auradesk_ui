import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Building, ExternalLink, AlertCircle, CheckCircle, Clock, ArrowRight } from "lucide-react";

const statusColors = {
  open: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white",
  in_progress: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
  resolved: "bg-gradient-to-r from-emerald-500 to-green-500 text-white",
  closed: "bg-gradient-to-r from-slate-500 to-gray-500 text-white"
};

export default function ProjectTicketBreakdown({ tickets, projects, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/20">
        <div className="p-8 border-b border-slate-200/60 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 rounded-t-3xl">
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Building className="w-6 h-6" />
            Tickets by Project
          </h3>
        </div>
        <div className="p-8">
          <div className="space-y-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-5 bg-slate-200 rounded-xl mb-3"></div>
                <div className="h-3 bg-slate-200 rounded-xl mb-5"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getProjectStats = (projectId) => {
    const projectTickets = tickets.filter(t => t.project_id === projectId);
    const open = projectTickets.filter(t => t.status === 'open').length;
    const inProgress = projectTickets.filter(t => t.status === 'in_progress').length;
    const resolved = projectTickets.filter(t => t.status === 'resolved').length;
    const closed = projectTickets.filter(t => t.status === 'closed').length;
    const total = projectTickets.length;
    const completionRate = total > 0 ? Math.round(((resolved + closed) / total) * 100) : 0;
    
    return { open, inProgress, resolved, closed, total, completionRate };
  };

  const projectsWithTickets = projects.filter(project => 
    tickets.some(ticket => ticket.project_id === project.id)
  );

  if (projectsWithTickets.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/20">
        <div className="p-8 border-b border-slate-200/60 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 rounded-t-3xl">
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Building className="w-6 h-6" />
            Tickets by Project
          </h3>
        </div>
        <div className="p-8">
          <div className="text-center py-12">
            <Building className="w-16 h-16 text-slate-400 mx-auto mb-6" />
            <p className="text-slate-500 text-lg font-medium">No tickets found for any projects</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/20">
      <div className="p-8 border-b border-slate-200/60 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 rounded-t-3xl">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Building className="w-6 h-6" />
            Tickets by Project
          </h3>
          <Link 
            to={createPageUrl("Tickets")} 
            className="text-indigo-600 hover:text-indigo-700 transition-colors text-sm flex items-center gap-2 font-semibold group"
          >
            View All 
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
      <div className="p-8">
        <div className="space-y-8">
          {projectsWithTickets.map((project) => {
            const stats = getProjectStats(project.id);
            return (
              <div key={project.id} className="space-y-4 p-6 bg-gradient-to-r from-slate-50/80 to-indigo-50/80 rounded-2xl border border-slate-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg tracking-tight">{project.name}</h4>
                    <p className="text-sm text-slate-600 font-medium">{stats.total} tickets total</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-800 mb-1">
                      {stats.completionRate}% Complete
                    </div>
                    <Progress value={stats.completionRate} className="w-24 h-3 bg-slate-200" />
                  </div>
                </div>
                
                <div className="flex gap-3 flex-wrap">
                  {stats.open > 0 && (
                    <Badge className={`${statusColors.open} border-0 text-xs font-semibold px-3 py-1 rounded-full`}>
                      <AlertCircle className="w-3 h-3 mr-1.5" />
                      {stats.open} Open
                    </Badge>
                  )}
                  {stats.inProgress > 0 && (
                    <Badge className={`${statusColors.in_progress} border-0 text-xs font-semibold px-3 py-1 rounded-full`}>
                      <Clock className="w-3 h-3 mr-1.5" />
                      {stats.inProgress} In Progress
                    </Badge>
                  )}
                  {stats.resolved > 0 && (
                    <Badge className={`${statusColors.resolved} border-0 text-xs font-semibold px-3 py-1 rounded-full`}>
                      <CheckCircle className="w-3 h-3 mr-1.5" />
                      {stats.resolved} Resolved
                    </Badge>
                  )}
                  {stats.closed > 0 && (
                    <Badge className={`${statusColors.closed} border-0 text-xs font-semibold px-3 py-1 rounded-full`}>
                      {stats.closed} Closed
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}