

import React from 'react';
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Home,
  Ticket,
  Plus,
  ShieldCheck,
  Users,
  MessageSquare,
  Settings // Added Settings icon
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { UserProvider, useUser } from "../components/auth/UserProvider";
import { BrandingProvider, useBranding } from "../components/branding/BrandingProvider";
import { NotificationProvider } from "../components/notifications/NotificationProvider";
import ClientViewToggle from "../components/branding/ClientViewToggle";

const baseNavItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: Home,
  },
  {
    title: "My Tickets",
    url: createPageUrl("Tickets"),
    icon: Ticket,
  },
  {
    title: "Create Ticket",
    url: createPageUrl("CreateTicket"),
    icon: Plus,
  },
];

const adminNavItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: Home,
  },
  {
    title: "All Tickets",
    url: createPageUrl("Tickets"),
    icon: Ticket,
  },
  {
    title: "Create Ticket",
    url: createPageUrl("CreateTicket"),
    icon: Plus,
  },
  {
    title: "Admin Panel",
    url: createPageUrl("Admin"),
    icon: ShieldCheck,
  },
  {
    title: "Integrations",
    url: createPageUrl("Integrations"),
    icon: Settings,
  },
  {
    title: "Data Structure",
    url: createPageUrl("DataStructure"),
    icon: Users,
  },
];


function AppLayout({ children }) {
  const location = useLocation();
  const { user, isLoading } = useUser();
  const { branding, theme } = useBranding();

  const navigationItems = user?.role === 'admin' ? adminNavItems : baseNavItems;

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${theme.bg}`}>
        <div className="flex flex-col items-center space-y-4">
          <div className={`w-12 h-12 border-4 border-opacity-20 border-t-opacity-100 rounded-full animate-spin bg-gradient-to-r ${theme.primary} border-current`} />
          <p className="text-slate-600 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex w-full bg-gradient-to-br ${theme.bg}`}>
      <SidebarProvider>
        <Sidebar className="bg-white/80 backdrop-blur-xl border-r border-slate-200/60 shadow-xl shadow-slate-200/20">
          <SidebarHeader className={`border-b border-slate-200/60 p-6 bg-gradient-to-r ${theme.accent}`}>
            <div className="flex items-center gap-4">
              <div>
                <h2 className="font-bold text-slate-800 text-xl">{branding.appName}</h2>
                <p className="text-xs text-slate-500 font-medium">
                  {user?.role === 'admin' ? 'Admin Portal' : 'Support & Help'}
                </p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">
                {user?.role === 'admin' ? 'Administration' : 'Support'}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`hover:bg-opacity-10 hover:bg-current text-slate-700 transition-all duration-200 rounded-xl mb-1 font-medium ${
                          (location.pathname === item.url || (item.title === "My Tickets" && location.pathname === createPageUrl("Tickets")))
                            ? `bg-gradient-to-r ${theme.primary} text-white font-semibold shadow-lg ${theme.shadow}`
                            : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-4 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="tracking-tight">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className={`border-t border-slate-200/60 p-6 bg-gradient-to-r from-slate-50 ${theme.accent}`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
                <img
                  src={`https://avatar.vercel.sh/${user?.email}.svg`}
                  alt="User"
                  className="w-12 h-12 rounded-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate tracking-tight">{user?.full_name || user?.email}</p>
                <p className="text-xs text-slate-500 capitalize font-medium">{user?.role}</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 md:hidden shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="bg-slate-100 p-3 rounded-xl text-slate-700 hover:bg-slate-200 transition-colors" />
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">{branding.appName}</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </SidebarProvider>
      
      {/* Client View Toggle for Admins Only */}
      {user?.role === 'admin' && <ClientViewToggle />}
    </div>
  );
}


export default function LayoutWrapper({ children }) {
  return (
    <UserProvider>
      <BrandingProvider>
        <NotificationProvider>
          <AppLayout>{children}</AppLayout>
        </NotificationProvider>
      </BrandingProvider>
    </UserProvider>
  )
}

