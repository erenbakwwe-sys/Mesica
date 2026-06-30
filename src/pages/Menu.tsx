import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { ChevronRight, AlertCircle, QrCode, Receipt, BellRing } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export function Menu() {
  const { menuItems, orders, callWaiter } = useCart();
  const [activeCategory, setActiveCategory] = useState<string>('Tümü');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [waiterCalled, setWaiterCalled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const urlTable = searchParams.get('table');
  const currentTable = urlTable || localStorage.getItem('current_table');

  useEffect(() => {
    if (urlTable) {
      localStorage.setItem('current_table', urlTable);
    }
  }, [urlTable]);

  // Calculate combined unpaid total for this table
  const tableOrders = currentTable ? orders.filter(o => o.table === currentTable && o.status !== 'Ödendi') : [];
  const combinedTotal = tableOrders.reduce((sum, o) => sum + (o.remainingAmount !== undefined ? o.remainingAmount : o.total), 0);
  const hasActiveBill = combinedTotal > 0;

  const categories = ['Tümü', ...Array.from(new Set(menuItems.map((item) => item.category)))];

  const filteredItems = activeCategory === 'Tümü' 
    ? menuItems 
    : menuItems.filter((item) => item.category === activeCategory);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCallWaiter = () => {
    if (!currentTable) {
      toast.error("Lütfen garson çağırmak için masanızdaki QR kodu okutun.");
      return;
    }
    callWaiter(currentTable);
    setWaiterCalled(true);
    setTimeout(() => setWaiterCalled(false), 3000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-8 pb-28"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dijital Menü</h1>
          <p className="text-slate-500 mt-1">Geniş menümüzü inceleyin. Siparişleriniz masanızda garsonlarımızca alınacaktır.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {!currentTable ? (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4 shadow-sm"
        >
          <QrCode className="text-amber-600 h-6 w-6 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 text-base">QR Kod Okutulmadı</h3>
            <p className="text-amber-700 text-sm mt-1 leading-relaxed">
              Hesabınızı görebilmek ve masanıza garson çağırabilmek için lütfen masanızdaki QR kodu telefonunuzun kamerasıyla okutun.
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-4">
            <Receipt className="text-blue-600 h-6 w-6 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-blue-900 text-lg">{currentTable} – Bilgilendirme</h3>
              <p className="text-blue-700 text-sm mt-1 leading-relaxed max-w-xl">
                Siparişlerinizi her zamanki gibi garsonumuz gelip masanızda alacaktır. Yemek sonrası hesabınızı dilediğiniz an bu ekrandan, dilediğiniz şekilde sanal POS ile ödeyebilirsiniz.
              </p>
            </div>
          </div>
          <Button
            variant={waiterCalled ? "default" : "outline"}
            className={`rounded-full shrink-0 h-11 px-5 transition-all ${waiterCalled ? 'bg-green-600 hover:bg-green-700 text-white border-none' : 'border-blue-200 text-blue-600 hover:bg-blue-100 bg-white'}`}
            onClick={handleCallWaiter}
            disabled={waiterCalled}
          >
            <BellRing className="mr-2 h-4 w-4" />
            {waiterCalled ? 'Garson Çağrıldı' : 'Garsonu Çağır'}
          </Button>
        </motion.div>
      )}

      {hasActiveBill && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-3 shadow-sm"
        >
          <AlertCircle className="text-green-600 h-6 w-6 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900 text-base">Masanızda Ödenmeyi Bekleyen Hesap Var</h3>
            <p className="text-green-700 text-sm mt-1">
              Masanıza girilen aktif siparişler bulunuyor. Kalan Toplam Tutar: <span className="font-bold text-lg text-green-900">₺{combinedTotal.toFixed(2)}</span>.
              Aşağıdaki butona veya "Hesabım" sekmesine tıklayarak sanal POS ile güvenli ödeme yapabilirsiniz.
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item, index) => {
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Card className="overflow-hidden h-full flex flex-col border-none shadow-sm hover:shadow-md transition-all">
                <div className="aspect-[4/3] overflow-hidden bg-slate-100 relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm shadow-md rounded-full px-4 py-1.5 font-bold text-blue-600 text-sm">
                    ₺{item.price}
                  </div>
                </div>
                <CardHeader className="p-5 flex-1">
                  <CardTitle className="text-xl text-slate-900">{item.name}</CardTitle>
                  <CardDescription className="mt-2 text-sm text-slate-500 leading-relaxed">
                    {item.description.length > 80 && !expandedItems[item.id] ? (
                      <>
                        {item.description.slice(0, 80)}...
                        <button 
                          onClick={() => toggleExpand(item.id)}
                          className="text-blue-600 font-medium ml-1 hover:underline focus:outline-none"
                        >
                          devamı...
                        </button>
                      </>
                    ) : (
                      <>
                        {item.description}
                        {item.description.length > 80 && (
                          <button 
                            onClick={() => toggleExpand(item.id)}
                            className="text-blue-600 font-medium ml-1 hover:underline focus:outline-none"
                          >
                            kısalt
                          </button>
                        )}
                      </>
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {hasActiveBill && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
          >
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 font-medium">Masa Güncel Hesabı</span>
                <span className="text-xl font-bold text-blue-600">₺{combinedTotal.toFixed(2)}</span>
              </div>
              <Button 
                size="lg" 
                className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                onClick={() => navigate('/order')}
              >
                Hesabı Öde
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
