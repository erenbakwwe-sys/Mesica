import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart, CartItem } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { BellRing, ChevronRight, Receipt, AlertCircle, QrCode } from 'lucide-react';
import { motion } from 'motion/react';

export function Order() {
  const { orders, callWaiter } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [waiterCalled, setWaiterCalled] = useState(false);

  useEffect(() => {
    const tableParam = searchParams.get('table');
    const storedTable = localStorage.getItem('current_table');
    if (tableParam) {
      setTableNumber(tableParam);
    } else if (storedTable) {
      setTableNumber(storedTable);
    }
  }, [searchParams]);

  const handleCallWaiter = () => {
    if (!tableNumber) return;
    callWaiter(tableNumber);
    setWaiterCalled(true);
    setTimeout(() => setWaiterCalled(false), 3000);
  };

  const handleGoToPayment = () => {
    if (!tableNumber) return;
    navigate(`/payment?table=${encodeURIComponent(tableNumber)}`);
  };

  // Find all active (unpaid) orders for this table
  const activeOrders = tableNumber ? orders.filter(o => o.table === tableNumber && o.status !== 'Ödendi') : [];

  // Combine items from all active orders for display
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

  // Financial calculations
  const totalOrderValue = activeOrders.reduce((sum, o) => sum + o.total, 0);
  const totalPaidSoFar = activeOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
  const combinedTotal = activeOrders.reduce((sum, o) => sum + (o.remainingAmount !== undefined ? o.remainingAmount : o.total), 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-3xl pb-16 text-[#f5f2eb]"
    >
      {/* Decorative Blur Spot */}
      <div className="absolute top-[5%] left-[-10%] w-72 h-72 rounded-full bg-[#dcae61]/5 blur-[100px] pointer-events-none" />

      {/* Header card styled dark-glowing */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between rounded-[2rem] bg-gradient-to-r from-[#181613] via-[#0f0e0c] to-[#0c0b09] border border-amber-950/15 p-6 gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            {tableNumber ? (
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white">{tableNumber} – Masa Hesabı</span>
            ) : (
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white">Masa Hesabı</span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-medium text-neutral-400">Masanıza ait güncel harcamaları ve hesabı takip edin.</p>
        </div>
        <Button
          onClick={handleCallWaiter}
          disabled={waiterCalled || !tableNumber}
          className={`rounded-full shrink-0 h-11 px-5 font-bold text-xs uppercase tracking-widest transition-all ${
            waiterCalled 
              ? 'bg-green-600 text-white' 
              : 'button-3d-primary'
          }`}
        >
          <BellRing className="mr-2 h-4 w-4" />
          {waiterCalled ? 'Çağrıldı' : 'Garson Çağır'}
        </Button>
      </div>

      {/* QR Code Scanned check */}
      {!tableNumber ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-amber-950/20 to-[#1e1a14]/60 border border-amber-900/20 rounded-3xl p-6 flex items-start gap-4 shadow-xl backdrop-blur-md"
        >
          <QrCode className="text-[#dcae61] h-7 w-7 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-[#dcae61] text-base">QR Kod Okutulmadı</h3>
            <p className="text-neutral-400 text-sm mt-1 leading-relaxed font-medium">
              Hesabınızı görüntüleyebilmek için lütfen masanızdaki QR kodu telefonunuzun kamerasıyla okutun ya da personellerimizden destek isteyin.
            </p>
          </div>
        </motion.div>
      ) : activeOrders.length === 0 ? (
        /* Empty bill state */
        <Card className="card-3d border-dashed border-2 border-amber-950/10 bg-[#0e0d0b]/40 text-center py-16 px-6 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center">
            <div className="rounded-2xl bg-[#dcae61]/10 p-4 text-[#dcae61] mb-5 border border-amber-950/15 shadow-md">
              <Receipt className="h-8 w-8" />
            </div>
            <CardTitle className="mb-2 text-xl font-bold text-white">Aktif Hesap Bulunmuyor</CardTitle>
            <CardDescription className="mb-8 text-sm text-neutral-400 max-w-md font-medium leading-relaxed">
              Şu anda masanız adına açılmış aktif bir hesap görünmüyor. Sipariş verdiyseniz, baristamız sisteme girdikten sonra faturanız burada belirecektir.
            </CardDescription>
            <Button onClick={() => navigate('/menu')} className="button-3d-primary rounded-full px-8 h-12 text-xs uppercase font-bold tracking-widest">
              Frekans Menüsünü İncele
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Orders list */
        <div className="flex flex-col gap-8">
          <Card className="card-3d overflow-hidden border-none shadow-xl">
            <CardHeader className="border-b border-amber-950/15 bg-neutral-900/40 p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-white">
                <Receipt className="h-5 w-5 text-[#dcae61]" />
                Masa Sipariş Detayları
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-amber-950/10">
                {combinedItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 p-6 hover:bg-white/2 transition-colors">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-amber-950/15 shadow-sm bg-neutral-950">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-white text-base">{item.name}</h4>
                          <p className="text-xs sm:text-sm font-semibold text-neutral-400 mt-1">₺{item.price.toFixed(2)} x {item.quantity}</p>
                        </div>
                        <span className="font-extrabold text-[#dcae61] text-base">₺{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Partial payment details */}
          {totalPaidSoFar > 0 && (
            <div className="bg-gradient-to-r from-blue-950/20 to-neutral-900/60 border border-blue-900/20 rounded-2xl p-5 flex items-start gap-3 shadow-md">
              <AlertCircle className="text-blue-400 h-6 w-6 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-300">
                  Bu masa hesabı için daha önce <span className="font-bold text-white bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/15">₺{totalPaidSoFar.toFixed(2)}</span> kısmi ödeme yapılmıştır.
                </p>
              </div>
            </div>
          )}

          {/* Checkout billing summary */}
          <Card className="card-3d border-none shadow-xl overflow-hidden">
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="flex justify-between text-xs sm:text-sm font-semibold text-neutral-400">
                <span>Toplam Masa Tutarı</span>
                <span className="font-bold text-neutral-200">₺{totalOrderValue.toFixed(2)}</span>
              </div>
              {totalPaidSoFar > 0 && (
                <div className="flex justify-between text-xs sm:text-sm font-semibold text-green-400">
                  <span>Ödenen Tutar</span>
                  <span className="font-bold">-₺{totalPaidSoFar.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-4 border-t border-amber-950/15 flex items-center justify-between text-base sm:text-lg font-extrabold text-white">
                <span>Kalan Ödenecek Tutar</span>
                <span className="text-2xl sm:text-3xl font-black text-[#dcae61] drop-shadow-[0_0_12px_rgba(220,174,97,0.15)]">₺{combinedTotal.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter className="bg-neutral-900/20 p-6 border-t border-amber-950/15">
              <Button 
                onClick={handleGoToPayment}
                className="w-full button-3d-primary rounded-full h-14 text-xs sm:text-sm uppercase font-bold tracking-widest"
              >
                Hesabı Sanal POS ile Öde
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </motion.div>
  );
}
