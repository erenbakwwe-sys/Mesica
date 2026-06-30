import { useCart } from '../context/CartContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Banknote, TrendingUp, ShoppingCart, Activity } from 'lucide-react';
import { isToday, isThisWeek, isThisMonth } from 'date-fns';
import { motion } from 'motion/react';

export function AdminDashboard() {
  const { orders } = useCart();

  // Calculate metrics
  const getRevenue = (ordersList: typeof orders, dateFilter: (date: Date) => boolean) => {
    return ordersList
      .filter(o => dateFilter(new Date(o.createdAt)))
      .reduce((sum, o) => {
        if (o.status === 'Ödeme Bekleniyor') {
          return sum + (o.paidAmount || 0);
        }
        // If not 'Ödeme Bekleniyor', it means it's fully paid (either initially or completed later)
        return sum + o.total;
      }, 0);
  };

  const getOrderCount = (ordersList: typeof orders, dateFilter: (date: Date) => boolean) => {
    return ordersList.filter(o => dateFilter(new Date(o.createdAt))).length;
  };

  const todayRevenue = getRevenue(orders, isToday);
  const todayOrdersCount = getOrderCount(orders, isToday);

  const weekRevenue = getRevenue(orders, (d) => isThisWeek(d, { weekStartsOn: 1 }));
  const weekOrdersCount = getOrderCount(orders, (d) => isThisWeek(d, { weekStartsOn: 1 }));

  const monthRevenue = getRevenue(orders, isThisMonth);
  const monthOrdersCount = getOrderCount(orders, isThisMonth);

  const activeOrdersCount = orders.filter(o => o.status !== 'Ödendi').length;

  const stats = [
    {
      title: "Günlük Ciro",
      value: `₺${todayRevenue.toFixed(2)}`,
      description: `${todayOrdersCount} sipariş tamamlandı`,
      icon: Banknote,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border border-emerald-500/20"
    },
    {
      title: "Haftalık Ciro",
      value: `₺${weekRevenue.toFixed(2)}`,
      description: `Bu hafta ${weekOrdersCount} sipariş`,
      icon: TrendingUp,
      color: "text-[#dcae61]",
      bg: "bg-[#dcae61]/10 border border-[#dcae61]/20"
    },
    {
      title: "Aylık Ciro",
      value: `₺${monthRevenue.toFixed(2)}`,
      description: `Bu ay ${monthOrdersCount} sipariş`,
      icon: Activity,
      color: "text-amber-500",
      bg: "bg-amber-500/10 border border-amber-500/20"
    },
    {
      title: "Aktif Siparişler",
      value: activeOrdersCount.toString(),
      description: "Şu an hazırlanan/bekleyen",
      icon: ShoppingCart,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border border-amber-500/15"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white font-sans">Finansal Durum & Özet</h2>
        <p className="text-neutral-400 font-medium text-xs sm:text-sm">Flux Zone Coffee anlık ve geçmiş performansı.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card className="card-3d border-none shadow-xl overflow-hidden hover:border-[#dcae61]/35 hover:translate-y-[-2px] transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0 p-6">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-neutral-400">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <p className="text-xs text-neutral-500 font-semibold mt-1.5">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
