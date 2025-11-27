'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveSession = async () => {
    try {
      const { data, error } = await supabase
        .from('qr_sessions')
        .select('token, session_type')
        .eq('is_active', true)
        .single();

      if (data && !error) {
        setToken(data.token);
        setSessionType(data.session_type);
      } else {
        setToken(null);
      }
    } catch (err) {
      console.error('Erreur fetching session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSession();
    // Polling toutes les 30 secondes pour mettre à jour automatiquement
    const interval = setInterval(fetchActiveSession, 30000);
    return () => clearInterval(interval);
  }, []);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const checkinUrl = `${baseUrl}/checkin/${token}`;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-white relative">
      
      {/* Contenu Principal */}
      {loading ? (
        <div className="animate-pulse text-xl">Chargement du système...</div>
      ) : token ? (
        <div className="text-center space-y-8 animate-in fade-in duration-700">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Pointez Votre Présence</h1>
            <p className="text-xl text-slate-400">
              Session : <span className="text-emerald-400 font-bold">
                {sessionType === 'MORNING' ? 'MATIN (08:00)' : 'APRÈS-MIDI (14:00)'}
              </span>
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-2xl inline-block mx-auto">
            <QRCode value={checkinUrl} size={350} level="H" />
          </div>

          <p className="text-lg text-slate-500 max-w-md mx-auto">
            Scannez ce code pour accéder au formulaire.
          </p>
        </div>
      ) : (
        <div className="text-center p-8 bg-slate-800 rounded-2xl border border-slate-700">
          <h2 className="text-2xl font-bold text-slate-300">Aucune session active</h2>
          <p className="text-slate-500 mt-2">Le code apparaîtra automatiquement à l'heure prévue.</p>
        </div>
      )}

      {/* Bouton Admin Flottant */}
      <Link 
        href="/admin" 
        className="absolute bottom-8 right-8 p-3 bg-slate-800/50 hover:bg-slate-700 rounded-full text-slate-500 hover:text-white transition-all backdrop-blur-sm"
        title="Accès Admin"
      >
        <Shield className="w-6 h-6" />
      </Link>
    </div>
  );
}
