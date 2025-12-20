'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Loader2, User, ChevronRight, Lock, Terminal } from 'lucide-react';

const TerminalError = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    let i = 0;
    setDisplayedText(''); 
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [text]);
  return <span className="font-mono uppercase tracking-[0.2em]">{displayedText}</span>;
};

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'username' | 'email' | 'otp'>('username');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
    setUsername(val);
    if (error) setError('');
  };

  const checkUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      setError('ERR: NAME_TOO_SHORT');
      return;
    }
    setError('');
    setStep('email');
  };

  const sendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // --- STEP 1: PRE-CHECK USERNAME ---
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    // Note: We don't block them here yet because they might own that account.
    // We only block them if the OTP succeeds and the ID doesn't match.

    const { error: authError } = await supabase.auth.signInWithOtp({ email });
    if (authError) {
      setError(`FAIL: ${authError.message.toUpperCase()}`);
    } else {
      setStep('otp');
    }
    setLoading(false);
  };

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Verify the OTP first
    const { data: authData, error: authError } = await supabase.auth.verifyOtp({ 
      email, token: otp, type: 'email' 
    });

    if (authError || !authData.user) {
      setError('AUTH_DENIED: INVALID_KEY');
      setLoading(false);
      return;
    }

    const currentUserId = authData.user.id;
    const cleanUsername = username.toLowerCase();

    // 2. CHECK OWNERSHIP (THE RED ERROR GATE)
    const { data: profileOwner, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', cleanUsername)
      .maybeSingle();

    // If a profile exists AND the ID isn't the current user's ID -> RED ERROR
    if (profileOwner && profileOwner.id !== currentUserId) {
      console.log("Security Triggered: Name owned by", profileOwner.id);
      setError('SECURITY_BREACH: CODENAME_CLAIMED_BY_ANOTHER_AGENT');
      setLoading(false);
      return; 
    }

    // 3. IF WE PASS THE GATE, SAVE/UPDATE
    const { error: saveError } = await supabase.from('profiles').upsert({
      id: currentUserId,
      username: cleanUsername,
      avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanUsername}`
    });

    if (saveError) {
      // This is the fallback error if the database blocks it
      setError('CONFLICT: NAME_ALREADY_REGISTERED');
      setLoading(false);
    } else {
      window.location.href = '/'; 
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-6 font-mono text-zinc-300">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1),transparent)] pointer-events-none" />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-zinc-950 border border-white/5 p-8 rounded-2xl relative shadow-2xl">
        <div className="text-center mb-10">
          <Shield className="mx-auto text-white mb-4" size={40} />
          <h1 className="text-lg font-black tracking-[0.5em] uppercase text-white">Vakya Terminal</h1>
          <p className="text-[8px] text-zinc-600 tracking-[0.3em] uppercase mt-2 font-bold">Secure Authorization Node</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'username' && (
            <motion.form key="u" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={checkUsername} className="space-y-6">
              <input 
                type="text" placeholder="CODENAME" required value={username} onChange={handleUsernameChange}
                className="w-full bg-zinc-900 border border-white/5 rounded-lg p-4 text-center tracking-[0.3em] outline-none focus:border-purple-500 uppercase placeholder:text-zinc-800"
              />
              {error && <div className="text-red-500 text-[10px] text-center bg-red-500/10 py-2 border border-red-500/20 rounded"><TerminalError text={error} /></div>}
              <button className="w-full bg-white text-black py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all">Initialize</button>
            </motion.form>
          )}

          {step === 'email' && (
            <motion.form key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={sendOTP} className="space-y-6">
              <input 
                type="email" placeholder="IDENTITY EMAIL" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-white/5 rounded-lg p-4 text-center outline-none focus:border-purple-500 placeholder:text-zinc-800"
              />
              <button className="w-full bg-purple-600 text-white py-4 rounded-lg font-bold tracking-widest">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'GENERATE ACCESS KEY'}
              </button>
              <p onClick={() => setStep('username')} className="text-center text-[9px] text-zinc-600 cursor-pointer uppercase tracking-widest">Back</p>
            </motion.form>
          )}

          {step === 'otp' && (
            <motion.form key="o" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={verifyOTP} className="space-y-6">
              <input 
                type="text" maxLength={6} placeholder="000000" required value={otp}
                onChange={(e) => { if (/^\d*$/.test(e.target.value)) setOtp(e.target.value); }}
                className="w-full bg-transparent text-center text-5xl tracking-[0.4em] outline-none text-white placeholder:text-zinc-900"
              />
              {error && <div className="text-red-500 text-[10px] text-center bg-red-500/10 py-2 border border-red-500/20 rounded"><TerminalError text={error} /></div>}
              <button disabled={loading} className="w-full bg-white text-black py-4 rounded-lg font-bold uppercase tracking-widest">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'AUTHORIZE SESSION'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}