export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
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
  contact_id: string;
  profile: Profile; // Joined data
}