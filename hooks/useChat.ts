import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Message } from '@/types';

export const useChat = (chatId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!chatId) return;

    // 1. Fetch initial history
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    // 2. Realtime Subscription
    const channel = supabase.channel(`room:${chatId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMessages(prev => [...prev, payload.new as Message]);
        }
        if (payload.eventType === 'DELETE') {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chatId]);

  return { messages };
};