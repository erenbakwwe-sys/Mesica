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
    <div className="min-h-screen bg-gradient-to-b from-[#0e0d0b] via-[#161411] to-[#0c0b09] text-[#f5f2eb] font-sans selection:bg-[#dcae61]/30 selection:text-white flex flex-col relative overflow-hidden">
      {/* Decorative Warm Ambient Glow Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] bg-[#dcae61]/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[50%] bg-amber-950/20 rounded-full blur-[140px] pointer-events-none" />
      
      <div className="bg-wave-pattern" />
      <Navbar />
      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 z-10">
        <Outlet />
      </main>
      <footer className="border-t border-amber-950/15 bg-[#090807]/90 backdrop-blur-md py-8 mt-auto z-10">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-neutral-500">
          <p>&copy; {new Date().getFullYear()} FLUX Zone Coffee. Tüm hakları saklıdır.</p>
          <p className="text-xs text-neutral-600 mt-1">Feel the Frequency • Akışta Kal</p>
        </div>
      </footer>
    </div>
  );
}
