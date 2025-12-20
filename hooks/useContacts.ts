import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ContactWithProfile } from '@/types';

export const useContacts = () => {
  const [contacts, setContacts] = useState<ContactWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch contacts with profile data
        const { data, error: fetchError } = await supabase
          .from('contacts')
          .select(`
            id,
            user_id,
            contact_id,
            created_at,
            contact:profiles!contact_id (
              id,
              username,
              avatar_url
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        // Transform the data to ensure consistent structure
        const transformedContacts = (data || []).map((contact: any) => ({
          ...contact,
          contact: contact.contact || contact.profile,
        })) as ContactWithProfile[];

        setContacts(transformedContacts);
        setError(null);
      } catch (err: any) {
        setError(err.message);
        console.error('Error loading contacts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadContacts();

    // Set up real-time subscription for contacts
    let channel: any = null;
    
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('contacts-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'contacts',
            filter: `user_id=eq.${user.id}`,
          },
          async () => {
            // Reload contacts when changes occur
            const { data } = await supabase
              .from('contacts')
              .select(`
                id,
                user_id,
                contact_id,
                created_at,
                contact:profiles!contact_id (
                  id,
                  username,
                  avatar_url
                )
              `)
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });

            if (data) {
              const transformedContacts = data.map((contact: any) => ({
                ...contact,
                contact: contact.contact || contact.profile,
              })) as ContactWithProfile[];

              setContacts(transformedContacts);
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const removeContact = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  return { contacts, loading, error, removeContact };
};

