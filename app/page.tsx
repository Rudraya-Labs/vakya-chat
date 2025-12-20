"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, Loader2, MessageSquare, UserPlus } from "lucide-react";
import { useContacts } from "@/hooks/useContacts";

export default function VakyaDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<{
    username: string;
    email: string;
  } | null>(null);
  const { contacts, loading: contactsLoading } = useContacts();

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .single();

      setAgent({
        username: profile?.username || "Unknown_Agent",
        email: session.user.email || "",
      });
      setLoading(false);
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") router.replace("/login");
      if (event === "SIGNED_IN" && session) {
        setLoading(false);
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black font-mono p-6">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-purple-500" />
        <p className="text-[10px] uppercase tracking-[0.4em] text-white animate-pulse">
          Establishing Vakya Link
        </p>
      </div>
    );
  }

  return (
    <main className="flex h-screen flex-col items-center justify-center bg-black p-8">
      <div className="max-w-2xl w-full text-center">
        {/* Welcome Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center border border-purple-500/20">
            <ShieldCheck
              size={48}
              className="text-purple-500"
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Welcome Text */}
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-4">
          Welcome, {agent?.username.toUpperCase()}
        </h1>
        <p className="text-zinc-500 text-sm uppercase tracking-widest mb-8">
          Secure Communication Terminal
        </p>

        {/* Status */}
        <div className="mb-12 p-6 rounded-2xl border border-white/5 bg-zinc-900/40">
          <div className="flex items-center justify-center gap-2 text-green-500 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Signal: Stable
            </span>
          </div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
            {agent?.email}
          </p>
        </div>

        {/* Instructions */}
        {contactsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-purple-500" size={20} />
          </div>
        ) : contacts.length === 0 ? (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/20">
              <UserPlus size={32} className="text-purple-500 mx-auto mb-4" />
              <p className="text-sm text-zinc-400 mb-2">No contacts yet</p>
              <p className="text-xs text-zinc-600 uppercase tracking-wider">
                Add a contact from the sidebar to start chatting
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/20">
              <MessageSquare
                size={32}
                className="text-purple-500 mx-auto mb-4"
              />
              <p className="text-sm text-zinc-400 mb-2">
                Select a contact from the sidebar
              </p>
              <p className="text-xs text-zinc-600 uppercase tracking-wider">
                {contacts.length} secure channel
                {contacts.length !== 1 ? "s" : ""} available
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/5">
          <p className="text-[10px] text-zinc-700 uppercase tracking-[0.3em]">
            Vakya Terminal v4.0 • End-to-End Encrypted
          </p>
        </div>
      </div>
    </main>
  );
}
