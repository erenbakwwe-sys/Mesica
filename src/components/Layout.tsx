import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout() {
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const table = searchParams.get('table');
    if (table) {
      localStorage.setItem('current_table', table);
    }
  }, [location.search]);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-900 font-sans selection:bg-blue-200">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-blue-100 bg-white py-8 mt-auto">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} İzmir Deniz Restaurant. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
