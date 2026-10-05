import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HomeTryExperience from '../../components/try/HomeTryExperience';

const FounderportHome: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const hashParams = new URLSearchParams(hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    const error = hashParams.get('error');
    const errorCode = hashParams.get('error_code');

    if ((accessToken && type === 'recovery') || error || errorCode) {
      navigate(`/reset-password${hash}`, { replace: true });
    }
  }, [navigate, location.hash]);

  return (
    <div className="landing-page pt-20">
      <HomeTryExperience />
    </div>
  );
};

export default FounderportHome;
