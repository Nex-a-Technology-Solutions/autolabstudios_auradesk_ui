import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const TogglDashboard = () => {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("start_desc"); // start_desc | duration_desc | duration_asc
  const [onlyRunning, setOnlyRunning] = useState(false);

  // CRUD UI state
  const [newDesc, setNewDesc] = useState("");
  const [newProject, setNewProject] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingDesc, setEditingDesc] = useState("");
  const [editingProject, setEditingProject] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // now tick to drive live durations; updated only when there's a running entry
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // initial fetch and periodic backend polling every 15s
    fetchAll();
    const iv = setInterval(() => {
      fetchAll();
    }, 15000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // per-second tick only while there are running timers to avoid unnecessary rerenders
  useEffect(() => {
    const hasRunning = entries.some((e) => !e.stop);
    if (!hasRunning) return;
    const tiv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tiv);
  }, [entries]);

  async function fetchAll() {
    setLoading(true);
    setError("");
    try {
      const [userRes, entriesRes] = await Promise.all([
        axios.get("http://localhost:5000/api/toggl/me"),
        axios.get("http://localhost:5000/api/toggl/entries"),
      ]);
      setUser(userRes.data);
      setEntries(entriesRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch Toggl data from backend.");
    } finally {
      setLoading(false);
    }
  }

  const formatDuration = (ms) => {
    if (ms == null) return "-";
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h > 0 ? `${h}h ` : ""}${m}m ${s}s`;
  };

  const entryDurationMs = (entry) => {
    if (!entry) return 0;
    if (!entry.stop) return now - new Date(entry.start).getTime();
    return new Date(entry.stop).getTime() - new Date(entry.start).getTime();
  };

  const filtered = useMemo(() => {
    let out = entries.slice();

    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (e) =>
          (e.description || "").toLowerCase().includes(q) ||
          (e.project || "").toLowerCase().includes(q)
      );
    }

    if (onlyRunning) {
      out = out.filter((e) => !e.stop);
    }

    out.sort((a, b) => {
      if (sortBy === "start_desc") {
        return new Date(b.start) - new Date(a.start);
      }
      const da = entryDurationMs(a);
      const db = entryDurationMs(b);
      if (sortBy === "duration_desc") return db - da;
      if (sortBy === "duration_asc") return da - db;
      return 0;
    });

    return out;
  }, [entries, query, sortBy, onlyRunning, now]);

  const totalMs = useMemo(() => {
    return filtered.reduce((sum, e) => sum + entryDurationMs(e), 0);
  }, [filtered, now]);

  // CRUD operations (assumes backend endpoints)
  async function createEntry({ description, project }) {
    setCreating(true);
    setError("");
    try {
      // start a new running timer
      await axios.post("http://localhost:5000/api/toggl/entries", {
        description,
        project,
      });
      setNewDesc("");
      setNewProject("");
      await fetchAll();
    } catch (err) {
      console.error(err);
      setError("Failed to create entry.");
    } finally {
      setCreating(false);
    }
  }

  async function stopEntry(entryId) {
    setError("");
    try {
      await axios.post(`http://localhost:5000/api/toggl/entries/${entryId}/stop`);
      await fetchAll();
    } catch (err) {
      console.error(err);
      setError("Failed to stop entry.");
    }
  }

  async function updateEntry(entryId, { description, project }) {
    setSavingEdit(true);
    setError("");
    try {
      await axios.put(`http://localhost:5000/api/toggl/entries/${entryId}`, {
        description,
        project,
      });
      setEditingId(null);
      await fetchAll();
    } catch (err) {
      console.error(err);
      setError("Failed to update entry.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteEntry(entryId) {
    setError("");
    if (!window.confirm("Delete this entry? This cannot be undone.")) return;
    try {
      await axios.delete(`http://localhost:5000/api/toggl/entries/${entryId}`);
      await fetchAll();
    } catch (err) {
      console.error(err);
      setError("Failed to delete entry.");
    }
  }

  if (loading) return <div className="text-center mt-10 text-gray-500">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-blue-600">Toggl Dashboard</h1>
          {user && <p className="text-sm text-gray-500">{user.fullname} — {user.email}</p>}
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-600">Total (visible):</div>
          <div className="text-xl font-semibold">{formatDuration(totalMs)}</div>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white p-4 rounded-lg shadow">
          {/* Create / Start new timer */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <input
              aria-label="New description"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description"
              className="col-span-2 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <input
              aria-label="New project"
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              placeholder="Project (optional)"
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <div className="col-span-3 flex gap-2 mt-2">
              <button
                onClick={() => createEntry({ description: newDesc, project: newProject })}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                disabled={creating || !newDesc.trim()}
                title="Start a new running timer"
              >
                {creating ? "Starting..." : "Start"}
              </button>
              <button
                onClick={() => {
                  // quick-add a stopped entry: POST with explicit stop (backend must support)
                  (async () => {
                    setCreating(true);
                    try {
                      await axios.post("http://localhost:5000/api/toggl/entries", {
                        description: newDesc,
                        project: newProject,
                        stopNow: true,
                      });
                      setNewDesc("");
                      setNewProject("");
                      await fetchAll();
                    } catch (err) {
                      console.error(err);
                      setError("Failed to add entry.");
                    } finally {
                      setCreating(false);
                    }
                  })();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={creating || !newDesc.trim()}
                title="Add a completed (stopped) entry"
              >
                Add (stopped)
              </button>

              <div className="ml-auto flex items-center gap-2">
                <input
                  aria-label="Search entries"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search description or project..."
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <button
                  onClick={() =>
                    setSortBy((s) =>
                      s === "start_desc" ? "duration_desc" : s === "duration_desc" ? "duration_asc" : "start_desc"
                    )
                  }
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  title="Toggle sort (start → duration desc → duration asc)"
                >
                  Sort
                </button>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={onlyRunning}
                    onChange={(e) => setOnlyRunning(e.target.checked)}
                    className="form-checkbox h-4 w-4"
                  />
                  Only running
                </label>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-gray-500">No entries found.</div>
            ) : (
              filtered.map((entry) => {
                const durMs = entryDurationMs(entry);
                const running = !entry.stop;
                const project = entry.project || null;

                return (
                  <article key={entry.id} className="py-3 flex items-start gap-4">
                    <div className="w-2">
                      <div
                        className={`h-full rounded ${project ? "" : "bg-gray-200"}`}
                        style={{
                          width: 6,
                          borderRadius: 6,
                          backgroundColor: project ? stringToHexColor(project) : "#e5e7eb",
                        }}
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                          {editingId === entry.id ? (
                            <div>
                              <input
                                value={editingDesc}
                                onChange={(e) => setEditingDesc(e.target.value)}
                                className="w-full px-2 py-1 border rounded mb-2"
                              />
                              <input
                                value={editingProject}
                                onChange={(e) => setEditingProject(e.target.value)}
                                className="w-full px-2 py-1 border rounded mb-2"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => updateEntry(entry.id, { description: editingDesc, project: editingProject })}
                                  className="px-3 py-1 bg-blue-600 text-white rounded"
                                  disabled={savingEdit}
                                >
                                  {savingEdit ? "Saving..." : "Save"}
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="px-3 py-1 bg-gray-200 rounded"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-medium text-gray-800">
                                {entry.description || <span className="text-gray-400">No description</span>}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                {project && (
                                  <span
                                    className="px-2 py-0.5 rounded text-xs font-medium text-white"
                                    style={{ backgroundColor: stringToHexColor(project) }}
                                  >
                                    {project}
                                  </span>
                                )}
                                <span className="truncate">
                                  {new Date(entry.start).toLocaleString()} —{" "}
                                  {entry.stop ? new Date(entry.stop).toLocaleString() : "Running"}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                          {running ? (
                            <div className="inline-flex items-center gap-2">
                              <span className="text-sm font-medium text-green-600">{formatDuration(durMs)}</span>
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Running</span>
                            </div>
                          ) : (
                            <div className="text-sm font-medium text-gray-700">{formatDuration(durMs)}</div>
                          )}

                          <div className="flex gap-2 mt-2">
                            {running ? (
                              <button
                                onClick={() => stopEntry(entry.id)}
                                className="px-2 py-1 bg-yellow-500 text-white rounded text-xs"
                              >
                                Stop
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  // Start a new timer using this entry's description/project
                                  createEntry({ description: entry.description || "", project: entry.project || "" });
                                }}
                                className="px-2 py-1 bg-green-500 text-white rounded text-xs"
                                title="Start a new timer with this description/project"
                              >
                                Start
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setEditingId(entry.id);
                                setEditingDesc(entry.description || "");
                                setEditingProject(entry.project || "");
                              }}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => deleteEntry(entry.id)}
                              className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="h-2 bg-gray-100 rounded overflow-hidden">
                          <div
                            className="h-full"
                            style={{
                              width: `${Math.min(100, Math.round((durMs / (1000 * 60 * 60)) * 10))}%`,
                              backgroundColor: project ? stringToHexColor(project) : "#9ca3af",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        <aside className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Overview</h4>
          <div className="text-sm text-gray-600 mb-4">
            <div className="flex justify-between"><span>Entries</span><span className="font-medium">{filtered.length}</span></div>
            <div className="flex justify-between"><span>Running</span><span className="font-medium">{entries.filter(e => !e.stop).length}</span></div>
            <div className="flex justify-between"><span>Visible total</span><span className="font-medium">{formatDuration(totalMs)}</span></div>
          </div>

          <h5 className="text-sm font-semibold text-gray-700 mb-2">Recent activity</h5>
          <div className="space-y-2">
            {entries.slice(0, 6).map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm text-gray-600">
                <div className="truncate">{e.description || "No description"}</div>
                <div className="ml-3 text-xs text-gray-500">{formatDuration(entryDurationMs(e))}</div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
};

export default TogglDashboard;

/* Utility: deterministic color from string (kept in-component for simplicity) */
function stringToHexColor(str) {
  if (!str) return "#9ca3af";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return `#${"00000".substring(0, 6 - c.length)}${c}`;
}
