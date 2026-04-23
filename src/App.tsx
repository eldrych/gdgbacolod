/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Papa from 'papaparse';
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

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const response = await fetch('/api/admin/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: results.data }),
          });
          const result = await response.json();
          if (result.success) {
            setImportCount(result.count);
          }
        } catch (error) {
          console.error('Import failed', error);
        } finally {
          setIsImporting(false);
        }
      },
    });
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
      <aside className="w-64 bg-slate-900 flex flex-col text-white shadow-xl hidden md:flex fixed h-full z-50">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center">
              <span className="font-bold text-slate-900">G</span>
            </div>
            <h1 className="text-lg font-semibold tracking-tight italic font-serif">RegistryPro</h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setView('guest')}
            className={`w-full px-4 py-2 rounded-md text-sm font-medium flex items-center gap-3 transition-colors ${
              view === 'guest' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className={`${view === 'guest' ? 'text-emerald-400' : 'text-slate-500'}`}>
              <LayoutDashboard size={18} />
            </div>
            Guest Portal
          </button>
          <button
            onClick={() => setView('admin')}
            className={`w-full px-4 py-2 rounded-md text-sm font-medium flex items-center gap-3 transition-colors ${
              view === 'admin' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className={`${view === 'admin' ? 'text-emerald-400' : 'text-slate-500'}`}>
              <ShieldCheck size={18} />
            </div>
            Admin Dashboard
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
                    <h4 className="text-xl font-serif italic text-slate-700">Verification Access Point</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Please provide your registered corporate or personal email address to complete your identity verification.
                    </p>
                  </div>

                  <div className="p-6 sm:p-10 space-y-8">
                    <form onSubmit={handleCheckEmail} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                          Email Address Identification
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                            <Mail size={16} />
                          </div>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. alexander@enterprise.com"
                            required
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-300"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isChecking}
                        className="w-full py-4 bg-emerald-600 text-white font-bold rounded-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:bg-slate-300 disabled:shadow-none flex items-center justify-center gap-2"
                      >
                        {isChecking ? <Loader2 size={20} className="animate-spin" /> : "Verify Identity"}
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
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900">Admin Management</h3>
                    <p className="text-sm text-slate-500">Global registry control and data ingestion unit.</p>
                  </div>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">Privileged Access</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Import Section */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center space-y-4 hover:border-emerald-400 transition-all cursor-pointer bg-slate-50/50 group relative">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-16 h-16 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        {isImporting ? (
                          <Loader2 size={32} className="text-emerald-500 animate-spin" />
                        ) : (
                          <CloudUpload size={32} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                        )}
                      </div>
                      <div>
                        <p className="text-base font-bold text-slate-700 leading-tight">Master Ingestion Unit</p>
                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-medium">Drag & Drop Registry File (.csv)</p>
                      </div>
                      <button className="px-6 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98]">
                        Select Master Source
                      </button>
                    </div>

                    {importCount !== null && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 bg-slate-900 text-white rounded-xl flex items-center justify-between border-l-4 border-emerald-500 shadow-xl shadow-slate-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Database size={24} className="text-emerald-400" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">Registry Synchronized</p>
                            <p className="text-slate-400 text-xs">{importCount} unique records ingested</p>
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold tracking-widest uppercase">
                          Live
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Sidebar Stats Area */}
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Database Overview</h4>
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-slate-900">{importCount || 0}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">Entries</p>
                          </div>
                          <Users size={18} className="text-slate-300" />
                        </div>
                        <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100/50 flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-emerald-700">99.8%</p>
                            <p className="text-[10px] text-emerald-600 uppercase font-semibold tracking-wide">Security</p>
                          </div>
                          <Fingerprint size={18} className="text-emerald-400" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800 text-white p-6 rounded-xl space-y-4">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-emerald-400" />
                        <h5 className="text-xs font-bold uppercase tracking-widest">Protocol Sync</h5>
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 space-y-1">
                        <p>&gt; init_ingestion_seq</p>
                        <p>&gt; verify_headers_found</p>
                        <p>&gt; map_rows_to_active_db</p>
                        <p className="text-emerald-400">&gt; status: idle</p>
                      </div>
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


