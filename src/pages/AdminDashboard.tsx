import { useCart } from '../context/CartContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Banknote, TrendingUp, ShoppingCart, Activity } from 'lucide-react';
import { isToday, isThisWeek, isThisMonth } from 'date-fns';
import { motion } from 'motion/react';

export function AdminDashboard() {
  const { orders } = useCart();

  // Filter only paid orders for revenue calculations
  const paidOrders = orders.filter(o => o.status === 'Ödendi');

  // Calculate metrics
  const todayOrders = paidOrders.filter(o => isToday(new Date(o.createdAt)));
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

  const weekOrders = paidOrders.filter(o => isThisWeek(new Date(o.createdAt), { weekStartsOn: 1 }));
  const weekRevenue = weekOrders.reduce((sum, o) => sum + o.total, 0);

  const monthOrders = paidOrders.filter(o => isThisMonth(new Date(o.createdAt)));
  const monthRevenue = monthOrders.reduce((sum, o) => sum + o.total, 0);

  const activeOrdersCount = orders.filter(o => o.status !== 'Ödendi').length;

  const stats = [
    {
      title: "Günlük Ciro",
      value: `₺${todayRevenue.toFixed(2)}`,
      description: `${todayOrders.length} sipariş tamamlandı`,
      icon: Banknote,
      color: "text-green-600",
      bg: "bg-green-100"
    },
    {
      title: "Haftalık Ciro",
      value: `₺${weekRevenue.toFixed(2)}`,
      description: `Bu hafta ${weekOrders.length} sipariş`,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-100"
    },
    {
      title: "Aylık Ciro",
      value: `₺${monthRevenue.toFixed(2)}`,
      description: `Bu ay ${monthOrders.length} sipariş`,
      icon: Activity,
      color: "text-purple-600",
      bg: "bg-purple-100"
    },
    {
      title: "Aktif Siparişler",
      value: activeOrdersCount.toString(),
      description: "Şu an hazırlanan/bekleyen",
      icon: ShoppingCart,
      color: "text-orange-600",
      bg: "bg-orange-100"
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
