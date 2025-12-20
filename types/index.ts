export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  created_at?: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  is_one_time: boolean;
  created_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  contact_id: string;
  created_at?: string;
  contact?: Profile; // Joined profile data
  profile?: Profile; // Alternative naming
}

export interface ContactWithProfile extends Contact {
  contact: Profile;
}