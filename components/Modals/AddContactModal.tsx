'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Search, UserPlus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddContactModal({ isOpen, onClose }: Props) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      // 2. Find target user by username
      const { data: target, error: searchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.trim())
        .single();

      if (searchError || !target) throw new Error("Agent codename not found.");
      if (target.id === user.id) throw new Error("You cannot add yourself.");

      // 3. Add to contacts
      const { error: insertError } = await supabase
        .from('contacts')
        .insert({ user_id: user.id, contact_id: target.id });

      if (insertError) throw new Error("Contact already exists in your secure list.");

      onClose();
      window.location.reload(); // Refresh to show new contact in sidebar
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-zinc-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white">
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
                <UserPlus className="text-purple-500" size={28} />
              </div>
              <h2 className="text-xl font-black italic tracking-tighter">INITIATE CONNECTION</h2>
              <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Enter target codename</p>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                <input 
                  autoFocus
                  placeholder="Target Username..."
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-purple-500 outline-none transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {error && <p className="text-red-500 text-[10px] font-bold uppercase text-center tracking-wider">{error}</p>}

              <button 
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 py-4 rounded-2xl font-black italic tracking-tighter text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'ADD TO SECURE NETWORK'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}