import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Eye, Building, LogOut, User } from 'lucide-react';
import { useBranding } from './BrandingProvider';
import { useUser } from '../auth/UserProvider';
import { User as UserAPI } from '@/api/entities';

export default function ClientViewToggle() {
  const { availableProjects, currentProjectId, loadBrandingForProject, branding } = useBranding();
  const { user, logout: userProviderLogout } = useUser();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Only show for admins
  if (user?.role !== 'admin') {
    return null;
  }

  const handleProjectChange = (projectId) => {
    loadBrandingForProject(projectId === 'default' ? null : projectId);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      console.log('Admin logout initiated from ClientViewToggle');
      
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

  const colorOptions = {
    blue: { name: 'Blue', class: 'bg-blue-500' },
    purple: { name: 'Purple', class: 'bg-purple-500' },
    green: { name: 'Green', class: 'bg-emerald-500' },
    red: { name: 'Red', class: 'bg-red-500' },
    orange: { name: 'Orange', class: 'bg-orange-500' },
    teal: { name: 'Teal', class: 'bg-teal-500' },
    pink: { name: 'Pink', class: 'bg-pink-500' },
    indigo: { name: 'Indigo', class: 'bg-indigo-500' }
  };

  return (
    <div className="fixed bottom-3 left-3 z-50 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow-md p-2.5 w-56">
      {/* User Info Header */}
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(to right, #db2777, #e11d48)' }}>
          <User className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-black truncate">
            {user?.full_name || user?.email || 'Admin User'}
          </p>
          <p className="text-[10px] text-slate-500 capitalize">
            {user?.role}
          </p>
        </div>
        <Eye className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
      </div>
      
      <div className="space-y-2">
        {/* Project View Toggle */}
        <div>
          <Select value={currentProjectId || 'default'} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-full h-8 bg-white border-slate-200 text-black text-xs rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 rounded-lg max-h-60">
              <SelectItem value="default">
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-black">Admin View (All Projects)</span>
                </div>
              </SelectItem>
              {availableProjects?.results?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${colorOptions[project.primary_color]?.class || 'bg-blue-500'}`} />
                    <span className="text-xs text-black truncate">
                      {project.display_name || `${project.name} Help Desk`}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Current Branding Info */}
        {currentProjectId && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Active:</span>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${colorOptions[branding?.primaryColor]?.class || 'bg-blue-500'}`} />
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {colorOptions[branding?.primaryColor]?.name || 'Blue'}
                </Badge>
              </div>
            </div>
            <p className="text-[10px] text-black mt-1 truncate">
              {branding?.appName}
            </p>
          </div>
        )}

        {/* Logout Section */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs text-black hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-slate-200 hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <>
                <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                <span>Signing out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}