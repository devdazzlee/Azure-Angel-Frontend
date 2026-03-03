import { useEffect } from "react"
import { RouterProvider } from "react-router-dom"
import router from "./routes/AppRouter"
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Handle auth hash redirects before React Router loads
const handleAuthHashRedirect = () => {
  const hash = window.location.hash;
  if (hash) {
    const hashParams = new URLSearchParams(hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    const error = hashParams.get('error');
    const errorCode = hashParams.get('error_code');
    
    // If it's a recovery token or has recovery-related errors, redirect to reset-password page
    if ((accessToken && type === 'recovery') || error || errorCode) {
      const currentPath = window.location.pathname;
      
      // Only redirect if we're not already on the reset-password page
      if (currentPath !== '/reset-password' && currentPath !== '/reset-password/') {
        // Preserve the hash when redirecting
        window.location.replace(`/reset-password${hash}`);
        return true; // Indicate redirect happened
      }
    }
  }
  return false;
};

const App = () => {
  useEffect(() => {
    // Handle redirect on mount (in case script didn't catch it)
    handleAuthHashRedirect();
  }, []);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        closeOnClick
        pauseOnHover
        theme="light"
      />
      <RouterProvider router={router} />
    </>
  )
}

export default App