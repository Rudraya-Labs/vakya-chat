'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useChat } from '@/hooks/useChat';
import { Message, Profile } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, EyeOff, Lock, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';

export default function ChatPage() {
  const { id: contactId } = useParams();
  const router = useRouter();
  const [myId, setMyId] = useState('');
  const [contactProfile, setContactProfile] = useState<Profile | null>(null);
  const [text, setText] = useState('');
  const [isOneTime, setIsOneTime] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id || ''));
  }, []);

  // Load contact profile
  useEffect(() => {
    if (!contactId) return;
    
    const loadContact = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', contactId)
        .single();

      if (error) {
        console.error('Error loading contact:', error);
        setError('Contact not found');
      } else {
        setContactProfile(data);
      }
    };

    loadContact();
  }, [contactId]);

  // Generate a consistent Room ID (UserA_UserB)
  const chatId = myId && contactId ? [myId, contactId].sort().join('_') : '';
  const { messages, loading } = useChat(chatId);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !myId || !chatId || sending) return;

    setSending(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('messages').insert({
        chat_id: chatId,
        sender_id: myId,
        content: text.trim(),
        is_one_time: isOneTime
      });

      if (insertError) throw insertError;

      setText('');
      setIsOneTime(false);
    } catch (err: { params: { id: string } } | any) {
      setError(err.message || 'Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  // Self-Destruct Reveal Logic
  const handleReveal = async (msgId: string) => {
    // Wait 5 seconds then delete
    setTimeout(async () => {
      await supabase.from('messages').delete().eq('id', msgId);
    }, 5000);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!myId || !contactId) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="animate-spin text-purple-500" size={24} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-4 bg-zinc-950/50 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={20} className="text-zinc-400" />
        </button>
        
        {contactProfile ? (
          <div className="flex items-center gap-3 flex-1">
            <img
              src={contactProfile.avatar_url}
              alt={contactProfile.username}
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div>
              <p className="text-sm font-bold text-white">{contactProfile.username}</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Secure Channel</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 animate-pulse" />
            <div>
              <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse mb-2" />
              <div className="h-3 w-32 bg-zinc-800 rounded animate-pulse" />
            </div>
          </div>
        )}

        <ShieldCheck size={18} className="text-purple-500" />
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-linear-to-b from-black to-zinc-950"
      >
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-purple-500" size={24} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
              <ShieldCheck size={32} className="text-purple-500" />
            </div>
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-wider mb-1">
              Secure Channel Established
            </p>
            <p className="text-zinc-600 text-xs">
              Start the conversation with an encrypted message
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, index) => {
              const isMyMessage = msg.sender_id === myId;
              const showTime = index === 0 || 
                messages[index - 1].sender_id !== msg.sender_id ||
                new Date(msg.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000; // 5 minutes

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}
                >
                  {showTime && (
                    <p className="text-[10px] text-zinc-600 text-center w-full mb-2 mt-4">
                      {formatTime(msg.created_at)}
                    </p>
                  )}
                  <div
                    className={`max-w-[75%] p-3 rounded-2xl border ${
                      isMyMessage
                        ? 'bg-purple-900/30 border-purple-500/50 text-purple-100'
                        : 'bg-zinc-900/50 border-zinc-700/50 text-zinc-300'
                    }`}
                  >
                    {msg.is_one_time ? (
                      <OneTimeBubble msg={msg} onReveal={() => handleReveal(msg.id)} />
                    ) : (
                      <p className="text-sm leading-relaxed wrap-break-words">{msg.content}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </AnimatePresence>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
          <p className="text-red-400 text-xs font-bold uppercase tracking-wider">{error}</p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 bg-zinc-950 border-t border-white/10 flex gap-3">
        <button
          type="button"
          onClick={() => setIsOneTime(!isOneTime)}
          className={`p-3 rounded-xl border transition-all ${
            isOneTime
              ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30'
              : 'border-white/10 text-zinc-500 hover:border-purple-500/50 hover:text-purple-400'
          }`}
          title={isOneTime ? 'Disable self-destruct' : 'Enable self-destruct'}
        >
          <EyeOff size={18} />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a secure message..."
          disabled={sending}
          className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-purple-500/50 focus:outline-none transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="p-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {sending ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Send size={18} />
          )}
        </button>
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