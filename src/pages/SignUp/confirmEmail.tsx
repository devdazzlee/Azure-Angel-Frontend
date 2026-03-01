import { createClient } from '@supabase/supabase-js';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

      if (error) {
        console.error('Email confirmation failed:', error.message);
        return;
      }
      clearEmailPendingVerification();
      navigate('/gky');
    }
    finishConfirmation();
  }, [search, navigate]);

  return <div>Confirming your email…</div>;
};

export default ConfirmEmail;