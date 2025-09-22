import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const colors = {
  open: "#3B82F6", // blue-500
  in_progress: "#F59E0B", // amber-500
  resolved: "#10B981", // emerald-500
  closed: "#6B7280" // gray-500
};

export default function TicketChart({ tickets }) {
  const getChartData = () => {
    const statusCounts = {
      open: 0,
      in_progress: 0, 
      resolved: 0,
      closed: 0
    };
    
    tickets.forEach(ticket => {
      statusCounts[ticket.status]++;
    });
    
    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: count,
        color: colors[status]
      }));
  };

  const data = getChartData();

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/20">
      <div className="p-8 border-b border-slate-200/60 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 rounded-t-3xl">
        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Ticket Status</h3>
      </div>
      
      <div className="p-8">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={8}
                dataKey="value"
                cornerRadius={8}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={3} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  borderColor: 'rgba(203, 213, 225, 0.6)',
                  borderRadius: '16px',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(203, 213, 225, 0.6)'
                }}
                labelStyle={{ 
                  color: '#1E293B', 
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              />
              <Legend 
                iconType="circle"
                formatter={(value, entry) => 
                  <span className="text-slate-700 font-medium ml-2">
                    {value} ({entry.payload.value})
                  </span>
                }
                wrapperStyle={{
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}