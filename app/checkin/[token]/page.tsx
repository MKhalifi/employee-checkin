'use client';

import { useState } from 'react';
import { CheckCircle, AlertTriangle, Loader2, User, Mail } from 'lucide-react';

export default function CheckInPage({ params }: { params: { token: string } }) {
  // State for form data and UI status
  const [formData, setFormData] = useState({ email: '', initials: '' });
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const [checkInResult, setCheckInResult] = useState<{ status: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('LOADING');
    setErrorMessage('');

    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          initials: formData.initials.toUpperCase(),
          token: params.token, // Token from the URL
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue.');
      }

      setCheckInResult(data); // Save result (e.g., ON_TIME, LATE)
      setStatus('SUCCESS');
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur de connexion.");
      setStatus('ERROR');
    }
  };

  // --- UI: SUCCESS STATE ---
  if (status === 'SUCCESS') {
    return (
      <div className="min-h-screen bg-emerald-600 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-emerald-600 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Pointage Réussi !</h2>
          <p className="text-slate-500 mb-6">Votre présence a été enregistrée.</p>
          
          <div className="bg-slate-50 rounded-xl p-4 text-left border border-slate-100">
             <div className="flex justify-between text-sm mb-2">
               <span className="text-slate-500">Statut:</span>
               <span className={`font-bold ${
                 checkInResult?.status === 'ON_TIME' ? 'text-emerald-600' : 
                 checkInResult?.status === 'LATE' ? 'text-amber-600' : 'text-slate-800'
               }`}>
                 {checkInResult?.status === 'ON_TIME' ? "À l'heure" : 
                  checkInResult?.status === 'LATE' ? "En retard" : "Absent"}
               </span>
             </div>
             <div className="flex justify-between text-sm">
               <span className="text-slate-500">Heure:</span>
               <span className="font-bold text-slate-800">
                 {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
               </span>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // --- UI: FORM STATE ---
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Validation Présence</h1>
          <p className="text-slate-500 text-sm mt-1">Veuillez remplir vos informations pour valider votre arrivée.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Email Professionnel</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                required
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="nom@entreprise.com"
              />
            </div>
          </div>
          
          {/* Initials Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Vos Initiales</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                required
                type="text" 
                maxLength={3}
                value={formData.initials}
                onChange={(e) => setFormData({...formData, initials: e.target.value.toUpperCase()})}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all uppercase placeholder:normal-case"
                placeholder="Ex: ABC"
              />
            </div>
          </div>

          {/* Error Message */}
          {status === 'ERROR' && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm flex items-start animate-pulse">
              <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={status === 'LOADING'}
            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {status === 'LOADING' ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Validation...
              </>
            ) : (
              'Valider ma présence'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}