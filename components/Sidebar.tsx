'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, LogOut, Search, X, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AddContactModal from './Modals/AddContactModal';
import { useContacts } from '@/hooks/useContacts';
import { useLastMessages } from '@/hooks/useLastMessages';
import { Profile } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar() {
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [removingContactId, setRemovingContactId] = useState<string | null>(null);
  const pathname = usePathname();
  const { contacts, loading, removeContact } = useContacts();

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setMyProfile(profile);
    };
    loadProfile();
  }, []);

  // Fetch last messages for all chats
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || '');
    });
  }, []);

  const allChatIds = useMemo(() => {
    if (!currentUserId) return [];
    return contacts.map((contact) => {
      // Generate chat ID: sort user_id and contact_id
      if (contact.user_id && contact.contact_id) {
        return [contact.user_id, contact.contact_id].sort().join('_');
      }
      return '';
    }).filter(Boolean);
  }, [contacts, currentUserId]);

  const lastMessages = useLastMessages(allChatIds);

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter((c) =>
      c.contact.username.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  const handleRemoveContact = async (e: React.MouseEvent, contactId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Remove this contact from your secure network?')) return;
    
    setRemovingContactId(contactId);
    await removeContact(contactId);
    setRemovingContactId(null);
  };

  const formatLastMessage = (content: string, maxLength: number = 30) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <aside className="w-80 h-screen bg-zinc-950 border-r border-white/10 flex flex-col shadow-2xl">
      {/* HEADER: USER IDENTITY */}
      <div className="p-6 border-b border-white/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg">
          {myProfile?.username?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-tighter">Authorized Agent</p>
          <p className="text-sm font-bold text-white truncate">{myProfile?.username || 'Loading...'}</p>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="p-4 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-zinc-600 focus:border-purple-500/50 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
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
        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest px-2 mb-2">
          Secure Channels {filteredContacts.length > 0 && `(${filteredContacts.length})`}
        </p>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-purple-500" size={20} />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-8 text-zinc-600">
            <p className="text-xs uppercase tracking-widest">
              {searchQuery ? 'No contacts found' : 'No contacts yet'}
            </p>
            {!searchQuery && (
              <p className="text-[10px] mt-2 text-zinc-700">
                Add a contact to start chatting
              </p>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {filteredContacts.map((contact) => {
              const chatId = contact.user_id && contact.contact_id 
                ? [contact.user_id, contact.contact_id].sort().join('_')
                : '';
              const lastMessage = chatId ? lastMessages[chatId] : null;
              const isActive = pathname === `/chat/${contact.contact.id}`;

              return (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Link href={`/chat/${contact.contact.id}`}>
                    <div
                      className={`group relative p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-purple-500/20 border border-purple-500/50'
                          : 'bg-white/5 hover:bg-white/10 border border-transparent hover:border-purple-500/20'
                      }`}
                    >
                      <img
                        src={contact.contact.avatar_url}
                        className="w-10 h-10 rounded-lg object-cover"
                        alt={contact.contact.username}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {contact.contact.username}
                        </p>
                        {lastMessage && (
                          <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                            {formatLastMessage(lastMessage.content)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleRemoveContact(e, contact.id)}
                        disabled={removingContactId === contact.id}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all disabled:opacity-50"
                        title="Remove contact"
                      >
                        {removingContactId === contact.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
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