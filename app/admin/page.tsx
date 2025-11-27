'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase'; // Fixed: Relative import instead of alias
import { Shield, Search, LogOut, RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

// --- TYPES MATCHING YOUR SQL DB ---
interface CheckIn {
  id: string;
  email: string;
  initials: string;
  checkin_time: string; 
  session_type: 'MORNING' | 'AFTERNOON';
  status: 'ON_TIME' | 'LATE' | 'ABSENT';
}

interface ActiveSession {
  token: string;
  session_type: 'MORNING' | 'AFTERNOON';
  created_at: string;
  expires_at: string;
}

export default function AdminDashboard() {
  // Removed unused router to fix compilation error

  // --- STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [adminError, setAdminError] = useState('');
   
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(false);
   
  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // --- 1. AUTHENTICATION CHECK ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple hardcoded password for demo
    if (passwordInput === 'Mecainox@admin') {
      setIsAuthenticated(true);
      fetchData(); // Load data immediately on login
    } else {
      setAdminError('Mot de passe incorrect');
    }
  };

  // --- 2. DATA FETCHING (SUPABASE) ---
  const fetchData = async () => {
    setLoading(true);
    
    try {
      // Fetch Checkins
      const { data: checkinData, error: checkinError } = await supabase
        .from('checkins')
        .select('*')
        .order('checkin_time', { ascending: false });

      if (checkinError) throw checkinError;
      setCheckins(checkinData || []);

      // Fetch Active Session
      const { data: sessionData, error: sessionError } = await supabase
        .from('qr_sessions')
        .select('*')
        .eq('is_active', true)
        .single();

      // It's okay if there is no active session (sessionData might be null)
      if (!sessionError && sessionData) {
        setActiveSession(sessionData);
      } else {
        setActiveSession(null);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. MANUAL GENERATION (Optional) ---
  // If Cron fails or you want to force a session
  const forceGenerateSession = async (type: 'MORNING' | 'AFTERNOON') => {
    setLoading(true);
    // Call the API route we created in the backend guide
    // Note: You might need to pass a secret header if you secured the API
    try {
       await fetch('/api/cron', { 
         method: 'GET',
         headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ''}` } 
       });
       // Wait a moment then refresh
       setTimeout(fetchData, 1000);
    } catch (err) {
      alert("Erreur lors de la génération. Vérifiez la console.");
    }
    setLoading(false);
  };

  // --- 4. FORMATTERS ---
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };
   
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // --- 5. FILTERS ---
  const filteredCheckins = useMemo(() => {
    return checkins.filter(c => {
      const matchesText = c.email.toLowerCase().includes(filterText.toLowerCase()) || c.initials.toLowerCase().includes(filterText.toLowerCase());
      const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
      return matchesText && matchesStatus;
    });
  }, [checkins, filterText, filterStatus]);

  // --- VIEW: LOGIN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blue-600" /> Admin Login
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              // UPDATED HERE: Added text-slate-800 and placeholder-slate-500
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 placeholder-slate-500"
              placeholder="Mot de passe..."
            />
            {adminError && <div className="text-rose-500 text-sm">{adminError}</div>}
            <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700">
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- VIEW: DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="text-white w-5 h-5" />
          </div>
          <h1 className="font-bold text-slate-800 text-lg hidden sm:block">Dashboard MECA-INOX</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100" disabled={loading}>
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setIsAuthenticated(false)} className="p-2 text-slate-500 hover:text-rose-600 rounded-lg">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Top Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6">
           
          {/* Active Session Card */}
          <div className="md:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">Code QR Actif</h3>
            
            {activeSession ? (
              <div className="text-center">
                  <div className="bg-slate-900 text-white p-4 rounded-lg inline-block mb-3 font-mono text-2xl tracking-widest shadow-lg">
                    {activeSession.token}
                  </div>
                  <p className="text-sm text-slate-600">
                    Session: <strong>{activeSession.session_type === 'MORNING' ? 'Matin (08h)' : 'Après-midi (14h)'}</strong>
                  </p>
                  <p className="text-xs text-slate-600 mt-2">Expire: {formatTime(activeSession.expires_at)}</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-600 text-sm mb-4">Aucune session active</p>
                {/* Manual triggers for demo/testing purposes */}
                <div className="flex gap-2 justify-center">
                  <button onClick={() => forceGenerateSession('MORNING')} className="px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded">Force Matin</button>
                  <button onClick={() => forceGenerateSession('AFTERNOON')} className="px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded">Force Aprèm</button>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="md:col-span-2 grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-800">{checkins.length}</span>
                <span className="text-xs text-slate-600 mt-1 uppercase">Total</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-emerald-600">{checkins.filter(c => c.status === 'ON_TIME').length}</span>
                <span className="text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full mt-1">À l'heure</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-amber-600">{checkins.filter(c => c.status === 'LATE').length}</span>
                <span className="text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full mt-1">En Retard</span>
              </div>
          </div>
        </div>

        {/* Check-ins Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between">
            <h3 className="font-bold text-slate-800">Historique</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  // UPDATED HERE: Added placeholder-slate-500
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-500"
                />
              </div>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800"
              >
                <option value="ALL">Tout</option>
                <option value="ON_TIME">À l'heure</option>
                <option value="LATE">En retard</option>
                <option value="ABSENT">Absent</option>
              </select>
            </div>
          </div>
           
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-800 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-3">Employé</th>
                  <th className="px-6 py-3">Session</th>
                  <th className="px-6 py-3">Heure</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCheckins.length > 0 ? (
                  filteredCheckins.map((checkin) => (
                    <tr key={checkin.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 mr-3">
                            {checkin.initials}
                          </div>
                          <span className="font-medium text-slate-900">{checkin.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {checkin.session_type === 'MORNING' 
                          ? <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded text-xs font-semibold">08h00</span>
                          : <span className="text-orange-700 bg-orange-50 px-2 py-1 rounded text-xs font-semibold">14h00</span>
                        }
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-700">
                        {formatTime(checkin.checkin_time)}
                      </td>
                      <td className="px-6 py-4">
                        {checkin.status === 'ON_TIME' && <span className="text-emerald-800 bg-emerald-100 px-2 py-1 rounded-full text-xs flex w-fit items-center gap-1"><CheckCircle className="w-3 h-3"/> À l'heure</span>}
                        {checkin.status === 'LATE' && <span className="text-amber-800 bg-amber-100 px-2 py-1 rounded-full text-xs flex w-fit items-center gap-1"><Clock className="w-3 h-3"/> En retard</span>}
                        {checkin.status === 'ABSENT' && <span className="text-rose-800 bg-rose-100 px-2 py-1 rounded-full text-xs flex w-fit items-center gap-1"><XCircle className="w-3 h-3"/> Absent</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatDate(checkin.checkin_time)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-600">Aucune donnée disponible.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
