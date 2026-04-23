/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Mail, 
  User, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  ChevronRight, 
  Loader2,
  LayoutDashboard,
  Users,
  Database,
  CloudUpload,
  Fingerprint
} from 'lucide-react';

type ViewMode = 'guest' | 'admin';

export default function App() {
  const [view, setView] = useState<ViewMode>('guest');
  const [email, setEmail] = useState('');
  const [checkResult, setCheckResult] = useState<{ found: boolean; name?: string } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importCount, setImportCount] = useState<number | null>(null);
  const [sheetId, setSheetId] = useState('');
  const [lastSync, setLastSync] = useState<string | null>(null);

  React.useEffect(() => {
    // Fetch current status from server on load
    fetch('/api/admin/status')
      .then(res => res.json())
      .then(data => {
        if (data.count > 0) {
          setImportCount(data.count);
        }
        if (data.sheetId) {
          setSheetId(data.sheetId);
        }
        if (data.lastSync) {
          setLastSync(data.lastSync);
        }
      })
      .catch(err => console.error('Failed to fetch status', err));
  }, []);

  const handleSheetSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetId) return;

    setIsImporting(true);
    try {
      const saveResp = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId }),
      });
      const result = await saveResp.json();
      if (result.success) {
        setImportCount(result.count);
        setLastSync(result.lastSync);
        alert(`${result.count} entries successfully synchronized!`);
      }
    } catch (error) {
      console.error('Sync failed', error);
      alert('Failed to sync from Google Sheet.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsChecking(true);
    try {
      const resp = await fetch(`/api/guest/check?email=${encodeURIComponent(email)}`);
      const data = await resp.json();
      setCheckResult(data);
    } catch (err) {
      console.error('Check failed', err);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-800">
      {/* Sidebar - Inspired by Professional Polish Aside */}
      <aside className="w-64 bg-[#202124] flex flex-col text-white shadow-xl hidden md:flex fixed h-full z-50">
        <div className="p-6 border-b border-white/5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                <div className="w-2 h-2 rounded-full bg-[#4285F4]"></div>
                <div className="w-2 h-2 rounded-full bg-[#EA4335]"></div>
                <div className="w-2 h-2 rounded-full bg-[#FBBC04]"></div>
                <div className="w-2 h-2 rounded-full bg-[#34A853]"></div>
              </div>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Community</span>
            </div>
            <h1 className="text-xl font-bold tracking-tighter">
              GDG <span className="text-white/60 font-light">Bacolod</span>
            </h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setView('guest')}
            className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 transition-all ${
              view === 'guest' ? 'bg-[#4285F4]/10 text-[#4285F4]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutDashboard size={18} />
            Guest Entry
          </button>
          <button
            onClick={() => setView('admin')}
            className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 transition-all ${
              view === 'admin' ? 'bg-[#EA4335]/10 text-[#EA4335]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <ShieldCheck size={18} />
            Management
          </button>
          
          <div className="pt-4 mt-4 border-t border-slate-800">
            <div className="px-4 py-2 text-xs text-slate-500 flex items-center gap-2">
              <Users size={14} /> Registered: {importCount || 0}
            </div>
            <div className="px-4 py-2 text-xs text-slate-500 flex items-center gap-2">
              <Database size={14} /> Database Online
            </div>
          </div>
        </nav>
        
        <div className="p-6 mt-auto text-xs text-slate-500 border-t border-slate-800 flex items-center justify-between">
          <span>System Status</span>
          <span className="text-emerald-500 font-bold uppercase tracking-tighter">Online</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:ml-64">
        {/* Header - Inspired by Professional Polish Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm sticky top-0 z-40">
          <h2 className="text-sm font-medium uppercase tracking-widest text-slate-500">
            Registry Control Panel
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold">Active Session</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-tighter">System-Guest-Auth</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
              <User size={16} className="text-slate-500" />
            </div>
          </div>
        </header>

        {/* Content - Matches the split or focused layout behavior */}
        <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {view === 'guest' ? (
              <motion.div
                key="guest"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto space-y-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900">Guest Experience</h3>
                  <span className="px-2 py-1 bg-slate-200 text-slate-600 text-[10px] font-bold rounded uppercase">Active Portal</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col">
                  <div className="bg-slate-50 p-6 sm:p-8 border-b border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                       <span className="px-2 py-0.5 bg-[#4285F4]/10 text-[#4285F4] text-[10px] font-bold rounded uppercase tracking-widest border border-[#4285F4]/20">Verified Event</span>
                    </div>
                    <h4 className="text-xl font-bold text-slate-800">Check-in Terminal</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Please enter your registration email to verify your attendance for the <span className="text-slate-600 font-semibold underline decoration-[#FBBC04] underline-offset-2">GDG Bacolod Event</span>.
                    </p>
                  </div>

                  <div className="p-6 sm:p-10 space-y-8">
                    <form onSubmit={handleCheckEmail} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                          Attendee Email Identifier
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                            <Mail size={16} />
                          </div>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. attendee@gdgbacolod.com"
                            required
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-[#4285F4]/10 focus:border-[#4285F4] transition-all placeholder:text-slate-300"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isChecking}
                        className="w-full py-4 bg-[#4285F4] text-white font-bold rounded-lg shadow-lg shadow-[#4285F4]/20 hover:bg-[#3367D6] transition-all active:scale-[0.98] disabled:bg-slate-300 disabled:shadow-none flex items-center justify-center gap-2"
                      >
                        {isChecking ? <Loader2 size={20} className="animate-spin" /> : "Confirm Attendance"}
                      </button>
                    </form>

                    {checkResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-8 border-t border-slate-100"
                      >
                        {checkResult.found ? (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200 shrink-0">
                              <CheckCircle2 size={24} className="text-white" />
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Verification Successful</p>
                              <p className="text-lg font-bold text-slate-800 leading-tight">Welcome back, {checkResult.name}</p>
                              <p className="text-xs text-slate-400 mt-0.5 italic">Access credentials granted for this session.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-red-50 border border-red-100 rounded-lg p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-200 shrink-0">
                              <XCircle size={24} className="text-white" />
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-red-600 tracking-wider">Entry Denied</p>
                              <p className="text-lg font-bold text-slate-800 leading-tight italic">Registry: Sorry, Unavailable</p>
                              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                                Identified email was not matched in the current active directory.
                              </p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>

                  <div className="p-4 text-center border-t border-slate-50 bg-slate-50/50">
                    <p className="text-[9px] text-slate-300 font-medium uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                      <Fingerprint size={10} /> Encrypted Identity Verification System
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900">Event Management</h3>
                    <p className="text-sm text-slate-500">Registry control and attendee ingestion unit.</p>
                  </div>
                  <span className="px-2 py-1 bg-[#EA4335]/10 text-[#EA4335] text-[10px] font-bold rounded uppercase border border-[#EA4335]/20">Restricted Access</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Import Section */}
                  <div className="md:col-span-2 space-y-6">
                    <form onSubmit={handleSheetSync} className="bg-white border-2 border-slate-200 rounded-xl p-8 space-y-6 shadow-sm">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-[#4285F4]/10 rounded-xl flex items-center justify-center text-[#4285F4]">
                          <Database size={24} />
                        </div>
                        <div>
                          <p className="text-base font-bold text-slate-700">Auto-Sync Dashboard</p>
                          <p className="text-xs text-slate-400">Registry updates automatically every 15 minutes.</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                          Google Spreadsheet ID
                        </label>
                        <input
                          type="text"
                          value={sheetId}
                          onChange={(e) => setSheetId(e.target.value)}
                          placeholder="e.g. 1AbC_DeFgHiJkLmNoPqRsTuVwXyZ"
                          required
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-[#4285F4]/10 focus:border-[#4285F4] transition-all"
                        />
                        <div className="flex justify-between items-center mt-2 px-1">
                          <p className="text-[10px] text-slate-400 italic">
                            Status: <span className="text-[#34A853] font-bold">Enabled</span>
                          </p>
                          {lastSync && (
                            <p className="text-[10px] text-slate-400">
                              Last Sync: <span className="font-medium text-slate-600">{new Date(lastSync).toLocaleTimeString()}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <button 
                        type="submit"
                        disabled={isImporting}
                        className="w-full py-3 bg-[#4285F4] text-white text-xs font-bold rounded-lg shadow-lg hover:bg-[#3367D6] transition-all active:scale-[0.98] disabled:bg-slate-300 flex items-center justify-center gap-2"
                      >
                        {isImporting ? <Loader2 size={16} className="animate-spin" /> : <CloudUpload size={16} />}
                        {isImporting ? "Synchronizing..." : "Trigger Manual Sync"}
                      </button>
                    </form>

                    {importCount !== null && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 bg-slate-900 text-white rounded-xl flex items-center justify-between border-l-4 border-[#34A853] shadow-xl shadow-slate-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-[#34A853]/10 rounded-lg">
                            <Database size={24} className="text-[#34A853]" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">Database Synchronized</p>
                            <p className="text-slate-400 text-xs">{importCount} verified attendees loaded</p>
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-[#34A853]/20 text-[#34A853] rounded text-[10px] font-bold tracking-widest uppercase">
                          Stored
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Sidebar Stats Area */}
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Live Overview</h4>
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-slate-900">{importCount || 0}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">Guests</p>
                          </div>
                          <Users size={18} className="text-slate-300" />
                        </div>
                        <div className="p-4 bg-[#FBBC04]/10 rounded-lg border border-[#FBBC04]/20 flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-[#FBBC04]">99%</p>
                            <p className="text-[10px] text-[#FBBC04] uppercase font-semibold tracking-wide">Capacity</p>
                          </div>
                          <Fingerprint size={18} className="text-[#FBBC04]" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800 text-white p-6 rounded-xl space-y-4">
                      <div className="flex items-center gap-2 text-[#FBBC04]">
                        <ShieldCheck size={16} />
                        <h5 className="text-xs font-bold uppercase tracking-widest">Protocol Sync</h5>
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 space-y-1">
                        <p>&gt; load_from_guests_json</p>
                        <p>&gt; schedule_auto_sync (15m)</p>
                        {lastSync && <p className="text-[#34A853]">&gt; last_sync: {new Date(lastSync).toLocaleTimeString()}</p>}
                        <p className="text-[#34A853]">&gt; status: persistent</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <CloudUpload size={18} className="text-[#4285F4]" />
                    <h4 className="font-bold text-xs text-slate-700 uppercase tracking-widest">Instant Cloud Sync (Optional)</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tired of waiting 15 minutes? Add this script to your Google Sheet to trigger an <span className="font-bold text-[#34A853]">Instant Sync</span> whenever you update a row.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-white border border-slate-200 rounded-lg">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Your Webhook URL</p>
                      <code className="text-[10px] text-[#4285F4] break-all">
                        {window.location.origin}/api/webhook/sync
                      </code>
                    </div>

                    <div className="space-y-2">
                       <p className="text-[10px] font-bold text-slate-600">How to set up:</p>
                       <ol className="text-[10px] text-slate-500 list-decimal ml-4 space-y-1">
                         <li>In your Google Sheet, go to <b>Extensions</b> &gt; <b>Apps Script</b>.</li>
                         <li>Paste this code: <code>function onEdit() {"{"} UrlFetchApp.fetch("{window.location.origin}/api/webhook/sync", {"{"}method: "post"{"}"}) {"}"}</code></li>
                         <li>Click <b>Save</b> and your sheet is now LIVE!</li>
                       </ol>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-xs text-slate-500 uppercase tracking-widest mb-4">Required Data Schema</h4>
                  <div className="font-mono text-xs text-slate-400 bg-white p-6 rounded-lg border border-slate-200 overflow-x-auto shadow-inner leading-relaxed">
                    <span className="text-slate-800 font-bold">name,email</span><br/>
                    Alexander Sterling,alex@enterprise.com<br/>
                    Sarah Jenkins,s.jenkins@globex.tld
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer / Mobile Nav - keeping it simple */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 md:hidden flex justify-center z-50 pointer-events-none">
        <div className="px-6 py-2 bg-slate-900 text-white rounded-full border border-slate-800 text-[10px] uppercase tracking-widest font-bold shadow-2xl pointer-events-auto flex gap-6">
          <button onClick={() => setView('guest')} className={view === 'guest' ? 'text-emerald-400' : ''}>Guest</button>
          <div className="w-[1px] bg-slate-700"></div>
          <button onClick={() => setView('admin')} className={view === 'admin' ? 'text-emerald-400' : ''}>Admin</button>
        </div>
      </footer>
    </div>
  );
}


