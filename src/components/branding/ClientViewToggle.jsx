import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Eye, Building, Palette, LogOut, User } from 'lucide-react';
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
    <div className="fixed bottom-4 left-4 z-50 bg-white/90 backdrop-blur-sm border border-slate-300 rounded-2xl shadow-lg shadow-slate-200/50 p-4 max-w-sm">
      {/* Admin Info Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-slate-600" />
        </div>
        
        {/* User Info */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-teal-300 to-teal-400"></div>
          <span className="text-xs text-slate-600 truncate max-w-20">
            {user?.full_name?.split(' ')[0] || 'Admin'}
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        {/* Project View Toggle */}
        <div>
          <label className="text-xs font-medium text-slate-600 uppercase tracking-wider mb-1 block">
          </label>
          <Select value={currentProjectId || 'default'} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-full bg-white border-slate-300 text-slate-900 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 rounded-xl max-h-60">
              <SelectItem value="default">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-500" />
                  Default Admin View
                </div>
              </SelectItem>
              {availableProjects?.results?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${colorOptions[project.primary_color]?.class || 'bg-blue-500'}`} />
                    <span className="truncate">
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
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Current Branding:</span>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${colorOptions[branding?.primaryColor]?.class || 'bg-blue-500'}`} />
                <Badge variant="secondary" className="text-xs">
                  {colorOptions[branding?.primaryColor]?.name || 'Blue'}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-1 truncate">
              {branding?.appName}
            </p>
          </div>
        )}

        {/* Logout Section */}
        <div className="pt-3 border-t border-slate-200">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group border border-slate-200 hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                <span>Signing out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 transition-colors duration-200" />
                <span>Sign out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}