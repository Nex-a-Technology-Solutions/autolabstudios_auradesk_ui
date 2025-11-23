// pages/TimeTrackerPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock, Plus, Play, StopCircle, Trash2, Calendar, Timer,
  BarChart2, Grid, Download
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip as RTooltip, BarChart, Bar, XAxis, YAxis, Legend
} from 'recharts';
import { useBranding } from '../components/branding/BrandingProvider';
import { useUser } from '../components/auth/UserProvider';
import { Ticket } from '@/api/entities';

// LocalStorage key
const STORAGE_KEY = 'auradesk_time_entries_v1';

export default function TimeTrackerPage() {
  const { theme, branding } = useBranding();
  const { user } = useUser();

  const [tickets, setTickets] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState('');
  const [description, setDescription] = useState('');
  const [timeSpent, setTimeSpent] = useState(''); // Now stores "HH:MM:SS" format
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);

  // Timer
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [activeTab, setActiveTab] = useState('entries');

  // Load tickets
  useEffect(() => {
    const loadTickets = async () => {
      try {
        setIsLoadingTickets(true);
        let data;
        if (user?.role === 'admin') {
          data = await Ticket.list("-created_date");
        } else if (user?.email) {
          data = await Ticket.filter({ client_email: user.email }, "-created_date");
        } else {
          data = [];
        }
        const ticketArray = Array.isArray(data) ? data : data?.results || [];
        setTickets(ticketArray);
      } catch (e) {
        console.error('Failed loading tickets', e);
        setTickets([]);
      } finally {
        setIsLoadingTickets(false);
      }
    };
    loadTickets();
  }, [user]);

  // Load existing time entries from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setTimeEntries(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored time entries', e);
    }
  }, []);

  // Persist time entries
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(timeEntries));
    } catch (e) {
      console.warn('Failed to persist time entries', e);
    }
  }, [timeEntries]);

  // Timer tick
  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => interval && clearInterval(interval);
  }, [isTimerRunning]);

  // Format seconds to HH:MM:SS
  const formatTimer = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  // Convert HH:MM:SS to decimal hours
  const convertToHours = (timeString) => {
    const parts = timeString.split(':');
    const hours = parseInt(parts[0] || 0);
    const minutes = parseInt(parts[1] || 0);
    const seconds = parseInt(parts[2] || 0);
    return (hours + (minutes / 60) + (seconds / 3600)).toFixed(2);
  };

  const handleToggleTimer = () => {
    if (!isTimerRunning) {
      if (!selectedTicket) return;
      setTimerSeconds(0);
      setIsTimerRunning(true);
    } else {
      // Stop and fill with HH:MM:SS format
      if (timerSeconds > 0) {
        const formatted = formatTimer(timerSeconds);
        setTimeSpent(formatted);
      }
      setIsTimerRunning(false);
      setTimerSeconds(0);
    }
  };

  const handleManualTimeEntry = () => {
    if (!selectedTicket || !timeSpent) return;
    const ticketObj = tickets.find(t => String(t.id) === String(selectedTicket));
    
    // Convert time to hours for storage
    const hoursSpent = parseFloat(convertToHours(timeSpent));
    
    const entry = {
      id: crypto.randomUUID(),
      ticketId: String(selectedTicket),
      ticketTitle: ticketObj?.title || `Ticket ${selectedTicket}`,
      description: description || 'Time entry',
      timeSpent: hoursSpent, // Store as decimal hours
      timeFormatted: timeSpent, // Store formatted time for display
      date: new Date().toISOString(),
      user: user?.full_name || user?.email || 'Unknown'
    };
    
    setTimeEntries(prev => [entry, ...prev]);
    setDescription('');
    setTimeSpent('');
    setSelectedTicket('');
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const handleDeleteEntry = (id) => {
    setTimeEntries(prev => prev.filter(e => e.id !== id));
  };

  const getTotalHours = () =>
    timeEntries.reduce((sum, e) => sum + e.timeSpent, 0).toFixed(2);

  // CSV export
  const downloadCSV = () => {
    if (!timeEntries.length) return;
    const headers = ['Ticket ID','Ticket Title','Description','Time (HH:MM:SS)','Hours','Date','User'];
    const rows = timeEntries.map(e => [
      e.ticketId,
      e.ticketTitle,
      (e.description || '').replace(/"/g,'""'),
      e.timeFormatted || formatTimer(e.timeSpent * 3600),
      e.timeSpent,
      new Date(e.date).toISOString(),
      e.user
    ]);
    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(f => `"${String(f)}"`).join(','))
    ].join('\r\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time_entries_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Derived analytics
  const dayMap = useMemo(() => {
    const map = {};
    timeEntries.forEach(e => {
      const d = new Date(e.date).toISOString().split('T')[0];
      map[d] = (map[d] || 0) + e.timeSpent;
    });
    return map;
  }, [timeEntries]);

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const monthStart = new Date(calYear, calMonth, 1);
  const monthEnd = new Date(calYear, calMonth + 1, 0);
  const daysInMonth = monthEnd.getDate();
  const firstWeekday = monthStart.getDay();

  const calendarCells = useMemo(() => {
    const cells = [];
    for (let i=0;i<firstWeekday;i++) cells.push(null);
    for (let d=1; d<=daysInMonth; d++){
      const key = new Date(calYear, calMonth, d).toISOString().split('T')[0];
      cells.push({ day:d, hours: dayMap[key] || 0 });
    }
    return cells;
  }, [firstWeekday, daysInMonth, calYear, calMonth, dayMap]);

  const nextMonth = () => {
    setCalMonth(m => {
      if (m === 11) { setCalYear(y => y+1); return 0; }
      return m+1;
    });
  };
  const prevMonth = () => {
    setCalMonth(m => {
      if (m === 0) { setCalYear(y => y-1); return 11; }
      return m-1;
    });
  };

  const dayHoursChart = useMemo(
    () => calendarCells.filter(c => c && c.hours>0).map(c => ({ day:c.day, hours:c.hours })),
    [calendarCells]
  );

  const ticketHours = useMemo(() => {
    const map = {};
    timeEntries.forEach(e => { map[e.ticketTitle] = (map[e.ticketTitle] || 0) + e.timeSpent; });
    return Object.entries(map).map(([name,hours]) => ({ name, hours }));
  }, [timeEntries]);

  const topTickets = useMemo(
    () => ticketHours.slice().sort((a,b)=>b.hours - a.hours).slice(0,5),
    [ticketHours]
  );

  const avgHoursPerLoggedDay = useMemo(() => {
    if (!dayHoursChart.length) return 0;
    return (dayHoursChart.reduce((s,d)=>s+d.hours,0) / dayHoursChart.length).toFixed(2);
  }, [dayHoursChart]);

  const pieColors = ['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4'];

  if (isLoadingTickets) {
    return (
      <div className="w-full px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-center h-64">
          <div className={`w-12 h-12 rounded-full border-4 border-slate-200 border-t-indigo-500 animate-spin`} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-8">
      <section className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-xl shadow-slate-200/30 px-8 py-6 flex items-center gap-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${theme.primary} shadow-lg ${theme.shadow}`}>
            <Clock className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              Time Tracker
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Track time directly against your tickets in {branding.appName}.
            </p>
          </div>
          <div className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${theme.accent} border border-slate-200/60`}>
            <div className="text-xs text-slate-500 font-medium">Total Hours</div>
            <div className="text-2xl font-bold text-slate-800">{getTotalHours()}h</div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-4">
          {[
            { id:'entries', label:'Entries', icon:Clock },
            { id:'calendar', label:'Calendar', icon:Grid },
            { id:'analytics', label:'Analytics', icon:BarChart2 }
          ].map(t => (
            <button
              key={t.id}
              onClick={()=>setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-sm font-semibold transition-all ${
                activeTab===t.id
                  ? `bg-gradient-to-r ${theme.primary} text-white shadow`
                  : 'bg-white/70 text-slate-600 border-slate-200 hover:text-slate-800'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Entries */}
        {activeTab==='entries' && (
          <>
            <div className="rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-200/30 p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Plus className="w-5 h-5" /> Log Time Entry
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Select Ticket</label>
                  <select
                    value={selectedTicket}
                    onChange={e=>setSelectedTicket(e.target.value)}
                    disabled={isTimerRunning}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <option value="">Choose a ticket...</option>
                    {tickets.map(t => (
                      <option key={t.id} value={t.id}>
                        #{t.id} - {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTicket && (
                  <div className={`rounded-2xl border-2 ${isTimerRunning ? 'border-green-300 bg-green-50/50' : 'border-slate-200/60'} p-6 bg-gradient-to-r ${theme.accent} transition-all`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={isTimerRunning ? 'animate-pulse' : ''}>
                          <Timer className={`w-6 h-6 ${isTimerRunning ? 'text-green-600' : 'text-slate-600'}`} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-500">
                            {isTimerRunning ? 'Timer Running' : (timeSpent ? 'Stopped' : 'Ready')}
                          </div>
                          <div className={`text-3xl font-bold font-mono ${isTimerRunning ? 'text-green-600' : 'text-slate-800'}`}>
                            {formatTimer(timerSeconds)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleToggleTimer}
                        className={`px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg transition-all ${
                          isTimerRunning
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/30 hover:opacity-90'
                            : `bg-gradient-to-r ${theme.primary} text-white ${theme.shadow} hover:opacity-90`
                        }`}
                      >
                        {isTimerRunning ? <StopCircle className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isTimerRunning ? 'Stop & Fill' : 'Start Timer'}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={e=>setDescription(e.target.value)}
                    rows="3"
                    placeholder="What did you work on?"
                    className="w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Time Spent (HH:MM:SS)</label>
                  <input
                    type="text"
                    value={timeSpent}
                    onChange={e=>setTimeSpent(e.target.value)}
                    placeholder="e.g. 01:30:00"
                    pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}"
                    className="w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Use the timer then click Stop & Fill or enter manually in HH:MM:SS format.
                  </p>
                </div>

                <button
                  onClick={handleManualTimeEntry}
                  disabled={!selectedTicket || !timeSpent || isTimerRunning}
                  className={`w-full py-4 rounded-xl bg-gradient-to-r ${theme.primary} text-white font-bold flex items-center justify-center gap-2 shadow-lg ${theme.shadow} hover:opacity-90 disabled:opacity-50`}
                >
                  <Plus className="w-5 h-5" />
                  Log Time Entry
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <Calendar className="w-5 h-5" /> Recent Time Entries
                </h2>
                <button
                  onClick={downloadCSV}
                  disabled={!timeEntries.length}
                  className={`px-5 py-3 rounded-xl bg-gradient-to-r ${theme.primary} text-white font-semibold text-sm flex items-center gap-2 shadow ${theme.shadow} disabled:opacity-40`}
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
              </div>
              {timeEntries.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No time entries yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {timeEntries.map(entry => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-5 rounded-2xl border border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-white hover:shadow-md transition-all"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-bold text-slate-800">#{entry.ticketId}</span>
                          <span className="text-slate-600 font-semibold truncate max-w-xs">
                            {entry.ticketTitle}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mb-2 line-clamp-2">
                          {entry.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(entry.date).toLocaleDateString()}
                          </span>
                          <span>{entry.user}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                          <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${theme.primary} text-white font-bold font-mono`}>
                            {entry.timeFormatted || formatTimer(Math.round(entry.timeSpent * 3600))}
                          </div>
                          <span className="text-xs text-slate-500 mt-1">{entry.timeSpent}h</span>
                        </div>
                        <button
                          onClick={()=>handleDeleteEntry(entry.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Calendar */}
        {activeTab==='calendar' && (
          <div className="rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <Calendar className="w-5 h-5" /> Calendar View
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={prevMonth}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
                >
                  Prev
                </button>
                <button
                  onClick={nextMonth}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
            <div className="text-sm font-medium text-slate-600 mb-4">
              {new Date(calYear, calMonth).toLocaleString('default',{ month:'long', year:'numeric' })}
            </div>
            <div className="grid grid-cols-7 gap-3 text-xs font-semibold text-slate-500 mb-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="text-center">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-3">
              {calendarCells.map((cell,i)=>(
                <div
                  key={i}
                  className={`aspect-square rounded-xl border flex flex-col items-center justify-center text-xs ${
                    cell
                      ? cell.hours>0
                        ? 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200'
                        : 'bg-white border-slate-200'
                      : 'bg-transparent border-transparent'
                  }`}
                >
                  {cell && (
                    <>
                      <div className="font-bold text-slate-700">{cell.day}</div>
                      <div className="mt-1 text-[10px] font-medium text-indigo-600">
                        {cell.hours>0 ? `${cell.hours.toFixed(2)}h` : ''}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-6">
              <div className="px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500">Logged Days</div>
                <div className="text-lg font-bold text-slate-800">{dayHoursChart.length}</div>
              </div>
              <div className="px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500">Avg Hours / Logged Day</div>
                <div className="text-lg font-bold text-slate-800">{avgHoursPerLoggedDay}h</div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics */}
        {activeTab==='analytics' && (
          <div className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-lg p-8 space-y-10">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <BarChart2 className="w-5 h-5" /> Analytics
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-5">
                <div className="text-xs text-slate-500 font-medium">Total Hours</div>
                <div className="text-2xl font-bold text-slate-800 mt-1">{getTotalHours()}h</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
                <div className="text-xs text-slate-500 font-medium">Tickets Tracked</div>
                <div className="text-2xl font-bold text-slate-800 mt-1">{ticketHours.length}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-5">
                <div className="text-xs text-slate-500 font-medium">Avg / Ticket</div>
                <div className="text-2xl font-bold text-slate-800 mt-1">
                  {ticketHours.length
                    ? (ticketHours.reduce((s,t)=>s+t.hours,0)/ticketHours.length).toFixed(2)
                    : '0.00'}h
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-10">
              <div className="rounded-2xl border border-slate-200/60 bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Hours by Ticket</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ticketHours}>
                      <XAxis dataKey="name" tick={{ fontSize:11 }} />
                      <YAxis />
                      <RTooltip />
                      <Legend />
                      <Bar dataKey="hours" fill="#6366F1" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/60 bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Top Tickets Share</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topTickets}
                        dataKey="hours"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {topTickets.map((_,i)=>(
                          <Cell key={i} fill={pieColors[i % pieColors.length]} />
                        ))}
                      </Pie>
                      <RTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Hours Per Day (This Month)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayHoursChart}>
                    <XAxis dataKey="day" />
                    <YAxis />
                    <RTooltip />
                    <Bar dataKey="hours" fill="#10B981" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}