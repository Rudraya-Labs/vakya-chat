'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useChat } from '@/hooks/useChat';
import { Message } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, EyeOff, Trash2, Lock } from 'lucide-react';

export default function ChatPage() {
  const { id: contactId } = useParams(); // ID of the person we are talking to
  const [myId, setMyId] = useState('');
  const [text, setText] = useState('');
  const [isOneTime, setIsOneTime] = useState(false);

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id || ''));
  }, []);

  // Generate a consistent Room ID (UserA_UserB)
  const chatId = [myId, contactId].sort().join('_');
  const { messages } = useChat(chatId);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: myId,
      content: text,
      is_one_time: isOneTime
    });

    setText('');
    setIsOneTime(false);
  };

  // Self-Destruct Reveal Logic
  const handleReveal = async (msgId: string) => {
    // Wait 5 seconds then delete
    setTimeout(async () => {
      await supabase.from('messages').delete().eq('id', msgId);
    }, 5000);
  };

  if (!myId) return null;

  return (
    <div className="flex flex-col h-screen bg-black/50 backdrop-blur-md">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <span className="text-purple-400 font-mono text-xs tracking-widest">SECURE_LINK_ESTABLISHED</span>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`flex ${msg.sender_id === myId ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] p-3 rounded-xl border ${
                msg.sender_id === myId 
                  ? 'bg-purple-900/20 border-purple-500/50 text-purple-100' 
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300'
              }`}>
                {msg.is_one_time ? (
                  <OneTimeBubble msg={msg} onReveal={() => handleReveal(msg.id)} />
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 bg-zinc-950 border-t border-white/10 flex gap-3">
        <button 
          type="button" 
          onClick={() => setIsOneTime(!isOneTime)}
          className={`p-3 rounded-lg border ${isOneTime ? 'bg-red-500/20 border-red-500 text-red-500' : 'border-white/10 text-zinc-500'}`}
        >
          <EyeOff size={18} />
        </button>
        <input 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Encrypted message..."
          className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-zinc-600"
        />
        <button type="submit" className="text-purple-500 font-bold"><Send size={18}/></button>
      </form>
    </div>
  );
}

// Sub-component for the locking logic
function OneTimeBubble({ msg, onReveal }: { msg: Message, onReveal: () => void }) {
  const [revealed, setRevealed] = useState(false);
  
  return revealed ? (
    <div className="text-red-400 animate-pulse">
      <p className="text-sm">{msg.content}</p>
      <p className="text-[10px] font-bold mt-1 uppercase">Destructing...</p>
    </div>
  ) : (
    <button onClick={() => { setRevealed(true); onReveal(); }} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-70 hover:opacity-100">
      <Lock size={12} /> Click to Reveal
    </button>
  );
}