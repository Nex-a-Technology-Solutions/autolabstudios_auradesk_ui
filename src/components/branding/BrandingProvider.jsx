import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Project } from '@/api/entities';
import { useUser } from '../auth/UserProvider';

const BrandingContext = createContext();

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState({
    appName: 'astudios auradesk',
    displayName: 'astudios auradesk',
    primaryColor: 'purple',
    logoUrl: null
  });
  
  const [availableProjects, setAvailableProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const { user } = useUser();

  const loadAllProjects = useCallback(async () => {
    if (user?.role === 'admin') {
      try {
        const allProjects = await Project.list();
        setAvailableProjects(allProjects);
      } catch (error) {
        console.error('Error loading all projects:', error);
      }
    }
  }, [user]);

  const loadBrandingForProject = useCallback(async (projectId) => {
    if (!projectId) {
      // Reset to default branding
      setBranding({
        appName: 'astudios auradesk',
        displayName: 'astudios auradesk',
        primaryColor: 'purple',
        logoUrl: null
      });
      setCurrentProjectId(null);
      return;
    }

    try {
      const projectData = await Project.filter({ id: projectId });
      if (projectData.length > 0) {
        const project = projectData[0];
        setBranding({
          appName: project.display_name || `${project.name} Help Desk`,
          displayName: project.display_name || project.name,
          primaryColor: project.primary_color || 'purple',
          logoUrl: project.logo_url || null,
          projectId: project.id
        });
        setCurrentProjectId(projectId);
      }
    } catch (error) {
      console.error('Error loading project branding:', error);
    }
  }, []);

  useEffect(() => {
    const loadBranding = async () => {
      if (user?.role === 'admin') {
        await loadAllProjects();
        // Admin starts with default branding
        setBranding({
          appName: 'astudios auradesk',
          displayName: 'astudios auradesk',
          primaryColor: 'purple',
          logoUrl: null
        });
      } else if (user && user.projects && user.projects.length > 0) {
        // Client sees their project's branding
        await loadBrandingForProject(user.projects[0]);
      }
    };

    if (user) {
      loadBranding();
    }
  }, [user, loadAllProjects, loadBrandingForProject]);

  const colorThemes = {
    blue: {
      primary: 'from-blue-600 to-indigo-600',
      primaryHover: 'from-blue-700 to-indigo-700',
      accent: 'from-blue-50 to-indigo-50',
      bg: 'from-slate-50 via-blue-50 to-indigo-100',
      text: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-800',
      shadow: 'shadow-blue-200/40'
    },
    purple: {
      primary: 'from-purple-600 to-violet-600',
      primaryHover: 'from-purple-700 to-violet-700',
      accent: 'white',
      bg: 'from-slate-50',
      text: 'text-purple-700',
      badge: 'bg-purple-100 text-purple-800',
      shadow: 'shadow-purple-200/40'
    },
    green: {
      primary: 'from-emerald-600 to-green-600',
      primaryHover: 'from-emerald-700 to-green-700',
      accent: 'from-emerald-50 to-green-50',
      bg: 'from-slate-50 via-emerald-50 to-green-100',
      text: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-800',
      shadow: 'shadow-emerald-200/40'
    },
    red: {
      primary: 'from-red-600 to-rose-600',
      primaryHover: 'from-red-700 to-rose-700',
      accent: 'from-red-50 to-rose-50',
      bg: 'from-slate-50 via-red-50 to-rose-100',
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-800',
      shadow: 'shadow-red-200/40'
    },
    orange: {
      primary: 'from-orange-600 to-amber-600',
      primaryHover: 'from-orange-700 to-amber-700',
      accent: 'from-orange-50 to-amber-50',
      bg: 'from-slate-50 via-orange-50 to-amber-100',
      text: 'text-orange-700',
      badge: 'bg-orange-100 text-orange-800',
      shadow: 'shadow-orange-200/40'
    },
    teal: {
      primary: 'from-teal-600 to-cyan-600',
      primaryHover: 'from-teal-700 to-cyan-700',
      accent: 'from-teal-50 to-cyan-50',
      bg: 'from-slate-50 via-teal-50 to-cyan-100',
      text: 'text-teal-700',
      badge: 'bg-teal-100 text-teal-800',
      shadow: 'shadow-teal-200/40'
    },
    pink: {
      primary: 'from-pink-600 to-rose-600',
      primaryHover: 'from-pink-700 to-rose-700',
      accent: 'from-pink-50 to-rose-50',
      bg: 'from-slate-50 via-pink-50 to-rose-100',
      text: 'text-pink-700',
      badge: 'bg-pink-100 text-pink-800',
      shadow: 'shadow-pink-200/40'
    },
    indigo: {
      primary: 'from-indigo-600 to-blue-600',
      primaryHover: 'from-indigo-700 to-blue-700',
      accent: 'from-indigo-50 to-blue-50',
      bg: 'from-slate-50 via-indigo-50 to-blue-100',
      text: 'text-indigo-700',
      badge: 'bg-indigo-100 text-indigo-800',
      shadow: 'shadow-indigo-200/40'
    }
  };

  const theme = colorThemes[branding.primaryColor] || colorThemes.blue;

  return (
    <BrandingContext.Provider value={{ 
      branding, 
      theme, 
      setBranding,
      availableProjects,
      currentProjectId,
      loadBrandingForProject
    }}>
      {children}
    </BrandingContext.Provider>
  );
}