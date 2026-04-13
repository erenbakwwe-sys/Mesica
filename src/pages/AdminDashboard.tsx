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
      color: "text-green-600",
      bg: "bg-green-100"
    },
    {
      title: "Haftalık Ciro",
      value: `₺${weekRevenue.toFixed(2)}`,
      description: `Bu hafta ${weekOrdersCount} sipariş`,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-100"
    },
    {
      title: "Aylık Ciro",
      value: `₺${monthRevenue.toFixed(2)}`,
      description: `Bu ay ${monthOrdersCount} sipariş`,
      icon: Activity,
      color: "text-purple-600",
      bg: "bg-purple-100"
    },
    {
      title: "Aktif Siparişler",
      value: activeOrdersCount.toString(),
      description: "Şu an hazırlanan/bekleyen",
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-100"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Finansal Durum & Özet</h2>
        <p className="text-slate-500">Restoranınızın anlık ve geçmiş performansını takip edin.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <p className="text-xs text-slate-500 mt-1">
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
