import { useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { TrendingUp, Award, DollarSign, Calendar, Coffee, Tag } from 'lucide-react';

export function AdminAnalytics() {
  const { orders } = useCart();

  // 1. Calculate and group data
  const analyticsData = useMemo(() => {
    if (!orders || orders.length === 0) return {
      categoryData: [],
      paymentData: [],
      productData: [],
      trendData: []
    };

    const categories: Record<string, number> = {};
    const payments: Record<string, number> = {};
    const products: Record<string, { name: string; quantity: number; revenue: number }> = {};
    const trends: Record<string, number> = {};

    orders.forEach(order => {
      const dateStr = new Date(order.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
      
      // Filter out unpaid/unresolved orders for financial charts to keep it robust
      const isPaid = order.status === 'Ödendi' || order.status === 'Ödeme Bekleniyor';
      const orderRev = order.status === 'Ödeme Bekleniyor' ? (order.paidAmount || 0) : (order.total || 0);

      // Track daily trends
      if (isPaid && orderRev > 0) {
        trends[dateStr] = (trends[dateStr] || 0) + orderRev;
      }

      // Track products and categories
      if (order.items) {
        order.items.forEach((item: any) => {
          const qty = item.quantity || 1;
          const price = item.price || 0;
          const itemRev = price * qty;
          const cat = item.category || 'Diğer';

          if (isPaid) {
            categories[cat] = (categories[cat] || 0) + itemRev;
          }

          if (products[item.name]) {
            products[item.name].quantity += qty;
            if (isPaid) products[item.name].revenue += itemRev;
          } else {
            products[item.name] = {
              name: item.name,
              quantity: qty,
              revenue: isPaid ? itemRev : 0
            };
          }
        });
      }

      // Track payment methods
      if (isPaid && orderRev > 0) {
        const method = order.paymentMethod || 'Diğer';
        payments[method] = (payments[method] || 0) + orderRev;
      }
    });

    // Format for Recharts
    const categoryData = Object.entries(categories).map(([name, value]) => ({ name, value }));
    const paymentData = Object.entries(payments).map(([name, value]) => ({ name, value }));
    const productData = Object.values(products)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
    const trendData = Object.entries(trends)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => {
        const [aDay, aMonth] = a.date.split('.');
        const [bDay, bMonth] = b.date.split('.');
        return new Date(2026, parseInt(aMonth) - 1, parseInt(aDay)).getTime() - new Date(2026, parseInt(bMonth) - 1, parseInt(bDay)).getTime();
      });

    return { categoryData, paymentData, productData, trendData };
  }, [orders]);

  const COLORS = ['#dcae61', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

  const totalSoldItems = useMemo(() => {
    if (!orders) return 0;
    return orders.reduce((sum, o) => sum + (o.items ? o.items.reduce((s, i) => s + (i.quantity || 1), 0) : 0), 0);
  }, [orders]);

  return (
    <div className="space-y-6 text-[#f5f2eb]">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white font-sans">Satiş Analitikleri & İstatistikler</h2>
        <p className="text-neutral-400 font-medium text-xs sm:text-sm">Flux Zone Coffee kafe satış performans grafikleri ve ürün analizleri.</p>
      </div>

      {/* Top statistics rows */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="card-3d border-none bg-neutral-900/60 p-5 flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row justify-between items-center space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-neutral-400">Toplam Sipariş Sayısı</CardTitle>
            <div className="p-2 rounded-xl bg-[#dcae61]/10 text-[#dcae61] border border-amber-950/15">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-black text-white">{orders ? orders.length : 0} Adet</div>
            <p className="text-xs text-neutral-500 font-semibold mt-1">Sistemdeki tüm kayıtlı masaların tur sayıları</p>
          </CardContent>
        </Card>

        <Card className="card-3d border-none bg-neutral-900/60 p-5 flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row justify-between items-center space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-neutral-400">Satılan Toplam Ürün</CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
              <Coffee className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-black text-white">{totalSoldItems} Porsiyon</div>
            <p className="text-xs text-neutral-500 font-semibold mt-1">Sipariş edilen toplam yiyecek/içecek kalemi</p>
          </CardContent>
        </Card>

        <Card className="card-3d border-none bg-neutral-900/60 p-5 flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row justify-between items-center space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-neutral-400">Ortalama Sepet Tutarı</CardTitle>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/15">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-black text-white">
              ₺{orders && orders.length > 0 
                ? (orders.reduce((sum, o) => sum + (o.total || 0), 0) / orders.length).toFixed(1) 
                : '0.00'}
            </div>
            <p className="text-xs text-neutral-500 font-semibold mt-1">Masa başına ortalama hesap tutarı</p>
          </CardContent>
        </Card>
      </div>

      {/* Render Charts */}
      {(!orders || orders.length === 0) ? (
        <Card className="card-3d border-dashed border-2 border-amber-950/15 bg-neutral-900/40 text-center py-16">
          <CardContent className="flex flex-col items-center justify-center">
            <TrendingUp className="h-8 w-8 text-[#dcae61] mb-5" />
            <CardTitle className="mb-2 text-xl font-bold text-white">Yetersiz Sipariş Verisi</CardTitle>
            <CardDescription className="text-neutral-400 font-medium">İstatistiklerin çizilebilmesi için öncelikle sisteme en az bir sipariş kaydı girilmelidir.</CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Line Chart: Daily Revenue Trend */}
          <Card className="card-3d border-none bg-neutral-900/40 p-5">
            <CardHeader className="p-0 pb-5">
              <CardTitle className="text-base font-bold text-white flex items-center gap-1.5">
                <TrendingUp className="w-5 h-5 text-[#dcae61]" /> Günlük Ciro Dağılımı (₺)
              </CardTitle>
              <CardDescription className="text-neutral-400">Son günlerin finansal ciro dalgalanmaları.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="date" stroke="#737373" fontSize={11} fontWeight={600} />
                  <YAxis stroke="#737373" fontSize={11} fontWeight={600} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#dcae61', borderRadius: '12px', color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="amount" name="Ciro" stroke="#dcae61" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart: Payment Methods Distribution */}
          <Card className="card-3d border-none bg-neutral-900/40 p-5">
            <CardHeader className="p-0 pb-5">
              <CardTitle className="text-base font-bold text-white flex items-center gap-1.5">
                <DollarSign className="w-5 h-5 text-[#dcae61]" /> Ödeme Yöntemi Tercihleri
              </CardTitle>
              <CardDescription className="text-neutral-400">Müşterilerin ödemede en çok kullandığı yöntemler.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-[280px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.paymentData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {analyticsData.paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '12px', color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs font-semibold text-neutral-300">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar Chart: Sales by Category */}
          <Card className="card-3d border-none bg-neutral-900/40 p-5">
            <CardHeader className="p-0 pb-5">
              <CardTitle className="text-base font-bold text-white flex items-center gap-1.5">
                <Tag className="w-5 h-5 text-[#dcae61]" /> Kategori Bazlı Satış Hacmi
              </CardTitle>
              <CardDescription className="text-neutral-400">Kategorilere göre ciro katkısı.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="name" stroke="#737373" fontSize={11} fontWeight={600} />
                  <YAxis stroke="#737373" fontSize={11} fontWeight={600} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#dcae61', borderRadius: '12px', color: '#fff' }}
                  />
                  <Bar dataKey="value" name="Ciro (₺)" fill="#dcae61" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar Chart: Most Popular Products */}
          <Card className="card-3d border-none bg-neutral-900/40 p-5">
            <CardHeader className="p-0 pb-5">
              <CardTitle className="text-base font-bold text-white flex items-center gap-1.5">
                <Award className="w-5 h-5 text-[#dcae61]" /> En Popüler 5 Ürün (Adet)
              </CardTitle>
              <CardDescription className="text-neutral-400">Satış adedine göre Flux Zone Coffee favorileri.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.productData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis type="number" stroke="#737373" fontSize={11} fontWeight={600} />
                  <YAxis dataKey="name" type="category" stroke="#737373" fontSize={10} fontWeight={600} width={110} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#dcae61', borderRadius: '12px', color: '#fff' }}
                  />
                  <Bar dataKey="quantity" name="Satış Adedi" fill="#10b981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
