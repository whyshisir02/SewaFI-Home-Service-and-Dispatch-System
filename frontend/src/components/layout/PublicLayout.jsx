import { Outlet } from 'react-router-dom';
import { Navbar } from '../common/Navbar';
import { Footer } from './Footer';

export function PublicLayout() {
  return (
    <div className="app-shell flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default PublicLayout;
