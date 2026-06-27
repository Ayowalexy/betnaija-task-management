import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router/index';
import { ToastContainer } from './components/ui/Toast';
import { useAuthStore } from './store/authStore';

function AuthInit() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return null;
}

export default function App() {
  return (
    <>
      <AuthInit />
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  );
}
