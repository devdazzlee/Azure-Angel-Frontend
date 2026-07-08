import { createClient } from '@supabase/supabase-js';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { clearEmailPendingVerification } from '../../utils/tokenUtils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ConfirmEmail = () => {
  const { search } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    async function finishConfirmation() {
      const { error } = await supabase.auth.getSession();

      // This app signs users in via the custom /auth/signin endpoint, not the
      // Supabase session detected from this confirmation link, so always send
      // the user to the login page to sign in with their credentials.
      if (error) {
        console.error('Email confirmation failed:', error.message);
        toast.error('Email confirmation failed. Please try the link again or request a new one.');
        navigate('/login');
        return;
      }
      clearEmailPendingVerification();
      toast.success('Email confirmed! Please sign in to continue.');
      navigate('/login');
    }
    finishConfirmation();
  }, [search, navigate]);

  return <div>Confirming your email…</div>;
};

export default ConfirmEmail;