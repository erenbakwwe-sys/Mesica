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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-10 pb-32 text-[#f5f2eb]"
    >
      {/* Decorative Blur Spot */}
      <div className="absolute top-[10%] right-[-10%] w-80 h-80 rounded-full bg-[#dcae61]/5 blur-[120px] pointer-events-none" />

      {/* Header and Category Filters */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#dcae61] uppercase block mb-1">BARİSTA SEÇİMİ</span>
          <h1 className="text-3xl sm:text-4.5xl font-black tracking-tight text-white">Frekans Menüsü</h1>
          <p className="text-neutral-400 mt-1.5 font-medium text-sm sm:text-base">
            Baristalarımızın elinden taze demlenmiş üçüncü dalga kahvelerimiz ve sıcak spesiyallerimiz.
          </p>
        </div>
        
        {/* Category buttons styled beautifully */}
        <div className="flex flex-wrap gap-2.5">
          {categories.map((category) => (
            <Button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`rounded-full h-10 px-5 text-sm font-semibold transition-all ${
                activeCategory === category 
                  ? 'button-3d-primary border-none shadow-[0_0_12px_rgba(220,174,97,0.25)]' 
                  : 'button-3d-secondary border-amber-950/20 text-neutral-300'
              }`}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* No Table QR Scanner Alert Card */}
      {!currentTable ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-amber-950/20 to-[#1e1a14]/60 border border-amber-900/20 rounded-3xl p-6 flex items-start gap-4 shadow-xl backdrop-blur-md"
        >
          <div className="p-3 bg-[#dcae61]/10 text-[#dcae61] rounded-2xl border border-[#dcae61]/10">
            <QrCode className="h-6 w-6 shrink-0" />
          </div>
          <div>
            <h3 className="font-bold text-[#dcae61] text-base sm:text-lg">Masadaki QR Kodu Okutun</h3>
            <p className="text-neutral-400 text-xs sm:text-sm mt-1 leading-relaxed font-medium">
              Hesabınızı anında görmek, siparişlerini takip etmek ve masanıza hızlıca garson çağırabilmek için lütfen masanızdaki QR kodu telefonunuzun kamerasıyla okutun veya personellerimizden destek isteyin.
            </p>
          </div>
        </motion.div>
      ) : (
        /* Active Table Information Bar */
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-[#181613]/80 via-[#100f0d]/90 to-[#181613]/70 border border-amber-950/15 rounded-[1.8rem] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-xl backdrop-blur-md"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#dcae61]/10 text-[#dcae61] rounded-2xl border border-amber-900/10">
              <Receipt className="h-6 w-6 shrink-0" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                {currentTable} <span className="text-[10px] tracking-wider uppercase bg-[#dcae61]/10 text-[#dcae61] border border-[#dcae61]/20 px-2.5 py-0.5 rounded-full font-extrabold">Aktif Masa</span>
              </h3>
              <p className="text-neutral-400 text-xs sm:text-sm mt-1 leading-relaxed max-w-xl font-medium">
                Siparişinizi oluşturmak için garsonumuz saniyeler içerisinde masanızda olacaktır. Kahvenizin veya atıştırmalıklarınızın ardından hesabınızı dilediğiniz an bu ekrandan güvenli sanal POS ile ödeyebilirsiniz.
              </p>
            </div>
          </div>
          <Button
            onClick={handleCallWaiter}
            disabled={waiterCalled}
            className={`rounded-full shrink-0 h-12 px-6 font-bold text-xs uppercase tracking-widest transition-all ${
              waiterCalled 
                ? 'bg-green-600 text-white' 
                : 'button-3d-primary'
            }`}
          >
            <BellRing className="mr-2 h-4 w-4" />
            {waiterCalled ? 'Garson Çağrıldı' : 'Garsonu Çağır'}
          </Button>
        </motion.div>
      )}

      {/* Active Unpaid Bill Information Box */}
      {hasActiveBill && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-950/20 to-neutral-900/60 border border-emerald-900/20 rounded-3xl p-6 flex items-start gap-4 shadow-xl backdrop-blur-md"
        >
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <AlertCircle className="h-6 w-6 shrink-0" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-400 text-base sm:text-lg">Masanızda Ödenmeyi Bekleyen Hesap Var</h3>
            <p className="text-neutral-400 text-xs sm:text-sm mt-1.5 leading-relaxed font-medium">
              Masanıza girilen aktif siparişler bulunuyor. Kalan Toplam Tutar: <span className="font-extrabold text-lg text-white bg-emerald-500/15 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">₺{combinedTotal.toFixed(2)}</span>.
              Aşağıdaki butona veya "Hesabım" sekmesine tıklayarak sanal POS ile güvenli ve kolayca ödeme yapabilirsiniz.
            </p>
          </div>
        </motion.div>
      )}

      {/* Menu Cards Grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item, index) => {
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <Card className="card-3d card-3d-hover overflow-hidden h-full flex flex-col border-none">
                <div className="aspect-[4/3] overflow-hidden bg-neutral-900 relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 badge-glass border-amber-950/20 shadow-md rounded-2xl px-4 py-1.5 font-black text-[#dcae61] text-base">
                    ₺{item.price}
                  </div>
                </div>
                <CardHeader className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-white hover:text-[#dcae61] transition-colors">{item.name}</CardTitle>
                    <CardDescription className="mt-2.5 text-xs sm:text-sm text-neutral-400 leading-relaxed font-medium">
                      {item.description.length > 80 && !expandedItems[item.id] ? (
                        <>
                          {item.description.slice(0, 80)}...
                          <button 
                            onClick={() => toggleExpand(item.id)}
                            className="text-[#dcae61] font-bold ml-1 hover:underline focus:outline-none"
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
                              className="text-[#dcae61] font-bold ml-1 hover:underline focus:outline-none"
                            >
                              kısalt
                             </button>
                          )}
                        </>
                      )}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Floating Bottom Unpaid Bill bar */}
      <AnimatePresence>
        {hasActiveBill && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-[#0e0d0b]/90 backdrop-blur-md border-t border-amber-950/25 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest">Masa Güncel Hesabı</span>
                <span className="text-2xl font-black text-[#dcae61]">₺{combinedTotal.toFixed(2)}</span>
              </div>
              <Button 
                size="lg" 
                className="button-3d-primary rounded-full px-8 h-12 text-xs uppercase font-bold tracking-widest"
                onClick={() => navigate('/order')}
              >
                Hesabı Öde
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
