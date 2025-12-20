'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from './Sidebar';

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session && pathname !== '/login') router.push('/login');
      setLoading(false);
    });

    // 2. Listen for Sign In/Out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session && pathname !== '/login') router.push('/login');
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  if (loading) return <div className="h-screen bg-black" />;

  const isLoginPage = pathname === '/login';

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Show Sidebar only if logged in AND not on login page */}
      {!isLoginPage && session && <Sidebar />}
      
      <main className="flex-1 relative h-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}