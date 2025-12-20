import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Message } from '@/types';

export const useLastMessage = (chatId: string) => {
  const [lastMessage, setLastMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (!chatId) return;

    const fetchLastMessage = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) setLastMessage(data);
    };

    fetchLastMessage();

    // Subscribe to new messages
    const channel = supabase
      .channel(`last-message:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setLastMessage(payload.new as Message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  return lastMessage;
};

