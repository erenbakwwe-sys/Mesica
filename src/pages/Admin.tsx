import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Clock, CheckCircle2, ChefHat, LogOut, Play, Check, ListOrdered, UtensilsCrossed, BellRing } from 'lucide-react';
import { motion } from 'motion/react';
import { AdminLogin } from './AdminLogin';
import { AdminMenu } from './AdminMenu';

export function Admin() {
  const { orders, updateOrderStatus, waiterCalls, resolveWaiterCall } = useCart();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'waiter'>('orders');
  
  const activeWaiterCalls = waiterCalls ? waiterCalls.filter(c => !c.resolved) : [];

  useEffect(() => {
    const loggedIn = sessionStorage.getItem('casa_mexicana_admin_logged_in');
    if (loggedIn === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    sessionStorage.setItem('casa_mexicana_admin_logged_in', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('casa_mexicana_admin_logged_in');
  };

  if (!isLoggedIn) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Yeni': return 'info';
      case 'Hazırlanıyor': return 'warning';
      case 'Hazır': return 'success';
      case 'Teslim Edildi': return 'gray';
      default: return 'default';
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'Yeni': return 'border-l-blue-500';
      case 'Hazırlanıyor': return 'border-l-yellow-500';
      case 'Hazır': return 'border-l-green-500';
      case 'Teslim Edildi': return 'border-l-slate-400';
      default: return 'border-l-slate-200';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-8"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Paneli</h1>
          <p className="mt-1 text-slate-500">Restoranınızı yönetin.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex p-1 bg-slate-100 rounded-lg">
            <Button 
              variant={activeTab === 'orders' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('orders')}
              className={activeTab === 'orders' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}
            >
              <ListOrdered className="mr-2 h-4 w-4" />
              Siparişler
            </Button>
            <Button 
              variant={activeTab === 'waiter' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('waiter')}
              className={activeTab === 'waiter' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}
            >
              <div className="relative flex items-center">
                <BellRing className="mr-2 h-4 w-4" />
                Garson Çağrıları
                {activeWaiterCalls.length > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {activeWaiterCalls.length}
                  </span>
                )}
              </div>
            </Button>
            <Button 
              variant={activeTab === 'menu' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('menu')}
              className={activeTab === 'menu' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}
            >
              <UtensilsCrossed className="mr-2 h-4 w-4" />
              Menü Yönetimi
            </Button>
          </div>
          <Button variant="outline" onClick={handleLogout} className="text-slate-500">
            <LogOut className="mr-2 h-4 w-4" />
            Çıkış Yap
          </Button>
        </div>
      </div>

      {activeTab === 'waiter' ? (
        activeWaiterCalls.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 text-center py-16">
            <CardContent className="flex flex-col items-center justify-center">
              <div className="rounded-full bg-slate-100 p-4 text-slate-400 mb-4">
                <BellRing className="h-8 w-8" />
              </div>
              <CardTitle className="mb-2">Bekleyen Çağrı Yok</CardTitle>
              <CardDescription>Şu an için garson çağıran masa bulunmuyor.</CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeWaiterCalls.map((call, index) => (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="h-full flex flex-col border-l-4 border-l-red-500">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{call.table}</CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(call.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </CardDescription>
                      </div>
                      <Badge variant="destructive" className="animate-pulse">
                        Bekliyor
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex-col items-stretch border-t border-slate-100 bg-slate-50/50 p-4 mt-auto">
                    <Button 
                      className="w-full bg-green-500 hover:bg-green-600 text-white" 
                      onClick={() => resolveWaiterCall(call.id)}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      İlgilenildi
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )
      ) : activeTab === 'menu' ? (
        <AdminMenu />
      ) : orders.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 text-center py-16">
          <CardContent className="flex flex-col items-center justify-center">
            <div className="rounded-full bg-slate-100 p-4 text-slate-400 mb-4">
              <ChefHat className="h-8 w-8" />
            </div>
            <CardTitle className="mb-2">Henüz Sipariş Yok</CardTitle>
            <CardDescription>Müşteriler sipariş verdiğinde burada görünecektir.</CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className={`h-full flex flex-col border-l-4 ${getBorderColor(order.status)}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{order.table}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  <ul className="space-y-3">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 font-medium text-slate-600">
                            {item.quantity}x
                          </span>
                          <span className="font-medium text-slate-900">{item.name}</span>
                        </span>
                        <span className="text-slate-500">₺{(item.price * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex-col items-stretch border-t border-slate-100 bg-slate-50/50 p-4 gap-4">
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>Toplam:</span>
                    <span className="text-lg text-orange-600">₺{order.total.toFixed(2)}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Button 
                      size="sm"
                      variant={order.status === 'Hazırlanıyor' ? 'default' : 'outline'}
                      className={order.status === 'Hazırlanıyor' ? 'bg-yellow-500 hover:bg-yellow-600 border-none' : 'text-yellow-600 border-yellow-200 hover:bg-yellow-50'}
                      onClick={() => updateOrderStatus(order.id, 'Hazırlanıyor')}
                      disabled={order.status === 'Hazırlanıyor' || order.status === 'Hazır' || order.status === 'Teslim Edildi'}
                    >
                      <Play className="mr-1 h-3 w-3" />
                      Hazırlanıyor
                    </Button>
                    <Button 
                      size="sm"
                      variant={order.status === 'Hazır' ? 'default' : 'outline'}
                      className={order.status === 'Hazır' ? 'bg-green-500 hover:bg-green-600 border-none' : 'text-green-600 border-green-200 hover:bg-green-50'}
                      onClick={() => updateOrderStatus(order.id, 'Hazır')}
                      disabled={order.status === 'Hazır' || order.status === 'Teslim Edildi'}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Hazır
                    </Button>
                    <Button 
                      size="sm"
                      variant={order.status === 'Teslim Edildi' ? 'default' : 'outline'}
                      className={order.status === 'Teslim Edildi' ? 'bg-slate-500 hover:bg-slate-600 border-none' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}
                      onClick={() => updateOrderStatus(order.id, 'Teslim Edildi')}
                      disabled={order.status === 'Teslim Edildi'}
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Teslim Edildi
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
