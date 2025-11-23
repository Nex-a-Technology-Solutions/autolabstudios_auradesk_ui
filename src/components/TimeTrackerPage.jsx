import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { Clock, Play, Pause, Square, Calendar, BarChart3, Settings, Plus, Download, Moon, Sun, Trash2, Edit2, Check, X, Users, Zap, LineChart, ExternalLink } from 'lucide-react';

// ==================== API SERVICE ====================

const ApiService = {
  // Time Entries
  getTimeEntries: async () => {
    const response = await fetch('/api/time-entries');
    return response.json();
  },
  
  createTimeEntry: async (entry) => {
    const response = await fetch('/api/time-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    return response.json();
  },
  
  deleteTimeEntry: async (id) => {
    const response = await fetch('/api/time-entries', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    return response.json();
  },

  // Projects
  getProjects: async () => {
    const response = await fetch('/api/projects');
    return response.json();
  },
  
  createProject: async (project) => {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
    return response.json();
  },
  
  deleteProject: async (id) => {
    const response = await fetch('/api/projects', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    return response.json();
  },

  // Clock Sessions
  getClockSessions: async () => {
    const response = await fetch('/api/clock-sessions');
    return response.json();
  },
  
  createClockSession: async (session) => {
    const response = await fetch('/api/clock-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    });
    return response.json();
  },
  
  updateClockSession: async (id, updates) => {
    const response = await fetch('/api/clock-sessions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    });
    return response.json();
  }
};

// ==================== CONTEXT ====================

const TimeTrackerContext = createContext();

const useTimeTracker = () => {
  const context = useContext(TimeTrackerContext);
  if (!context) throw new Error('useTimeTracker must be used within TimeTrackerProvider');
  return context;
};

// ==================== UTILS ====================

const formatTime = (seconds) => {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

const getDateKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getWeekDates = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  const week = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    week.push(date);
  }
  return week;
};

// ==================== TIME TRACKER PROVIDER ====================

const TimeTrackerProvider = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [clockSessions, setClockSessions] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [activeClock, setActiveClock] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(0);

  const hydrated = useRef(false);

  // Load initial data from MongoDB
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [projectsData, entriesData, sessionsData] = await Promise.all([
          ApiService.getProjects(),
          ApiService.getTimeEntries(),
          ApiService.getClockSessions()
        ]);
        
        // If no projects in DB, use default ones
        if (projectsData.length === 0) {
          const defaultProjects = [
            { name: 'Work Projects', color: '#3b82f6' },
            { name: 'Personal', color: '#10b981' },
            { name: 'Learning', color: '#f59e0b' }
          ];
          
          for (const project of defaultProjects) {
            await ApiService.createProject(project);
          }
          
          const newProjects = await ApiService.getProjects();
          setProjects(newProjects);
        } else {
          setProjects(projectsData);
        }
        
        setTimeEntries(entriesData);
        setClockSessions(sessionsData);

        // Check for active clock session
        const activeClockSession = sessionsData.find(s => !s.endTime);
        if (activeClockSession) {
          setActiveClock(activeClockSession);
        }

        // Load active timer from localStorage (client-side only)
        const savedActiveTimer = localStorage.getItem('timetracker_active_timer');
        if (savedActiveTimer) {
          const timer = JSON.parse(savedActiveTimer);
          const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
          setActiveTimer(timer);
          setTimerSeconds(elapsed);
        }

        hydrated.current = true;
      } catch (error) {
        console.error('Failed to load initial data:', error);
        // Fallback to localStorage if API fails
        const savedProjects = JSON.parse(localStorage.getItem('timetracker_projects')) || [
          { id: '1', name: 'Work Projects', color: '#3b82f6' },
          { id: '2', name: 'Personal', color: '#10b981' },
          { id: '3', name: 'Learning', color: '#f59e0b' }
        ];
        const savedEntries = JSON.parse(localStorage.getItem('timetracker_entries')) || [];
        const savedClockSessions = JSON.parse(localStorage.getItem('timetracker_clock_sessions')) || [];
        const savedActiveTimer = JSON.parse(localStorage.getItem('timetracker_active_timer'));
        const savedSettings = JSON.parse(localStorage.getItem('timetracker_settings')) || { darkMode: true };

        setProjects(savedProjects);
        setTimeEntries(savedEntries);
        setClockSessions(savedClockSessions);
        setDarkMode(savedSettings.darkMode);

        if (savedActiveTimer) {
          const elapsed = Math.floor((Date.now() - savedActiveTimer.startTime) / 1000);
          setActiveTimer(savedActiveTimer);
          setTimerSeconds(elapsed);
        }

        const activeClockSession = savedClockSessions.find(s => !s.endTime);
        if (activeClockSession) {
          setActiveClock(activeClockSession);
        }

        hydrated.current = true;
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    let interval;
    if (activeTimer) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const startTimer = (projectId, description) => {
    const timer = {
      id: Date.now().toString(),
      projectId,
      description,
      startTime: Date.now()
    };
    setActiveTimer(timer);
    setTimerSeconds(0);
    localStorage.setItem('timetracker_active_timer', JSON.stringify(timer));
  };

  const stopTimer = async () => {
    if (!activeTimer) return;
    
    const entry = {
      projectId: activeTimer.projectId,
      description: activeTimer.description,
      startTime: activeTimer.startTime,
      endTime: Date.now(),
      duration: timerSeconds,
      date: getDateKey(new Date())
    };
    
    try {
      const savedEntry = await ApiService.createTimeEntry(entry);
      setTimeEntries(prev => [...prev, savedEntry]);
    } catch (error) {
      console.error('Failed to save time entry:', error);
      // Fallback to localStorage
      const fallbackEntry = {
        ...entry,
        id: Date.now().toString()
      };
      setTimeEntries(prev => {
        const updated = [...prev, fallbackEntry];
        localStorage.setItem('timetracker_entries', JSON.stringify(updated));
        return updated;
      });
    }
    
    setActiveTimer(null);
    setTimerSeconds(0);
    localStorage.removeItem('timetracker_active_timer');
  };

  const addManualEntry = async (projectId, description, duration, date) => {
    const entry = {
      projectId,
      description,
      startTime: new Date(date).getTime(),
      endTime: new Date(date).getTime() + (duration * 1000),
      duration,
      date: getDateKey(new Date(date)),
      manual: true
    };
    
    try {
      const savedEntry = await ApiService.createTimeEntry(entry);
      setTimeEntries(prev => [...prev, savedEntry]);
    } catch (error) {
      console.error('Failed to save manual entry:', error);
      // Fallback to localStorage
      const fallbackEntry = {
        ...entry,
        id: Date.now().toString()
      };
      setTimeEntries(prev => {
        const updated = [...prev, fallbackEntry];
        localStorage.setItem('timetracker_entries', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const deleteEntry = async (id) => {
    try {
      await ApiService.deleteTimeEntry(id);
      setTimeEntries(prev => prev.filter(e => e._id !== id));
    } catch (error) {
      console.error('Failed to delete entry:', error);
      // Fallback to localStorage
      setTimeEntries(prev => {
        const updated = prev.filter(e => e.id !== id);
        localStorage.setItem('timetracker_entries', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const clockIn = async () => {
    const session = {
      startTime: Date.now(),
      date: getDateKey(new Date())
    };
    
    try {
      const savedSession = await ApiService.createClockSession(session);
      setActiveClock(savedSession);
      setClockSessions(prev => [...prev, savedSession]);
    } catch (error) {
      console.error('Failed to clock in:', error);
      // Fallback to localStorage
      const fallbackSession = {
        ...session,
        id: Date.now().toString()
      };
      setActiveClock(fallbackSession);
      setClockSessions(prev => {
        const updated = [...prev, fallbackSession];
        localStorage.setItem('timetracker_clock_sessions', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const clockOut = async () => {
    if (!activeClock) return;
    
    try {
      await ApiService.updateClockSession(activeClock._id, { endTime: Date.now() });
      setClockSessions(prev => prev.map(s =>
        s._id === activeClock._id ? { ...s, endTime: Date.now() } : s
      ));
      setActiveClock(null);
    } catch (error) {
      console.error('Failed to clock out:', error);
      // Fallback to localStorage
      setClockSessions(prev => prev.map(s =>
        s.id === activeClock.id ? { ...s, endTime: Date.now() } : s
      ));
      setActiveClock(null);
      localStorage.setItem('timetracker_clock_sessions', JSON.stringify(clockSessions));
    }
  };

  const addProject = async (name, color) => {
    const project = { name, color };
    
    try {
      const savedProject = await ApiService.createProject(project);
      setProjects(prev => [...prev, savedProject]);
    } catch (error) {
      console.error('Failed to create project:', error);
      // Fallback to localStorage
      const fallbackProject = {
        ...project,
        id: Date.now().toString()
      };
      setProjects(prev => {
        const updated = [...prev, fallbackProject];
        localStorage.setItem('timetracker_projects', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const deleteProject = async (id) => {
    try {
      await ApiService.deleteProject(id);
      setProjects(prev => prev.filter(p => p._id !== id));
      // Also delete related time entries
      setTimeEntries(prev => prev.filter(e => e.projectId !== id));
    } catch (error) {
      console.error('Failed to delete project:', error);
      // Fallback to localStorage
      setProjects(prev => {
        const updated = prev.filter(p => p.id !== id);
        localStorage.setItem('timetracker_projects', JSON.stringify(updated));
        return updated;
      });
      setTimeEntries(prev => {
        const updated = prev.filter(e => e.projectId !== id);
        localStorage.setItem('timetracker_entries', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const value = {
    currentPage,
    setCurrentPage,
    projects,
    timeEntries,
    clockSessions,
    activeTimer,
    activeClock,
    darkMode,
    setDarkMode,
    timerSeconds,
    startTimer,
    stopTimer,
    addManualEntry,
    deleteEntry,
    clockIn,
    clockOut,
    addProject,
    deleteProject
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.code === 'Space') {
        if (activeTimer) {
          stopTimer();
        } else {
          startTimer(projects[0]?.id, 'New Task');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTimer, projects]);

  return <TimeTrackerContext.Provider value={value}>{children}</TimeTrackerContext.Provider>;
};

// ==================== COMPONENTS ====================

const Header = () => {
  const { activeTimer, timerSeconds, stopTimer, darkMode, setDarkMode, projects } = useTimeTracker();
  
  const project = activeTimer ? projects.find(p => p.id === activeTimer.projectId) : null;

  return (
    <header className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4">
          <Clock className={`${darkMode ? 'text-blue-400' : 'text-blue-600'}`} size={24} />
          <h1 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>TimeTracker</h1>
        </div>
        
        {activeTimer && (
          <div className={`hidden sm:flex items-center gap-4 px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {project?.name} - {activeTimer.description}
              </span>
            </div>
            <span className={`text-lg font-mono font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatTime(timerSeconds)}
            </span>
            <button
              onClick={stopTimer}
              className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition"
            >
              <Square size={16} fill="currentColor" />
            </button>
          </div>
        )}
        
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition`}
        >
          {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-700" />}
        </button>
      </div>
    </header>
  );
};

const Sidebar = () => {
  const { currentPage, setCurrentPage, darkMode } = useTimeTracker();

  const navItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'timer', icon: Play, label: 'Timer' },
    { id: 'calendar', icon: Calendar, label: 'Calendar View' },
    { id: 'clock', icon: Clock, label: 'Clock In/Out' },
    { id: 'projects', icon: Settings, label: 'Projects' }
  ];

  return (
    <>
      <aside className={`hidden md:block w-64 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-r min-h-screen`}>
        <nav className="p-4 space-y-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? darkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : darkMode
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={item.label}
                aria-label={item.label}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 ${
          darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        } border-t z-50`}
      >
        <div className="grid grid-cols-4 gap-1 p-2 pb-3 pb-[env(safe-area-inset-bottom)]">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition ${
                  isActive
                    ? darkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : darkMode
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={item.label}
                aria-label={item.label}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="text-[10px] leading-tight text-center">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

const DashboardPage = () => {
  const { timeEntries, projects, clockSessions, darkMode } = useTimeTracker();
  
  const today = getDateKey(new Date());
  const weekDates = getWeekDates();
  
  const todayEntries = timeEntries.filter(e => e.date === today);
  const todayTotal = todayEntries.reduce((sum, e) => sum + e.duration, 0);
  
  const weekTotal = timeEntries
    .filter(e => weekDates.some(d => getDateKey(d) === e.date))
    .reduce((sum, e) => sum + e.duration, 0);
  
  const projectStats = projects.map(project => {
    const entries = timeEntries.filter(e => e.projectId === project.id);
    const total = entries.reduce((sum, e) => sum + e.duration, 0);
    return { ...project, total };
  }).sort((a, b) => b.total - a.total);
  
  const mostActive = projectStats[0];
  
  const weekData = weekDates.map(date => {
    const dateKey = getDateKey(date);
    const dayEntries = timeEntries.filter(e => e.date === dateKey);
    const total = dayEntries.reduce((sum, e) => sum + e.duration, 0);
    return {
      date,
      dateKey,
      total,
      hours: total / 3600
    };
  });
  
  const todayClockSessions = clockSessions.filter(s => s.date === today);
  const clockTotal = todayClockSessions.reduce((sum, s) => {
    const end = s.endTime || Date.now();
    return sum + (end - s.startTime);
  }, 0) / 1000;

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-6">
      <h2 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard</h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className={`p-4 sm:p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Today</div>
          <div className={`text-xl sm:text-3xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatTime(todayTotal)}
          </div>
          <div className={`text-xs sm:text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            {todayEntries.length} entries
          </div>
        </div>
        
        <div className={`p-4 sm:p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>This Week</div>
          <div className={`text-xl sm:text-3xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatTime(weekTotal)}
          </div>
          <div className={`text-xs sm:text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            {(weekTotal / 3600).toFixed(1)} hours
          </div>
        </div>
        
        <div className={`p-4 sm:p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Clocked Today</div>
          <div className={`text-xl sm:text-3xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatTime(clockTotal)}
          </div>
          <div className={`text-xs sm:text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            {todayClockSessions.length} sessions
          </div>
        </div>
        
        <div className={`p-4 sm:p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Most Active</div>
          <div className={`text-lg sm:text-2xl font-bold mt-2 truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {mostActive?.name || 'N/A'}
          </div>
          <div className={`text-xs sm:text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            {mostActive ? formatTime(mostActive.total) : '0h'}
          </div>
        </div>
      </div>
      
      <div className={`p-4 sm:p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <h3 className={`text-lg sm:text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Weekly Activity</h3>
        <div className="flex items-end justify-between gap-1 sm:gap-2 h-48 sm:h-64">
          {weekData.map((day, i) => {
            const maxHours = Math.max(...weekData.map(d => d.hours), 1);
            const heightPercent = (day.hours / maxHours) * 100;
            
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 sm:gap-2">
                <div className="relative w-full flex items-end" style={{ height: '150px' }}>
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      day.dateKey === today
                        ? 'bg-blue-500'
                        : darkMode
                        ? 'bg-gray-700'
                        : 'bg-gray-300'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {day.date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}
                </div>
                <div className={`text-xs sm:text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {day.hours.toFixed(1)}h
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className={`p-4 sm:p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <h3 className={`text-lg sm:text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Project Breakdown</h3>
        <div className="space-y-3">
          {projectStats.map(project => {
            const percent = weekTotal > 0 ? (project.total / weekTotal) * 100 : 0;
            return (
              <div key={project.id}>
                <div className="flex justify-between mb-1">
                  <span className={`text-sm font-medium truncate pr-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {project.name}
                  </span>
                  <span className={`text-xs sm:text-sm whitespace-nowrap ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {formatTime(project.total)} ({percent.toFixed(0)}%)
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${percent}%`, backgroundColor: project.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const TimerPage = () => {
  const { activeTimer, startTimer, stopTimer, projects, timeEntries, darkMode, deleteEntry, timerSeconds, addManualEntry } = useTimeTracker();
  const [selectedProject, setSelectedProject] = useState('');
  const [description, setDescription] = useState('');
  const [manualDuration, setManualDuration] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  
  const handleStart = () => {
    if (!selectedProject || !description) return;
    startTimer(selectedProject, description);
    setDescription('');
  };
  
  const handleManualEntry = () => {
    if (!selectedProject || !description || !manualDuration) return;
    const [hours, minutes] = manualDuration.split(':').map(Number);
    const seconds = (hours * 3600) + (minutes * 60);
    addManualEntry(selectedProject, description, seconds, manualDate);
    setDescription('');
    setManualDuration('');
  };
  
  const todayEntries = timeEntries
    .filter(e => e.date === getDateKey(new Date()))
    .sort((a, b) => b.startTime - a.startTime);

  return (
    <div className="space-y-6">
      <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Time Tracker</h2>
      
      <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {activeTimer ? 'Active Timer' : 'Start New Timer'}
        </h3>
        
        {activeTimer ? (
          <div className="text-center space-y-4">
            <div className={`text-6xl font-mono font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatTime(timerSeconds)}
            </div>
            <div className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {projects.find(p => p.id === activeTimer.projectId)?.name} - {activeTimer.description}
            </div>
            <button
              onClick={stopTimer}
              className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition flex items-center gap-2 mx-auto"
            >
              <Square size={20} fill="currentColor" />
              Stop Timer
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg ${
                darkMode
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-white text-gray-900 border-gray-300'
              } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="">Select Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you working on?"
              className={`w-full px-4 py-2 rounded-lg ${
                darkMode
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-white text-gray-900 border-gray-300'
              } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            
            <button
              onClick={handleStart}
              disabled={!selectedProject || !description}
              className="w-full px-8 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              <Play size={20} />
              Start Timer
            </button>
          </div>
        )}
      </div>
      
      <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Manual Entry</h3>
        <div className="grid grid-cols-2 gap-4">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className={`px-4 py-2 rounded-lg ${
              darkMode
                ? 'bg-gray-700 text-white border-gray-600'
                : 'bg-white text-gray-900 border-gray-300'
            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">Select Project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className={`px-4 py-2 rounded-lg ${
              darkMode
                ? 'bg-gray-700 text-white border-gray-600'
                : 'bg-white text-gray-900 border-gray-300'
            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          
          <input
            type="time"
            value={manualDuration}
            onChange={(e) => setManualDuration(e.target.value)}
            className={`px-4 py-2 rounded-lg ${
              darkMode
                ? 'bg-gray-700 text-white border-gray-600'
                : 'bg-white text-gray-900 border-gray-300'
            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          
          <input
            type="date"
            value={manualDate}
            onChange={(e) => setManualDate(e.target.value)}
            className={`px-4 py-2 rounded-lg ${
              darkMode
                ? 'bg-gray-700 text-white border-gray-600'
                : 'bg-white text-gray-900 border-gray-300'
            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          
          <button
            onClick={handleManualEntry}
            disabled={!selectedProject || !description || !manualDuration}
            className="col-span-2 px-8 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Add Entry
          </button>
        </div>
      </div>
      
      <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Today's Entries</h3>
        <div className="space-y-2">
          {todayEntries.length === 0 ? (
            <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No entries yet today
            </p>
          ) : (
            todayEntries.map(entry => {
              const project = projects.find(p => p.id === entry.projectId);
              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project?.color }}
                    />
                    <div>
                      <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {entry.description}
                      </div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {project?.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-mono font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatTime(entry.duration)}
                    </span>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const CalendarPage = () => {
  const { timeEntries, projects, darkMode } = useTimeTracker();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };
  
  const days = getDaysInMonth(currentMonth);
  
  const getDateTotal = (date) => {
    if (!date) return 0;
    const dateKey = getDateKey(date);
    return timeEntries
      .filter(e => e.date === dateKey)
      .reduce((sum, e) => sum + e.duration, 0);
  };
  
  const maxTotal = Math.max(...days.filter(d => d).map(d => getDateTotal(d)), 1);
  
  const selectedDateEntries = selectedDate
    ? timeEntries.filter(e => e.date === getDateKey(selectedDate))
    : [];
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Calendar</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={prevMonth}
            className={`px-4 py-2 rounded-lg ${
              darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
            } transition`}
          >
            ←
          </button>
          <span className={`text-xl font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={nextMonth}
            className={`px-4 py-2 rounded-lg ${
              darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
            } transition`}
          >
            →
          </button>
        </div>
      </div>
      
      <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              className={`text-center font-medium py-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              {day}
            </div>
          ))}
          
          {days.map((day, i) => {
            if (!day) {
              return <div key={i} />;
            }
            
            const total = getDateTotal(day);
            const intensity = total > 0 ? (total / maxTotal) : 0;
            const isToday = getDateKey(day) === getDateKey(new Date());
            const isSelected = selectedDate && getDateKey(day) === getDateKey(selectedDate);
            
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(day)}
                className={`aspect-square rounded-lg p-2 transition relative ${
                  isSelected
                    ? 'ring-2 ring-blue-500'
                    : ''
                } ${
                  isToday
                    ? darkMode
                      ? 'ring-2 ring-yellow-500'
                      : 'ring-2 ring-yellow-400'
                    : ''
                }`}
                style={{
                  backgroundColor: total > 0
                    ? `rgba(59, 130, 246, ${0.2 + intensity * 0.8})`
                    : darkMode
                    ? '#1f2937'
                    : '#f9fafb'
                }}
              >
                <div className={`text-sm font-medium ${
                  total > 0 ? 'text-white' : darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {day.getDate()}
                </div>
                {total > 0 && (
                  <div className="text-xs text-white font-bold mt-1">
                    {(total / 3600).toFixed(1)}h
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {selectedDate && (
        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatDate(selectedDate)}
          </h3>
          {selectedDateEntries.length === 0 ? (
            <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No entries for this day
            </p>
          ) : (
            <div className="space-y-2">
              {selectedDateEntries.map(entry => {
                const project = projects.find(p => p.id === entry.projectId);
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project?.color }}
                      />
                      <div>
                        <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {entry.description}
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {project?.name}
                        </div>
                      </div>
                    </div>
                    <span className={`font-mono font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatTime(entry.duration)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ClockPage = () => {
  const { activeClock, clockIn, clockOut, clockSessions, darkMode } = useTimeTracker();
  const [clockTime, setClockTime] = useState(0);
  
  useEffect(() => {
    let interval;
    if (activeClock) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - activeClock.startTime) / 1000);
        setClockTime(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeClock]);
  
  const today = getDateKey(new Date());
  const todaySessions = clockSessions.filter(s => s.date === today);
  const todayTotal = todaySessions.reduce((sum, s) => {
    const end = s.endTime || Date.now();
    return sum + (end - s.startTime);
  }, 0) / 1000;
  
  const weekDates = getWeekDates();
  const weekSessions = clockSessions.filter(s => 
    weekDates.some(d => getDateKey(d) === s.date)
  );
  const weekTotal = weekSessions.reduce((sum, s) => {
    const end = s.endTime || Date.now();
    return sum + (end - s.startTime);
  }, 0) / 1000;

  return (
    <div className="space-y-6">
      <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Clock In/Out</h2>
      
      <div className={`p-8 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg text-center`}>
        {activeClock ? (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse" />
              <span className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Clocked In
              </span>
            </div>
            <div className={`text-7xl font-mono font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatTime(clockTime)}
            </div>
            <button
              onClick={clockOut}
              className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-lg transition"
            >
              Clock Out
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Not Clocked In
            </div>
            <div className={`text-7xl font-mono font-bold ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>
              00:00:00
            </div>
            <button
              onClick={clockIn}
              className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium text-lg transition"
            >
              Clock In
            </button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Today</div>
          <div className={`text-4xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatTime(todayTotal)}
          </div>
          <div className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            {todaySessions.length} sessions
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>This Week</div>
          <div className={`text-4xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatTime(weekTotal)}
          </div>
          <div className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            {weekSessions.length} sessions
          </div>
        </div>
      </div>
      
      <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Today's Sessions
        </h3>
        {todaySessions.length === 0 ? (
          <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No sessions yet today
          </p>
        ) : (
          <div className="space-y-2">
            {todaySessions.map(session => {
              const duration = session.endTime
                ? (session.endTime - session.startTime) / 1000
                : (Date.now() - session.startTime) / 1000;
              
              return (
                <div
                  key={session.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {!session.endTime && (
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    )}
                    <div>
                      <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {new Date(session.startTime).toLocaleTimeString()} - 
                        {session.endTime 
                          ? ` ${new Date(session.endTime).toLocaleTimeString()}`
                          : ' In Progress'
                        }
                      </div>
                    </div>
                  </div>
                  <span className={`font-mono font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatTime(duration)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const ProjectsPage = () => {
  const { projects, addProject, deleteProject, darkMode, timeEntries } = useTimeTracker();
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  
  const handleAdd = () => {
    if (!newName) return;
    addProject(newName, newColor);
    setNewName('');
    setNewColor('#3b82f6');
    setShowForm(false);
  };
  
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Projects</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition flex items-center gap-2"
        >
          <Plus size={20} />
          New Project
        </button>
      </div>
      
      {showForm && (
        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Create Project
          </h3>
          <div className="space-y-4">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Project name"
              className={`w-full px-4 py-2 rounded-lg ${
                darkMode
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-white text-gray-900 border-gray-300'
              } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className={`w-10 h-10 rounded-lg transition ${
                      newColor === color ? 'ring-2 ring-white ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
              >
                Create
              </button>
              <button
                onClick={() => setShowForm(false)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => {
          const entries = timeEntries.filter(e => e.projectId === project.id);
          const total = entries.reduce((sum, e) => sum + e.duration, 0);
          
          return (
            <div
              key={project.id}
              className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {project.name}
                  </h3>
                </div>
                <button
                  onClick={() => deleteProject(project.id)}
                  className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatTime(total)}
              </div>
              <div className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {entries.length} entries
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TimeTrackerContent = () => {
  const { currentPage, darkMode } = useTimeTracker();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-3 sm:p-6 md:p-8 w-full md:w-auto pb-28 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {currentPage === 'dashboard' && <DashboardPage />}
            {currentPage === 'timer' && <TimerPage />}
            {currentPage === 'calendar' && <CalendarPage />}
            {currentPage === 'clock' && <ClockPage />}
            {currentPage === 'projects' && <ProjectsPage />}
          </div>
        </main>
      </div>
    </div>
  );
};

// ==================== MAIN EXPORT ====================

const TimeTrackerPage = () => {
  return (
    <TimeTrackerProvider>
      <TimeTrackerContent />
    </TimeTrackerProvider>
  );
};

export default TimeTrackerPage;