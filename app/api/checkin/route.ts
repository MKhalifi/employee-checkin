import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const body = await request.json();
  const { email, initials, token } = body;

  // 1. Trouver la session active via le token
  const { data: session, error: sessionError } = await supabase
    .from('qr_sessions')
    .select('*')
    .eq('token', token)
    .eq('is_active', true)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Code QR invalide ou expiré' }, { status: 400 });
  }

  // 2. Calculer le statut
  const sessionStart = new Date(session.created_at).getTime();
  const now = new Date().getTime();
  const diffMinutes = (now - sessionStart) / 1000 / 60;
  
  let status = 'ABSENT';
  if (diffMinutes <= 10) status = 'ON_TIME';
  else if (diffMinutes <= 30) status = 'LATE';

  // 3. Enregistrer
  const { error: insertError } = await supabase
    .from('checkins')
    .insert({
      email,
      initials,
      session_type: session.session_type,
      status,
      qr_session_id: session.id
    });

  if (insertError) {
    // Gérer contrainte d'unicité (déjà pointé)
    return NextResponse.json({ error: 'Erreur ou déjà pointé' }, { status: 400 });
  }

  return NextResponse.json({ success: true, status });
}
