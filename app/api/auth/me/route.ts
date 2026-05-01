import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const sessionCookie = cookies().get('user_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ user: null });
    }

    const userId = sessionCookie.value;
    const supabase = createClient(true);

    const { data: user } = await supabase
      .from('users')
      .select('id, full_name, phone, email')
      .eq('id', userId)
      .single();

    if (!user) {
      // If user not found in db but cookie exists, might want to clear it, but here we just return null
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
