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
  const { cart, callWaiter } = useCart();
  const [waiterCalled, setWaiterCalled] = useState(false);

  const links = [
    { name: 'Ana Sayfa', path: '/' },
    { name: 'Menü', path: '/menu' },
    { name: 'Siparişlerim', path: '/order' },
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
    <nav className="sticky top-0 z-50 w-full border-b border-blue-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-bold text-blue-600 tracking-tight">İzmir Deniz</span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex md:items-center md:gap-6 lg:gap-8">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                'text-sm font-medium transition-colors hover:text-blue-600',
                location.pathname === link.path ? 'text-blue-600' : 'text-slate-600'
              )}
            >
              {link.name}
            </Link>
          ))}
          
          <div className="flex items-center gap-3">
            <Button 
              variant={waiterCalled ? "default" : "outline"} 
              className={cn(
                "h-10 rounded-full px-4 transition-all",
                waiterCalled ? "bg-green-600 hover:bg-green-700 text-white border-none" : "border-blue-200 text-blue-600 hover:bg-blue-50"
              )}
              onClick={handleCallWaiter}
              disabled={waiterCalled}
            >
              <BellRing className="mr-2 h-4 w-4" />
              {waiterCalled ? 'Çağrıldı' : 'Garson Çağır'}
            </Button>

            <Link to="/order">
              <Button variant="outline" className="relative h-10 w-10 rounded-full p-0 border-blue-200 text-blue-600 hover:bg-blue-50">
                <ShoppingBag className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
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
              waiterCalled ? "bg-green-600 hover:bg-green-700 text-white border-none" : "border-blue-200 text-blue-600 hover:bg-blue-50"
            )}
            onClick={handleCallWaiter}
            disabled={waiterCalled}
          >
            <BellRing className="h-5 w-5" />
          </Button>

          <Link to="/order">
            <Button variant="outline" className="relative h-10 w-10 rounded-full p-0 border-blue-200 text-blue-600 hover:bg-blue-50">
              <ShoppingBag className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {cartItemsCount}
                </span>
              )}
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="text-slate-600">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-blue-100 bg-white px-4 py-4 shadow-lg">
          <div className="flex flex-col space-y-4">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'text-base font-medium transition-colors hover:text-blue-600',
                  location.pathname === link.path ? 'text-blue-600' : 'text-slate-600'
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
