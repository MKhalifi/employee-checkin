'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, AlertTriangle, Loader2, User, Mail, ArrowRight } from 'lucide-react';

export default function CheckInPage() {
  const params = useParams();
  const token = params?.token as string; // Récupération robuste du token via le hook

  const [formData, setFormData] = useState({ email: '', initials: '' });
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const [checkInResult, setCheckInResult] = useState<{ status: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('LOADING');
    setErrorMessage('');

    if (!token) {
        setErrorMessage("Erreur: Impossible de lire le token dans l'URL.");
        setStatus('ERROR');
        return;
    }

    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          initials: formData.initials.toUpperCase(),
          token: token, // Utilisation du token récupéré par useParams
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Erreur inconnue.');

      setCheckInResult(data);
      setStatus('SUCCESS');
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur de connexion.");
      setStatus('ERROR');
    }
  };

  if (status === 'SUCCESS') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-2xl shadow-rose-200/50 w-full max-w-sm text-center animate-in fade-in zoom-in duration-500 relative overflow-hidden border border-white/60">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 to-red-600"></div>
          
          <div className="w-24 h-24 bg-gradient-to-tr from-emerald-50 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-emerald-50">
            <CheckCircle className="text-emerald-500 w-12 h-12" />
          </div>
          
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">Pointage Réussi</h2>
          <p className="text-slate-500 mb-8 font-medium">Votre présence a été enregistrée.</p>
          
          <div className="bg-slate-50 rounded-2xl p-5 text-left border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500"></div>
             <div className="flex justify-between text-base mb-3 pb-3 border-b border-slate-200/60">
               <span className="text-slate-500 font-medium">Statut</span>
               <span className={`font-bold inline-flex items-center ${
                 checkInResult?.status === 'ON_TIME' ? 'text-emerald-700' : 
                 checkInResult?.status === 'LATE' ? 'text-amber-700' : 'text-rose-700'
               }`}>
                 {checkInResult?.status === 'ON_TIME' ? "✅ À l'heure" : 
                  checkInResult?.status === 'LATE' ? "⚠️ En retard" : "Absent"}
               </span>
             </div>
             <div className="flex justify-between text-base">
               <span className="text-slate-500 font-medium">Heure</span>
               <span className="font-bold font-mono text-slate-900">
                 {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
               </span>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-100 via-slate-50 to-white flex items-center justify-center p-4 lg:p-8">
      <div className="bg-white/80 p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-rose-900/10 w-full max-w-md relative overflow-hidden border border-white backdrop-blur-xl">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl"></div>
        
        <div className="mb-10 relative">
          <div className="inline-block p-3 rounded-2xl bg-rose-50 text-rose-600 mb-4 ring-1 ring-rose-100">
             <User className="w-6 h-6" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Bienvenue</h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Confirmez votre arrivée pour la session en cours.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Professionnel</label>
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
              <input 
                required
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all text-slate-900 font-medium placeholder:text-slate-400 shadow-sm group-hover:border-rose-200"
                placeholder="nom@entreprise.com"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Vos Initiales</label>
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
              <input 
                required
                type="text" 
                maxLength={3}
                value={formData.initials}
                onChange={(e) => setFormData({...formData, initials: e.target.value.toUpperCase()})}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all text-slate-900 font-bold placeholder:text-slate-400 uppercase shadow-sm tracking-widest group-hover:border-rose-200"
                placeholder="ABC"
              />
            </div>
          </div>

          {status === 'ERROR' && (
            <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl text-sm flex items-center font-bold border border-rose-200 animate-in fade-in slide-in-from-top-2 shadow-sm">
              <AlertTriangle className="w-5 h-5 mr-3 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={status === 'LOADING' || !formData.email || !formData.initials}
            className="w-full bg-gradient-to-r from-rose-600 to-red-600 text-white py-4.5 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-rose-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0 flex items-center justify-center group relative overflow-hidden mt-4"
          >
            <span className="relative z-10 flex items-center">
                {status === 'LOADING' ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>
                    Valider maintenant 
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform opacity-80"/>
                    </>
                )}
            </span>
            <div className="absolute inset-0 h-full w-full bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
          </button>
        </form>
      </div>
    </div>
  );
}
