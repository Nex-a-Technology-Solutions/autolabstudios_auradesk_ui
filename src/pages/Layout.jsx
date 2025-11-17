import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Home,
  Ticket,
  Plus,
  ShieldCheck,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  ChevronRight
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
import { User as UserAPI } from '@/api/entities';

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

// List of pages that should not show the sidebar
const NO_SIDEBAR_PAGES = ['/login', '/register'];

function AppLayout({ children }) {
  const location = useLocation();
  const { user, isLoading, logout: userProviderLogout } = useUser();
  const { branding, theme } = useBranding();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navigationItems = user?.role === 'admin' ? adminNavItems : baseNavItems;
  
  // Check if current page should show sidebar
  const shouldShowSidebar = !NO_SIDEBAR_PAGES.includes(location.pathname.toLowerCase());

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      console.log('User logout initiated from AppLayout');
      
      // Call Django API logout
      await UserAPI.logout();
      console.log('Django API logout successful');
      
      // Clear local authentication state
      if (userProviderLogout) {
        userProviderLogout();
      } else {
        // Fallback: clear localStorage manually
        localStorage.removeItem('auth_token');
      }
      
      console.log('Local state cleared, redirecting to login');
      
      // Navigate to login page
      navigate('/login');
      
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if API logout fails, clear local state and redirect for security
      if (userProviderLogout) {
        userProviderLogout();
      } else {
        localStorage.removeItem('auth_token');
      }
      
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

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

  // If no sidebar should be shown, render children without sidebar layout
  if (!shouldShowSidebar) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.bg}`}>
        {children}
      </div>
    );
  }

  // Regular layout with sidebar
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
                        className={`hover:bg-slate-100 hover:text-slate-800 text-slate-700 transition-all duration-200 rounded-xl mb-1 font-medium ${
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
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal flex items-center justify-center overflow-hidden">
                  <img
                    src={`https://avatar.vercel.sh/${user?.email}.svg`}
                    alt="User"
                    className="w-8 h-8 rounded-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate tracking-tight">{user?.full_name || user?.email}</p>
                  <p className="text-xs text-slate-500 capitalize font-medium">{user?.role}</p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="mt-4 w-full text-sm font-medium text-slate-600 hover:text-red-600 flex items-center justify-center gap-2 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.6}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Logout
              </button>
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