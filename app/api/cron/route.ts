import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Utilisez la clé Service Role ici pour écrire
);

export async function GET(request: Request) {
  // Vérification de sécurité Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Déterminer la session (Matin ou Après-midi) basé sur l'heure actuelle (UTC)
  // Note: Vercel Cron s'exécute en UTC. Il faut ajuster pour le Maroc.
  const now = new Date();
  const hour = now.getUTCHours(); // Ajustez selon le fuseau horaire
  const sessionType = hour < 12 ? 'MORNING' : 'AFTERNOON';

  // Désactiver les anciennes sessions
  await supabase
    .from('qr_sessions')
    .update({ is_active: false })
    .eq('is_active', true);

  // Générer nouveau token
  const token = Math.random().toString(36).substring(2, 15).toUpperCase();
  
  // Expiration dans 4 heures
  const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('qr_sessions')
    .insert({
      token,
      session_type: sessionType,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, token: data.token });
}
