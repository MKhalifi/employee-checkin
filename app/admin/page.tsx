'use client';

import React, { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, Search, LogOut, RefreshCw, CheckCircle, XCircle, Clock, Users, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [checkins, setCheckins] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'Mecainox@admin') {
      setIsAuthenticated(true);
      fetchData();
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: cData } = await supabase.from('checkins').select('*').order('checkin_time', { ascending: false });
    const { data: sData } = await supabase.from('qr_sessions').select('*').eq('is_active', true).single();
    setCheckins(cData || []);
    setActiveSession(sData);
    setLoading(false);
  };

  const filteredCheckins = useMemo(() => {
    return checkins.filter(c => {
      const search = filterText.toLowerCase();
      // Recherche sur le Nom (Google) ou l'email
      return (c.name && c.name.toLowerCase().includes(search)) || 
             (c.email && c.email.toLowerCase().includes(search));
    });
  }, [checkins, filterText]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-rose-50/50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-[2rem] shadow-2xl shadow-rose-900/5 w-full max-w-sm border border-white/50 backdrop-blur">
          <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mb-6 text-rose-600 mx-auto">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-8 text-center">Accès Administrateur</h2>
          <div className="space-y-4">
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-rose-500 focus:bg-white outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium text-center tracking-widest"
              placeholder="••••••"
            />
            <button className="w-full bg-rose-600 text-white py-4 rounded-xl font-bold hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-500/20 transition-all">
              Connexion
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    // CHANGE HERE: Changed 'bg-slate-50/50' to 'bg-white'
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200/60 px-6 py-5 flex justify-between items-center sticky top-0 z-20 backdrop-blur-md bg-white/80">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20 text-white">
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="font-bold text-slate-900 text-xl tracking-tight">Dashboard MECAINOX</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="px-4 py-2.5 text-rose-700 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 font-semibold flex items-center gap-2 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 
            <span className="hidden sm:inline">Actualiser</span>
          </button>
          <button onClick={() => setIsAuthenticated(false)} className="px-4 py-2.5 text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-rose-600 font-semibold flex items-center gap-2 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Active Session Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-[1.5rem] shadow-xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-all"></div>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Session Active</h3>
              <Activity className="w-5 h-5 text-rose-400" />
            </div>
            
            {activeSession ? (
              <div className="space-y-4 relative z-10">
                <div className="text-4xl font-mono font-bold tracking-tight text-white">{activeSession.token}</div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  {activeSession.session_type === 'MORNING' ? 'Matin (08:00)' : 'Après-midi (14:00)'}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-24 text-slate-500">
                <p className="font-medium italic">Aucune session en cours</p>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="md:col-span-2 grid grid-cols-3 gap-4">
            {[
              { label: 'Total Pointages', count: checkins.length, color: 'text-slate-900', bg: 'bg-white', icon: Users },
              { label: "À l'heure", count: checkins.filter(c => c.status === 'ON_TIME').length, color: 'text-emerald-600', bg: 'bg-emerald-50/50', icon: CheckCircle },
              { label: 'En Retard', count: checkins.filter(c => c.status === 'LATE').length, color: 'text-rose-600', bg: 'bg-rose-50/50', icon: Clock }
            ].map((stat, i) => (
              <div key={i} className={`${stat.bg} p-5 rounded-[1.5rem] border border-transparent shadow-sm hover:shadow-md transition-all flex flex-col justify-between group`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.bg === 'bg-white' ? 'bg-slate-100 text-slate-600' : 'bg-white shadow-sm'} group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <span className={`text-3xl font-black ${stat.color}`}>{stat.count}</span>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-rose-500" />
              Historique des Présences
            </h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Rechercher par nom..." 
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Employé</th>
                  <th className="px-6 py-4 font-bold">Session</th>
                  <th className="px-6 py-4 font-bold">Heure d'arrivée</th>
                  <th className="px-6 py-4 font-bold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCheckins.map((c) => (
                  <tr key={c.id} className="hover:bg-rose-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center text-xs font-black text-rose-700 mr-3 border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                          {c.name ? c.name.charAt(0) : (c.initials || 'U')}
                        </div>
                        <div>
                           <div className="font-bold text-slate-900">{c.name || 'Nom inconnu'}</div>
                           <div className="text-xs text-slate-500">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                         c.session_type === 'MORNING' 
                           ? 'bg-blue-50 text-blue-600 border-blue-100' 
                           : 'bg-orange-50 text-orange-600 border-orange-100'
                       }`}>
                         {c.session_type === 'MORNING' ? '08:00' : '14:00'}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500 font-mono text-xs font-medium bg-slate-100 px-2 py-1 rounded w-fit">
                        {new Date(c.checkin_time).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {c.status === 'ON_TIME' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100/50 text-emerald-700 border border-emerald-100">
                          <CheckCircle className="w-3.5 h-3.5"/> À l'heure
                        </span>
                      )}
                      {c.status === 'LATE' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100/50 text-amber-700 border border-amber-100">
                          <Clock className="w-3.5 h-3.5"/> Retard
                        </span>
                      )}
                      {c.status === 'ABSENT' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-100/50 text-rose-700 border border-rose-100">
                          <XCircle className="w-3.5 h-3.5"/> Absent
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
