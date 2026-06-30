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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-3xl pb-12"
    >
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl bg-blue-50 p-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {tableNumber ? (
              <span className="text-2xl font-bold tracking-tight text-slate-900">{tableNumber} – Masa Hesabı</span>
            ) : (
              <span className="text-2xl font-bold tracking-tight text-slate-900">Masa Hesabı</span>
            )}
          </div>
          <p className="text-slate-500">Masanıza ait güncel harcamaları ve hesabı görün.</p>
        </div>
        <Button
          variant={waiterCalled ? "default" : "outline"}
          className={`rounded-full shrink-0 h-11 px-5 transition-all ${waiterCalled ? 'bg-green-600 hover:bg-green-700 text-white border-none' : 'border-blue-200 text-blue-600 hover:bg-blue-100 bg-white'}`}
          onClick={handleCallWaiter}
          disabled={waiterCalled || !tableNumber}
        >
          <BellRing className="mr-2 h-4 w-4" />
          {waiterCalled ? 'Garson Çağrıldı' : 'Garsonu Çağır'}
        </Button>
      </div>

      {!tableNumber ? (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4 shadow-sm"
        >
          <QrCode className="text-amber-600 h-6 w-6 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 text-base">QR Kod Okutulmadı</h3>
            <p className="text-amber-700 text-sm mt-1 leading-relaxed">
              Hesabınızı görüntüleyebilmek için lütfen masanızdaki QR kodu telefonunuzun kamerasıyla okutun.
            </p>
          </div>
        </motion.div>
      ) : activeOrders.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 text-center py-16">
          <CardContent className="flex flex-col items-center justify-center">
            <div className="rounded-full bg-slate-100 p-4 text-slate-400 mb-4">
              <Receipt className="h-8 w-8" />
            </div>
            <CardTitle className="mb-2 text-slate-800">Aktif Hesap Bulunmuyor</CardTitle>
            <CardDescription className="mb-6 text-slate-500 max-w-md">
              Şu anda masanız adına açılmış aktif bir hesap görünmüyor. Sipariş verdiyseniz, garsonumuz sisteme girdikten sonra hesabınız burada belirecektir.
            </CardDescription>
            <Button onClick={() => navigate('/menu')} className="rounded-full bg-blue-600 hover:bg-blue-700 px-6">
              Menüyü İncele
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden border-none shadow-md">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                <Receipt className="h-5 w-5 text-blue-600" />
                Masa Sipariş Detayları
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-slate-100">
                {combinedItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 p-6 hover:bg-slate-50/50 transition-colors">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
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
                          <h4 className="font-semibold text-slate-900 text-base">{item.name}</h4>
                          <p className="text-sm text-slate-500 mt-1">₺{item.price.toFixed(2)} x {item.quantity}</p>
                        </div>
                        <span className="font-bold text-slate-900">₺{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {totalPaidSoFar > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="text-blue-600 h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800">
                  Bu masa hesabı için daha önce <span className="font-semibold">₺{totalPaidSoFar.toFixed(2)}</span> kısmi ödeme yapılmıştır.
                </p>
              </div>
            </div>
          )}

          <Card className="border-none shadow-md">
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Toplam Masa Tutarı</span>
                <span className="font-medium">₺{totalOrderValue.toFixed(2)}</span>
              </div>
              {totalPaidSoFar > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Ödenen Tutar</span>
                  <span className="font-medium">-₺{totalPaidSoFar.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-lg font-bold text-slate-900">
                <span>Kalan Tutar</span>
                <span className="text-2xl text-blue-600">₺{combinedTotal.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 p-6">
              <Button 
                size="lg" 
                className="w-full rounded-full h-14 text-base bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-100" 
                onClick={handleGoToPayment}
              >
                Hesabı Sanal POS ile Öde
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </motion.div>
  );
}
