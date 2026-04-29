import { Outlet } from 'react-router-dom';
import AnalyticsTracker from '../components/AnalyticsTracker';

const RootLayout = () => {
  return (
    <>
      <AnalyticsTracker />
      <Outlet />
    </>
  );
};

export default RootLayout;
