import React from "react";
import { TrendingUp } from "lucide-react";

const colorMap = {
  blue: { 
    bg: "bg-gradient-to-br from-blue-500 to-blue-600", 
    text: "text-white", 
    bgLight: "bg-gradient-to-br from-blue-50 to-indigo-50",
    border: "border-blue-200/60",
    shadow: "shadow-blue-200/25"
  },
  amber: { 
    bg: "bg-gradient-to-br from-amber-500 to-orange-500", 
    text: "text-white", 
    bgLight: "bg-gradient-to-br from-amber-50 to-orange-50",
    border: "border-amber-200/60",
    shadow: "shadow-amber-200/25"
  },
  emerald: { 
    bg: "bg-gradient-to-br from-emerald-500 to-green-500", 
    text: "text-white", 
    bgLight: "bg-gradient-to-br from-emerald-50 to-green-50",
    border: "border-emerald-200/60",
    shadow: "shadow-emerald-200/25"
  },
  rose: { 
    bg: "bg-gradient-to-br from-rose-500 to-pink-500", 
    text: "text-white", 
    bgLight: "bg-gradient-to-br from-rose-50 to-pink-50",
    border: "border-rose-200/60",
    shadow: "shadow-rose-200/25"
  }
};

export default function StatsCard({ title, value, icon: Icon, color, trend }) {
  const colorConfig = colorMap[color];
  
  return (
    <div className={`${colorConfig.bgLight} border ${colorConfig.border} rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl ${colorConfig.shadow} backdrop-blur-sm`}>
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <p className="text-slate-600 text-sm font-semibold tracking-wide uppercase">{title}</p>
          <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
        </div>
        <div className={`p-4 rounded-2xl ${colorConfig.bg} shadow-lg ${colorConfig.shadow}`}>
          <Icon className={`w-6 h-6 ${colorConfig.text}`} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center text-sm font-medium">
          <TrendingUp className="w-4 h-4 mr-2 text-emerald-600" />
          <span className="text-slate-600">{trend}</span>
        </div>
      )}
    </div>
  );
}