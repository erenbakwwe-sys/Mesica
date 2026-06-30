import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, BellRing } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { toast } from 'sonner';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { cart, callWaiter, useLocalFallback, setUseLocalFallback } = useCart();
  const [waiterCalled, setWaiterCalled] = useState(false);

  const links = [
    { name: 'Ana Sayfa', path: '/' },
    { name: 'Menü', path: '/menu' },
    { name: 'Hesabım', path: '/order' },
    { name: 'Admin', path: '/admin' },
  ];

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleCallWaiter = () => {
    const currentTable = localStorage.getItem('current_table');
    if (!currentTable) {
      toast.error("Lütfen garson çağırmak için masanızdaki QR kodu okutun.");
      return;
    }
    callWaiter(currentTable);
    setWaiterCalled(true);
    setTimeout(() => setWaiterCalled(false), 3000);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-amber-950/15 bg-[#0e0d0b]/80 backdrop-blur-md text-[#f5f2eb]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg sm:text-xl font-black text-white tracking-widest flex items-center gap-2">
              <span className="text-[#dcae61] text-2xl font-black drop-shadow-[0_0_10px_rgba(220,174,97,0.4)]">▲</span> 
              FLUX ZONE
            </span>
          </Link>
          {useLocalFallback && (
            <button
              onClick={() => {
                if (window.confirm("Çevrimdışı/Yerel Mod etkin. Sunucu kotası dolduğunda veya bağlantı koptuğunda veri kaybı yaşamamanız için otomatik açıldı. Yeniden çevrimiçi bağlanmayı denemek istiyor musunuz?")) {
                  localStorage.removeItem('firebase_quota_fallback');
                  setUseLocalFallback(false);
                  window.location.reload();
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse hover:bg-amber-500/20 transition-all cursor-pointer"
              title="Yerel Depolama Modu Aktif. Tıklayarak çevrimiçi modunu tekrar deneyebilirsiniz."
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
              Yerel Mod
            </button>
          )}
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex md:items-center md:gap-6 lg:gap-8">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                'text-sm font-semibold tracking-wide transition-colors hover:text-[#dcae61]',
                location.pathname === link.path ? 'text-[#dcae61]' : 'text-neutral-400'
              )}
            >
              {link.name}
            </Link>
          ))}
          
          <div className="flex items-center gap-3">
            <Button 
              variant={waiterCalled ? "default" : "outline"} 
              className={cn(
                "h-10 rounded-full px-4 transition-all font-semibold",
                waiterCalled 
                  ? "bg-green-600 hover:bg-green-700 text-white border-none" 
                  : "border-amber-900/30 text-[#dcae61] hover:bg-amber-950/20 hover:text-white bg-transparent"
              )}
              onClick={handleCallWaiter}
              disabled={waiterCalled}
            >
              <BellRing className="mr-2 h-4 w-4" />
              {waiterCalled ? 'Çağrıldı' : 'Garson Çağır'}
            </Button>

            <Link to="/order">
              <Button variant="outline" className="relative h-10 w-10 rounded-full p-0 border-amber-900/30 text-[#dcae61] hover:bg-amber-950/20 hover:text-white bg-transparent">
                <ShoppingBag className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-[#dcae61] to-[#ca8a04] text-[10px] font-black text-slate-950 shadow-sm">
                    {cartItemsCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Nav Toggle */}
        <div className="flex items-center gap-2 sm:gap-4 md:hidden">
          <Button 
            variant={waiterCalled ? "default" : "outline"} 
            size="icon"
            className={cn(
              "relative h-10 w-10 rounded-full p-0 transition-all",
              waiterCalled 
                ? "bg-green-600 hover:bg-green-700 text-white border-none" 
                : "border-amber-900/30 text-[#dcae61] hover:bg-amber-950/20 hover:text-white bg-transparent"
            )}
            onClick={handleCallWaiter}
            disabled={waiterCalled}
          >
            <BellRing className="h-5 w-5" />
          </Button>

          <Link to="/order">
            <Button variant="outline" className="relative h-10 w-10 rounded-full p-0 border-amber-900/30 text-[#dcae61] hover:bg-amber-950/20 hover:text-white bg-transparent">
              <ShoppingBag className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-[#dcae61] to-[#ca8a04] text-[10px] font-black text-slate-950">
                  {cartItemsCount}
                </span>
              )}
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="text-neutral-400 hover:text-white">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-amber-950/15 bg-[#0e0d0b] px-4 py-4 shadow-lg">
          <div className="flex flex-col space-y-4">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'text-base font-medium transition-colors',
                  location.pathname === link.path ? 'text-[#dcae61]' : 'text-neutral-400 hover:text-white'
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
