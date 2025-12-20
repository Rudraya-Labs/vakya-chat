'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, User, LogOut, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import AddContactModal from './Modals/AddContactModal';

export default function Sidebar() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get My Profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setMyProfile(profile);

      // 2. Get My Contacts
      const { data: friends } = await supabase
        .from('contacts')
        .select('*, contact:profiles!contact_id(*)')
        .eq('user_id', user.id);
      
      if (friends) setContacts(friends);
    };
    loadData();
  }, []);

  return (
    <aside className="w-80 h-screen bg-zinc-950 border-r border-white/10 flex flex-col shadow-2xl">
      {/* HEADER: USER IDENTITY */}
      <div className="p-6 border-b border-white/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-linear-to-tr from-purple-600 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg">
          {myProfile?.username?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-tighter">Authorized Agent</p>
          <p className="text-sm font-bold text-white truncate">{myProfile?.username || 'Loading...'}</p>
        </div>
      </div>

      {/* CREATE CONTACT BUTTON */}
      <div className="p-4">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-white/5 border border-white/10 hover:border-purple-500/50 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all group"
        >
          <Plus size={18} className="text-purple-400 group-hover:rotate-90 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Create Contact</span>
        </button>
      </div>

      {/* CONTACTS LIST */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2">
        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest px-2 mb-2">Secure Channels</p>
        {contacts.map((c) => (
          <Link href={`/chat/${c.contact.id}`} key={c.id}>
            <div className="p-3 bg-white/5 hover:bg-white/10 border border-transparent hover:border-purple-500/20 rounded-2xl flex items-center gap-3 transition-all cursor-pointer">
              <img src={c.contact.avatar_url} className="w-8 h-8 rounded-lg" alt="avatar" />
              <span className="text-sm font-medium text-zinc-300">{c.contact.username}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* LOGOUT */}
      <div className="p-4 border-t border-white/5">
        <button 
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center justify-between px-4 py-2 text-zinc-500 hover:text-red-400 transition-colors"
        >
          <span className="text-xs font-bold uppercase tracking-widest">Terminate Session</span>
          <LogOut size={16} />
        </button>
      </div>

      <AddContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </aside>
  );
}