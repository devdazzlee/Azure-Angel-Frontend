import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import RoadmapToImplementationTransition from '../../components/RoadmapToImplementationTransition';
import { useBusinessContext } from '../../hooks/useBusinessContext';
import httpClient from '../../api/httpClient';

const RoadmapToImplementationPage: React.FC = () => {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { context, loading: contextLoading } = useBusinessContext(sessionId);
  const [isPreparing, setIsPreparing] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setIsPreparing(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await httpClient.post(`/angel/sessions/${sessionId}/roadmap-to-implementation-transition`);
      } catch (error) {
        console.warn('Transition prepare call failed (non-fatal):', error);
      } finally {
        if (!cancelled) {
          setIsPreparing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const handleBack = useCallback(() => {
    if (isStarting) return;
    if (sessionId) {
      navigate(`/ventures/${sessionId}/roadmap`);
    } else {
      navigate('/ventures');
    }
  }, [isStarting, navigate, sessionId]);

  const handleBeginImplementation = useCallback(async () => {
    if (!sessionId || isStarting) return;

    setIsStarting(true);
    try {
      const { data: subscriptionData } = await httpClient.get<{
        success?: boolean;
        has_active_subscription?: boolean;
        payment_failed?: boolean;
      }>('/stripe/check-subscription-status');

      if (
        !subscriptionData.success ||
        !subscriptionData.has_active_subscription ||
        subscriptionData.payment_failed
      ) {
        toast.error(
          'Subscription required to proceed to Implementation. Please subscribe to continue.',
        );
        return;
      }

      const { data } = await httpClient.post<{
        success: boolean;
        message?: string;
        requires_subscription?: boolean;
      }>(`/angel/sessions/${sessionId}/start-implementation`, {});

      if (data.success) {
        navigate(`/ventures/${sessionId}`, { replace: true });
      } else if (data.requires_subscription) {
        toast.error(data.message || 'Subscription required to proceed to Implementation');
      } else {
        toast.error(data.message || 'Failed to start implementation');
      }
    } catch (error) {
      console.error('Error starting implementation:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsStarting(false);
    }
  }, [isStarting, navigate, sessionId]);

  if (!sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-center text-gray-600">
        <p>Session not found.</p>
      </div>
    );
  }

  const isPageLoading = contextLoading || isPreparing;

  return (
    <RoadmapToImplementationTransition
      businessName={context.business_name}
      industry={context.industry}
      location={context.location}
      onBeginImplementation={handleBeginImplementation}
      onBack={handleBack}
      isStarting={isStarting}
      isPageLoading={isPageLoading}
    />
  );
};

export default RoadmapToImplementationPage;
