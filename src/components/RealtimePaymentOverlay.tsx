import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart, CartItem } from '../context/CartContext';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { Receipt, CreditCard, X, ChevronRight, Sparkles, Coffee } from 'lucide-react';
import { playSound } from '../lib/sounds';

export function RealtimePaymentOverlay() {
  const { orders } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentTable, setCurrentTable] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [prevUnpaidCount, setPrevUnpaidCount] = useState(0);
  const [prevTotal, setPrevTotal] = useState(0);

  // Sync current table from URL or localStorage
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tableParam = searchParams.get('table');
    const storedTable = localStorage.getItem('current_table');
    if (tableParam) {
      setCurrentTable(tableParam);
    } else if (storedTable) {
      setCurrentTable(storedTable);
    } else {
      setCurrentTable(null);
    }
  }, [location.search, location.pathname]);

  // Find active orders for this table
  const activeOrders = currentTable ? orders.filter(o => o.table === currentTable && o.status !== 'Ödendi') : [];
  const unpaidCount = activeOrders.length;
  const combinedTotal = activeOrders.reduce((sum, o) => sum + (o.remainingAmount !== undefined ? o.remainingAmount : o.total), 0);

  // Combine items for display
  const combinedItemsMap: Record<string, CartItem> = {};
  activeOrders.forEach(order => {
    order.items.forEach(item => {
      if (combinedItemsMap[item.id]) {
        combinedItemsMap[item.id].quantity += item.quantity;
      } else {
        combinedItemsMap[item.id] = { ...item };
      }
    });
  });
  const combinedItems = Object.values(combinedItemsMap);

  // Detect new orders in real-time
  useEffect(() => {
    if (!currentTable) return;

    // Check if a new unpaid order was added OR the unpaid amount increased
    if (unpaidCount > prevUnpaidCount || combinedTotal > prevTotal) {
      // Avoid showing if the user is already on the payment page to prevent duplicate screens
      if (location.pathname !== '/payment' && prevTotal > 0) {
        setShowOverlay(true);
        playSound('new_order');
      }
    }

    setPrevUnpaidCount(unpaidCount);
    setPrevTotal(combinedTotal);
  }, [unpaidCount, combinedTotal, currentTable, location.pathname, prevUnpaidCount, prevTotal]);

  const handleGoToPayment = () => {
    if (!currentTable) return;
    setShowOverlay(false);
    navigate(`/payment?table=${encodeURIComponent(currentTable)}`);
  };

  if (!currentTable || activeOrders.length === 0 || !showOverlay) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
        {/* Animated backdrop tap to close */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={() => setShowOverlay(false)}
        />

        <motion.div
          initial={{ y: -100, scale: 0.95, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: -100, scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg mt-12 bg-gradient-to-b from-[#181613] to-[#0c0b09] border border-[#dcae61]/30 rounded-[2.5rem] shadow-[0_20px_50px_rgba(220,174,97,0.15)] overflow-hidden text-[#f5f2eb]"
        >
          {/* Subtle Golden Glow Element */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-[#dcae61]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={() => setShowOverlay(false)}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/5 text-neutral-400 hover:text-white transition-all z-10 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-6 sm:p-8">
            {/* Title Block */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#dcae61]/10 text-[#dcae61] rounded-2xl border border-[#dcae61]/20 animate-pulse">
                <Coffee className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest text-[#dcae61] uppercase block">ANLIK BİLDİRİM</span>
                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
                  Masanıza Sipariş Eklendi! <Sparkles className="h-4 w-4 text-[#dcae61] inline" />
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-medium text-neutral-300 mb-6 leading-relaxed">
              Baristamız masanız ({currentTable}) adına yeni bir sipariş girdi. Sipariş detaylarını aşağıda görebilir, dilerseniz sanal POS ile anında ödeyebilirsiniz.
            </p>

            {/* List of items */}
            <div className="max-h-48 overflow-y-auto mb-6 pr-1 divide-y divide-amber-950/15 border-t border-b border-amber-950/15">
              {combinedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="h-10 w-10 rounded-xl object-cover border border-amber-950/10" 
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <span className="font-bold text-sm text-white">{item.name}</span>
                      <span className="text-xs text-neutral-400 block font-medium">₺{item.price.toFixed(2)} x {item.quantity}</span>
                    </div>
                  </div>
                  <span className="font-extrabold text-[#dcae61] text-sm">₺{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Total Block */}
            <div className="bg-neutral-900/40 rounded-2xl p-4 border border-amber-950/10 flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest">Ödenecek Toplam Hesap</span>
                <span className="text-2xl font-black text-[#dcae61] drop-shadow-[0_0_8px_rgba(220,174,97,0.2)]">₺{combinedTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-3 py-1 rounded-full font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                Sanal POS Aktif
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setShowOverlay(false)}
                className="flex-1 rounded-full h-12 text-xs uppercase font-extrabold tracking-widest border-amber-950/20 text-neutral-300 button-3d-secondary"
              >
                Daha Sonra Öde
              </Button>
              <Button
                onClick={handleGoToPayment}
                className="flex-1 rounded-full h-12 text-xs uppercase font-extrabold tracking-widest button-3d-primary"
              >
                <CreditCard className="mr-1.5 h-4 w-4" />
                Hemen Öde
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
