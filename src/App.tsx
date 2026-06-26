import { RouterProvider } from 'react-router-dom';
import { router } from './router/index';
import { ToastContainer } from './components/ui/Toast';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  );
}
