'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle, AlertTriangle, Loader2, User, ArrowRight, LogOut } from 'lucide-react';

export default function CheckInPage() {
  const params = useParams();
  const token = params?.token as string;

  // State
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const [checkInResult, setCheckInResult] = useState<{ status: string } | null>(null);

  // 1. Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
      setLoadingUser(false);
    };

    // Écouter les changements d'auth (ex: retour après login Google)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      }
    });

    getUser();

    return () => subscription.unsubscribe();
  }, []);

  // 2. Gérer le login Google
  const handleGoogleLogin = async () => {
    try {
      // Redirige vers la même page après connexion pour ne pas perdre le token QR
      const redirectTo = typeof window !== 'undefined' ? window.location.href : undefined;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setErrorMessage(error.message);
      setStatus('ERROR');
    }
  };

  // 3. Soumettre le pointage
  const handleCheckIn = async () => {
    setStatus('LOADING');
    setErrorMessage('');

    if (!token) {
        setErrorMessage("Erreur: Impossible de lire le token dans l'URL.");
        setStatus('ERROR');
        return;
    }

    if (!user) {
        setErrorMessage("Erreur: Vous devez être connecté.");
        setStatus('ERROR');
        return;
    }

    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          // Récupère le nom complet depuis les métadonnées Google
          name: user.user_metadata?.full_name || user.user_metadata?.name || 'Inconnu',
          token: token,
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

  // --- UI: SUCCESS ---
  if (status === 'SUCCESS') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-2xl shadow-rose-200/50 w-full max-w-sm text-center animate-in fade-in zoom-in duration-500 relative overflow-hidden border border-white/60">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 to-red-600"></div>
          
          <div className="w-24 h-24 bg-gradient-to-tr from-emerald-50 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-emerald-50">
            <CheckCircle className="text-emerald-500 w-12 h-12" />
          </div>
          
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">Merci {user?.user_metadata?.full_name?.split(' ')[0]} !</h2>
          <p className="text-slate-500 mb-8 font-medium">Meca-inox</p>
          
          <div className="bg-slate-50 rounded-2xl p-5 text-left border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500"></div>
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

  // --- UI: AUTH / CHECKIN ---
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-100 via-slate-50 to-white flex items-center justify-center p-4 lg:p-8">
      <div className="bg-white/80 p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-rose-900/10 w-full max-w-md relative overflow-hidden border border-white backdrop-blur-xl">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl"></div>
        
        <div className="mb-10 relative">
          <div className="inline-block p-3 rounded-2xl bg-rose-50 text-rose-600 mb-4 ring-1 ring-rose-100">
             <User className="w-6 h-6" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Bienvenue</h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">
             {user ? `Bonjour, ${user.user_metadata?.full_name}` : "Connectez-vous pour pointer."}
          </p>
        </div>

        {status === 'ERROR' && (
            <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl text-sm flex items-center font-bold border border-rose-200 mb-6 animate-in fade-in slide-in-from-top-2 shadow-sm">
              <AlertTriangle className="w-5 h-5 mr-3 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
        )}

        {loadingUser ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          </div>
        ) : !user ? (
          // --- BOUTON GOOGLE ---
          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-white border border-slate-200 text-slate-700 py-4.5 rounded-2xl font-bold text-lg hover:shadow-lg hover:border-rose-200 transition-all flex items-center justify-center group relative overflow-hidden"
          >
             <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
             </svg>
             Continuer avec Google
          </button>
        ) : (
          // --- BOUTON VALIDER ---
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold">
                 {user.user_metadata?.full_name?.charAt(0) || 'U'}
               </div>
               <div className="overflow-hidden">
                 <p className="text-sm font-bold text-slate-900 truncate">{user.user_metadata?.full_name}</p>
                 <p className="text-xs text-slate-500 truncate">{user.email}</p>
               </div>
            </div>

            <button 
              onClick={handleCheckIn}
              disabled={status === 'LOADING'}
              className="w-full bg-gradient-to-r from-rose-600 to-red-600 text-white py-4.5 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-rose-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                  {status === 'LOADING' ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                      <>
                      Valider ma présence 
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform opacity-80"/>
                      </>
                  )}
              </span>
              <div className="absolute inset-0 h-full w-full bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
            </button>
            
            <button onClick={() => supabase.auth.signOut().then(() => setUser(null))} className="w-full text-slate-400 text-sm font-medium hover:text-slate-600 flex items-center justify-center gap-1">
               <LogOut className="w-3 h-3"/> Changer de compte
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
