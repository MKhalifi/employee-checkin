import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, initials, token } = body; // Ajout de "name"

    console.log("----- DEBUT CHECK-IN DEBUG -----");
    console.log("Données reçues:", { email, name, token });

    // 0. Vérification de sécurité des variables d'environnement
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("ERREUR CRITIQUE: Variables d'environnement manquantes dans Vercel.");
        return NextResponse.json({ error: "Configuration serveur incorrecte (Clés API manquantes)" }, { status: 500 });
    }

    // Initialisation du client avec la clé SERVICE ROLE (Crucial pour contourner RLS si nécessaire)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Trouver la session active via le token
    const { data: session, error: sessionError } = await supabase
        .from('qr_sessions')
        .select('*')
        .eq('token', token)
        .eq('is_active', true)
        .single();

    if (sessionError) {
        console.error("Erreur Supabase lors de la recherche de session:", sessionError);
    }
    
    if (!session) {
        console.error("Aucune session active trouvée pour le token:", token);
        return NextResponse.json({ error: 'Code QR invalide ou expiré (Session introuvable)' }, { status: 400 });
    }

    console.log("Session trouvée:", session.id, "Type:", session.session_type);

    // 2. Calculer le statut
    const sessionStart = new Date(session.created_at).getTime();
    const now = new Date().getTime();
    const diffMinutes = (now - sessionStart) / 1000 / 60;
    
    let status = 'ABSENT';
    if (diffMinutes <= 10) status = 'ON_TIME';
    else if (diffMinutes <= 30) status = 'LATE';

    console.log("Statut calculé:", status, "(Différence minutes:", diffMinutes.toFixed(2), ")");

    // 3. Enregistrer le check-in
    const { error: insertError } = await supabase
        .from('checkins')
        .insert({
          email,
          name, // Enregistrement du nom Google
          initials: initials || name?.substring(0, 3).toUpperCase(), // Fallback pour initiales
          session_type: session.session_type,
          status,
          qr_session_id: session.id
        });

    if (insertError) {
        console.error("Erreur Insertion Checkin:", insertError);
        if (insertError.code === '23505') { 
            return NextResponse.json({ error: 'Vous avez déjà pointé pour cette session.' }, { status: 400 });
        }
        return NextResponse.json({ error: `Erreur d'enregistrement: ${insertError.message}` }, { status: 400 });
    }

    console.log("Check-in réussi !");
    return NextResponse.json({ success: true, status });

  } catch (err: any) {
    console.error("Erreur inattendue API:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur interne" }, { status: 500 });
  }
}
