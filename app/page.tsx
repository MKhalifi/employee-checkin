'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import Link from 'next/link';
import { Shield, Zap } from 'lucide-react';
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

  // --- DEV ONLY: Fonction pour forcer la génération (Test local) ---
  const handleForceGenerate = async () => {
    if (!confirm("Simuler une session (8h00) maintenant ?")) return;
    setLoading(true);

    try {
      // 1. Essayer via l'API (Méthode propre)
      const res = await fetch('/api/cron', {
        headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ''}`
        },
        cache: 'no-store'
      });

      if (res.ok) {
        // Si succès, recharger simplement les données
        await fetchActiveSession();
        return;
      }

      // 2. Si l'API échoue (ex: 401 Unauthorized), Fallback Client-Side pour le Dev
      console.warn("API Cron failed (401?), trying direct DB insert for Dev...");
      
      // Désactiver les anciennes sessions d'abord
      await supabase.from('qr_sessions').update({ is_active: false }).eq('is_active', true);
      
      // Insérer une nouvelle session manuellement
      const { error } = await supabase.from('qr_sessions').insert({
        token: Math.random().toString(36).substring(2, 10).toUpperCase(),
        session_type: new Date().getHours() < 12 ? 'MORNING' : 'AFTERNOON',
        expires_at: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        is_active: true
      });

      if (error) throw error;
      
      // Recharger pour afficher le QR
      await fetchActiveSession();

    } catch (e) {
      console.error(e);
      alert("Erreur de génération. Vérifiez la console.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSession();
    // Polling toutes les 30 secondes
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
          <p className="text-slate-500 mt-2 mb-6">Le code apparaîtra automatiquement à l'heure prévue.</p>
          
          {/* Bouton Dev pour simuler le Cron */}
          <button 
            onClick={handleForceGenerate}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm transition-colors mx-auto"
          >
            <Zap className="w-4 h-4" />
            Simuler 08h00 (Dev)
          </button>
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
