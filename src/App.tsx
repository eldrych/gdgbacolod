/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
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
  Download,
  Fingerprint,
  Award
} from 'lucide-react';

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const [email, setEmail] = useState('');
  const [checkResult, setCheckResult] = useState<{ found: boolean; name?: string } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [importCount, setImportCount] = useState<number | null>(null);
  const [sheetId, setSheetId] = useState('');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const location = useLocation();
  const isAdminView = location.pathname === '/administrator-access';

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

  const generateCertificateBuffer = (name: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = "/certificate_template.png";
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No context');

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const centerX = canvas.width / 2;
        const centerY = canvas.height * 0.485;
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000000';

        let fontSize = 90;
        const maxWidth = canvas.width * 0.7;
        ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
        
        while (ctx.measureText(name.toUpperCase()).width > maxWidth && fontSize > 40) {
          fontSize -= 5;
          ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
        }

        ctx.fillText(name.toUpperCase(), centerX, centerY);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => reject('Failed to load template');
    });
  };

  const handlePreview = async (name: string) => {
    setIsGenerating(true);
    try {
      const dataUrl = await generateCertificateBuffer(name);
      setPreviewData(dataUrl);
      setIsPreviewOpen(true);
    } catch (e) {
      alert("Certificate template not found. Please ensure the template image is uploaded to the public folder.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCertificate = async (name: string) => {
    setIsGenerating(true);
    try {
      const dataUrl = previewData || await generateCertificateBuffer(name);
      const link = document.createElement('a');
      link.download = `Certificate_${name.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
       alert("Certificate template not found. Please ensure the template image is uploaded to the public folder.");
    } finally {
      setIsGenerating(false);
    }
  };

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
    <div className={`flex min-h-screen ${isAdminView ? 'bg-slate-100' : 'bg-[#050508] relative overflow-hidden'} font-sans text-slate-800`}>
      {/* Space Background Elements - Only for Guest */}
      {!isAdminView && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Animated glows */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#4285F4]/10 blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#EA4335]/10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          <div className="stars-container absolute inset-0 opacity-40">
            {[...Array(80)].map((_, i) => (
              <div 
                key={i} 
                className="absolute bg-white rounded-full"
                style={{
                   width: Math.random() * 2 + 'px',
                   height: Math.random() * 2 + 'px',
                   top: Math.random() * 100 + '%',
                   left: Math.random() * 100 + '%',
                   opacity: Math.random() * 0.7 + 0.3,
                   boxShadow: Math.random() > 0.8 ? '0 0 4px 1px rgba(255,255,255,0.8)' : 'none',
                   '--duration': (Math.random() * 4 + 2) + 's',
                   '--delay': (Math.random() * 5) + 's'
                } as any}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sidebar - Only for Admin */}
      {isAdminView && (
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
            <NavLink
              to="/"
              end
              className={({ isActive }) => `w-full px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 transition-all ${
                isActive ? 'bg-[#4285F4]/10 text-[#4285F4]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <LayoutDashboard size={18} />
              Guest Entry
            </NavLink>
            
            <NavLink
              to="/administrator-access"
              className={({ isActive }) => `w-full px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 transition-all ${
                isActive ? 'bg-[#EA4335]/10 text-[#EA4335]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <ShieldCheck size={18} />
              Management
            </NavLink>
            
            <div className="pt-4 mt-4 border-t border-slate-800">
              <div className="px-4 py-2 text-xs text-slate-500 flex items-center gap-2">
                <Users size={14} /> Registered: {importCount || 0}
              </div>
            </div>
          </nav>
        </aside>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col relative z-10 ${isAdminView ? 'md:ml-64' : ''}`}>
        {/* Branding Logo - Top Center for Guests */}
        {!isAdminView && (
          <div className="flex justify-center pt-16 pb-4 px-8">
            <img 
              src="/gdgbcd_logo.png" 
              alt="GDG Bacolod Logo" 
              className="h-28 md:h-36 object-contain drop-shadow-[0_0_25px_rgba(66,133,244,0.4)] transition-transform hover:scale-105 duration-700" 
            />
          </div>
        )}

        {/* Header - Only for Admin */}
        {isAdminView && (
          <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm sticky top-0 z-40">
            <h2 className="text-sm font-medium uppercase tracking-widest text-slate-500">
              Registry Control Panel
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <User size={16} className="text-slate-500" />
              </div>
            </div>
          </header>
        )}

        {/* Content */}
        <div className={`flex-1 p-6 md:p-10 ${!isAdminView ? 'flex items-center justify-center' : 'max-w-5xl mx-auto w-full'}`}>
          <Routes>
            <Route path="/" element={
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl w-full space-y-8"
              >
                <div className={`overflow-hidden flex flex-col transition-all duration-700 ${
                  isAdminView 
                    ? 'bg-white border border-slate-100 rounded-2xl shadow-xl' 
                    : 'bg-white/5 backdrop-blur-[32px] border border-white/10 rounded-[3rem] shadow-[0_0_100px_-20px_rgba(66,133,244,0.1)] ring-1 ring-white/10'
                }`}>
                  <div className={`p-8 sm:p-12 border-b text-center ${isAdminView ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'}`}>
                    <h4 className={`text-2xl font-bold tracking-tight ${isAdminView ? 'text-slate-900' : 'text-white'}`}>
                      {isAdminView ? 'Certificate Portal' : 'Verification Terminal'}
                    </h4>
                    <p className={`text-sm mt-3 font-black tracking-[0.2em] ${isAdminView ? 'text-slate-500' : 'text-blue-200/70'}`}>
                      BUILD WITH AI 2026
                    </p>
                  </div>

                  <div className="p-8 sm:p-12 space-y-8">
                    {!checkResult ? (
                      <form onSubmit={handleCheckEmail} className="space-y-8">
                        <div className="space-y-4">
                          <label className={`text-[11px] font-bold uppercase tracking-[0.4em] ml-1 ${isAdminView ? 'text-slate-400' : 'text-white/40'}`}>
                            Registration Email
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isAdminView ? 'text-slate-400 group-focus-within:text-[#4285F4]' : 'text-white/20 group-focus-within:text-[#4285F4] group-focus-within:bg-white/5'}`}>
                                 <Mail size={22} />
                               </div>
                            </div>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="verify@event.com"
                              required
                              className={`w-full pl-16 pr-6 py-6 rounded-2xl text-lg transition-all focus:outline-none focus:ring-4 ${
                                isAdminView 
                                  ? 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-[#4285F4]/10 focus:border-[#4285F4] placeholder:text-slate-300' 
                                  : 'bg-white/5 border-white/10 text-white focus:ring-[#4285F4]/20 focus:border-[#4285F4] placeholder:text-white/10'
                              }`}
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={isChecking}
                          className={`w-full py-6 font-bold rounded-2xl shadow-2xl transition-all active:scale-[0.98] disabled:bg-slate-800 disabled:text-white/20 disabled:shadow-none flex items-center justify-center gap-3 text-lg shining-btn-effect ${
                            isAdminView 
                              ? 'bg-[#4285F4] text-white hover:bg-[#3367D6] shadow-[#4285F4]/20' 
                              : 'bg-gradient-to-r from-slate-200 via-white to-slate-200 text-slate-900 border border-white/50 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:brightness-110 active:brightness-90 transition-all duration-500'
                          }`}
                        >
                          {isChecking ? <Loader2 size={26} className="animate-spin" /> : "Initiate Verification"}
                        </button>
                      </form>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-12"
                      >
                        {checkResult.found ? (
                          <div className="text-center space-y-8">
                            <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full mb-2 ${isAdminView ? 'bg-emerald-50 text-emerald-500' : 'bg-emerald-500/10 text-emerald-400 ring-2 ring-emerald-500/20'}`}>
                              <CheckCircle2 size={56} strokeWidth={2} />
                            </div>
                            <div className="space-y-4">
                              <h5 className={`text-3xl font-black tracking-tight ${isAdminView ? 'text-slate-900' : 'text-white'}`}>
                                Attendance Verified
                              </h5>
                              <p className={`text-base leading-relaxed ${isAdminView ? 'text-slate-500' : 'text-white/70'}`}>
                                <span className="font-bold text-white text-lg block mb-2">{checkResult.name}</span>
                                You are confirmed for <span className="text-blue-200 font-bold">Build With AI 2026</span>. Your recognition is ready for collection.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4">
                              <button
                                onClick={() => handlePreview(checkResult.name!)}
                                disabled={isGenerating}
                                className={`flex items-center justify-center gap-3 py-5 px-6 font-bold rounded-2xl transition-all disabled:opacity-50 shining-btn-effect ${
                                  isAdminView ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-white/10 text-white hover:bg-white/20 ring-1 ring-white/10'
                                }`}
                              >
                                {isGenerating ? <Loader2 size={22} className="animate-spin" /> : <Award size={22} />}
                                Preview
                              </button>
                              <button
                                onClick={() => downloadCertificate(checkResult.name!)}
                                disabled={isGenerating}
                                className={`flex items-center justify-center gap-3 py-5 px-6 font-bold rounded-2xl shadow-2xl transition-all disabled:opacity-50 shining-btn-effect ${
                                  isAdminView ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-gradient-to-r from-slate-100 via-white to-slate-100 text-slate-900 border border-white/50 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]'
                                }`}
                              >
                                {isGenerating ? <Loader2 size={22} className="animate-spin" /> : <Download size={22} />}
                                GET PNG
                              </button>
                            </div>
                            
                            <button 
                              onClick={() => { setCheckResult(null); setEmail(''); setPreviewData(null); }}
                              className="text-[10px] font-black text-blue-200/40 uppercase tracking-[0.5em] hover:text-white/80 transition-colors pt-6 block w-full"
                            >
                              NEW VERIFICATION
                            </button>
                          </div>
                        ) : (
                          <div className="text-center space-y-8">
                            <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full mb-2 ${isAdminView ? 'bg-red-50 text-red-500' : 'bg-red-500/10 text-red-400 ring-2 ring-red-500/20'}`}>
                              <XCircle size={56} strokeWidth={2} />
                            </div>
                            <div className="space-y-4">
                              <h5 className={`text-2xl font-black ${isAdminView ? 'text-slate-900' : 'text-white'}`}>No Entry Record</h5>
                              <p className={`text-base ${isAdminView ? 'text-slate-500' : 'text-white/50'}`}>
                                Email <span className="text-white/80 italic">{email}</span> was not identified for the Build With AI 2026 event.
                              </p>
                            </div>
                            <button
                              onClick={() => { setCheckResult(null); setEmail(''); }}
                              className={`w-full py-5 font-bold rounded-2xl transition-all shining-btn-effect ${isAdminView ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-gradient-to-r from-slate-200/80 via-white/90 to-slate-200/80 text-slate-900 shadow-xl'}`}
                            >
                              RETRY IDENTIFICATION
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )
}
                  </div>
                </div>

                <p className={`text-center text-[10px] font-black uppercase tracking-[0.6em] pt-6 ${isAdminView ? 'text-slate-300' : 'text-white/10'}`}>
                  © 2026 GDG BACOLOD COMMUNITY
                </p>
              </motion.div>
            } />
            
            <Route path="/administrator-access" element={
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
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

                    <div className="space-y-3">
                       <p className="text-[10px] font-bold text-slate-600">How to set up (Critical):</p>
                       <ol className="text-[10px] text-slate-500 list-decimal ml-4 space-y-1">
                         <li>In your Google Sheet, go to <b>Extensions</b> &gt; <b>Apps Script</b>.</li>
                         <li>Paste this code: <code>function triggerSync() {"{"} UrlFetchApp.fetch("{window.location.origin}/api/webhook/sync", {"{"}method: "post"{"}"}) {"}"}</code></li>
                         <li>Click the <b>Clock icon (Triggers)</b> on the left sidebar.</li>
                         <li>Click <b>+ Add Trigger</b>.</li>
                         <li>Set "Choose which function to run" to <b>triggerSync</b>.</li>
                         <li>Set "Select event type" to <b>On edit</b>.</li>
                         <li>Click <b>Save</b> (you'll need to authorize it).</li>
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
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      {/* Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && previewData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPreviewOpen(false)}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Certificate Preview</h3>
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <XCircle size={20} className="text-slate-400" />
                </button>
              </div>
              <div className="p-6 bg-slate-50 flex items-center justify-center overflow-auto max-h-[70vh]">
                <img src={previewData} alt="Certificate Preview" className="max-w-full h-auto shadow-lg rounded" />
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-4">
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-6 py-2 text-slate-500 font-bold hover:text-slate-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => checkResult?.name && downloadCertificate(checkResult.name)}
                  className="px-8 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  <Download size={18} />
                  Download PNG
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer / Mobile Nav - removed admin toggles for guest view */}
      {isAdminView && (
        <footer className="fixed bottom-0 left-0 right-0 p-4 md:hidden flex justify-center z-50 pointer-events-none">
          <div className="px-6 py-2 bg-slate-900 text-white rounded-full border border-slate-800 text-[10px] uppercase tracking-widest font-bold shadow-2xl pointer-events-auto flex gap-6">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'text-emerald-400' : ''}>Guest</NavLink>
            <div className="w-[1px] bg-slate-700"></div>
            <NavLink to="/administrator-access" className={({ isActive }) => isActive ? 'text-emerald-400' : ''}>Admin</NavLink>
          </div>
        </footer>
      )}
    </div>
  );
}


