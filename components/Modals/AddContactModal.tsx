"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Search, UserPlus, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddContactModal({ isOpen, onClose }: Props) {
  const [usernames, setUsernames] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessCount(0);
    setFailedCount(0);

    try {
      // 1. Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      // 2. Process multiple usernames
      const usernameList = usernames
        .split(',')
        .map(u => u.trim())
        .filter(u => u.length > 0);

      if (usernameList.length === 0) {
        throw new Error("Please enter at least one username");
      }

      // 3. Process each username
      const results = [];
      for (const username of usernameList) {
        try {
          // Skip empty usernames
          if (!username) continue;

          // Skip if trying to add self
          if (username.toLowerCase() === user.user_metadata?.username?.toLowerCase()) {
            results.push({ username, success: false, error: "You cannot add yourself" });
            continue;
          }

          // Find target user by username
          const { data: target, error: searchError } = await supabase
            .from("profiles")
            .select("id, username")
            .ilike("username", username)
            .single();

          if (searchError || !target) {
            results.push({ username, success: false, error: "User not found" });
            continue;
          }

          // Add to contacts
          const { error: insertError } = await supabase
            .from("contacts")
            .insert({ user_id: user.id, contact_id: target.id });

          if (insertError) {
            if (insertError.code === "23505") {
              results.push({ username, success: false, error: "Already in contacts" });
            } else {
              throw new Error(insertError.message || "Failed to add contact");
            }
          } else {
            results.push({ username, success: true });
          }
        } catch (err: any) {
          results.push({ username, success: false, error: err.message });
        }
      }

      // 4. Calculate and show results
      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;
      
      setSuccessCount(successful);
      setFailedCount(failed);

      // If all failed, show the first error
      if (successful === 0 && failed > 0) {
        setError(results[0].error || "Failed to add contacts");
      }

      // Clear the form if all were successful
      if (failed === 0) {
        setUsernames("");
        setTimeout(() => onClose(), 1500);
      }
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
                <UserPlus className="text-purple-500" size={28} />
              </div>
              <h2 className="text-xl font-black italic tracking-tighter">
                INITIATE CONNECTION
              </h2>
              <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">
                Enter target codename
              </p>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
                  size={18}
                />
                <input
                  autoFocus
                  placeholder="Enter usernames, separated by commas..."
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-purple-500 outline-none transition-all"
                  value={usernames}
                  onChange={(e) => setUsernames(e.target.value)}
                />
              </div>

              {(error || successCount > 0 || failedCount > 0) && (
                <div className="space-y-2">
                  {successCount > 0 && (
                    <p className="text-green-400 text-[10px] font-bold uppercase tracking-wider text-center">
                      Successfully added {successCount} contact{successCount > 1 ? 's' : ''}
                    </p>
                  )}
                  {failedCount > 0 && (
                    <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider text-center">
                      {error || `Failed to add ${failedCount} contact${failedCount > 1 ? 's' : ''}`}
                    </p>
                  )}
                </div>
              )}

              <button
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 py-4 rounded-2xl font-black italic tracking-tighter text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>PROCESSING {usernames.split(',').filter(u => u.trim()).length} CONTACTS</span>
                  </>
                ) : successCount > 0 ? (
                  "DONE"
                ) : (
                  `ADD ${usernames.split(',').filter(u => u.trim()).length || ''} TO NETWORK`.trim()
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
