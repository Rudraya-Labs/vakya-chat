'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Terminal, LogOut, ShieldCheck, Send, Loader2, Activity } from 'lucide-react';

export default function VakyaDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<{ username: string; email: string } | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single();

      setAgent({
        username: profile?.username || 'Unknown_Agent',
        email: session.user.email || ''
      });
      setLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') router.replace('/login');
      if (event === 'SIGNED_IN' && session) {
        setLoading(false);
        router.refresh(); 
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black font-mono p-6">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-vakya-purple" />
        <p className="text-[10px] uppercase tracking-[0.4em] text-white animate-pulse">
          Establishing Vakya Link
        </p>
      </div>
    );
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-black p-4 font-mono text-zinc-300 md:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4">
        
        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-4">
            <Terminal size={18} className="text-vakya-purple" />
            <h1 className="text-xl font-black italic uppercase tracking-tighter text-white">Vakya_Terminal</h1>
          </div>
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="rounded-lg border border-white/5 bg-zinc-900 px-4 py-2 text-[10px] font-bold uppercase transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500"
          >
            Terminate
          </button>
        </header>

        {/* AGENT STATUS */}
        <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-zinc-900/40 p-6">
          <div>
            <p className="mb-1 text-[8px] uppercase tracking-widest text-zinc-600">Authenticated Agent</p>
            <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white">
              {agent?.username.toUpperCase()}
            </h2>
          </div>
          <div className="hidden text-right sm:block">
            <div className="flex items-center justify-end gap-2 text-green-500">
              <Activity size={12} className="animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Signal: Stable</span>
            </div>
            <p className="mt-1 text-[8px] text-zinc-700">{agent?.email}</p>
          </div>
        </div>

        {/* WORKSPACE */}
        <div className="relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/5 bg-zinc-950 shadow-2xl">
          <div className="flex flex-1 flex-col items-center justify-center opacity-10">
            <ShieldCheck size={80} strokeWidth={1} />
            <p className="mt-6 text-center text-[10px] uppercase tracking-[1em]">Secure Workspace V4.0</p>
          </div>

          {/* MESSAGE INPUT */}
          <div className="border-t border-white/5 bg-black/50 p-4">
            <form className="flex gap-3" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="text" 
                value={message} 
                onChange={(e) => setMessage(e.target.value)}
                placeholder="TRANSMIT SECURE VAKYA..."
                className="flex-1 rounded-xl border border-white/10 bg-zinc-900 px-6 py-4 text-xs uppercase tracking-widest text-white outline-none transition-colors focus:border-vakya-purple"
              />
              <button className="rounded-xl bg-vakya-purple p-4 text-white shadow-lg shadow-purple-500/20 transition-all hover:bg-purple-500 active:scale-95">
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}