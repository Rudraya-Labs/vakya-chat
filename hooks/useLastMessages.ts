import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Message } from '@/types';

export const useLastMessages = (chatIds: string[]) => {
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({});

  useEffect(() => {
    if (chatIds.length === 0) return;

    const fetchLastMessages = async () => {
      // Fetch last message for each chat
      const promises = chatIds.map(async (chatId) => {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return { chatId, message: data };
      });

      const results = await Promise.all(promises);
      const messagesMap: Record<string, Message> = {};
      
      results.forEach(({ chatId, message }) => {
        if (message) {
          messagesMap[chatId] = message;
        }
      });

      setLastMessages(messagesMap);
    };

    fetchLastMessages();

    // Subscribe to all chat channels for real-time updates
    const channels = chatIds.map((chatId) =>
      supabase
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
            setLastMessages((prev) => ({
              ...prev,
              [chatId]: payload.new as Message,
            }));
          }
        )
        .subscribe()
    );

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [chatIds.join(',')]); // Dependency on sorted chatIds

  return lastMessages;
};

