import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Clock, CheckCircle2, ChefHat, LogOut, Play, Check, ListOrdered, UtensilsCrossed, BellRing, History } from 'lucide-react';
import { motion } from 'motion/react';
import { AdminLogin } from './AdminLogin';
import { AdminMenu } from './AdminMenu';
import { AdminTables } from './AdminTables';
import { AdminHistory } from './AdminHistory';

export function Admin() {
  const { orders, updateOrderStatus, waiterCalls, resolveWaiterCall } = useCart();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'waiter' | 'history'>('orders');
  
  const activeWaiterCalls = waiterCalls ? waiterCalls.filter(c => !c.resolved) : [];
  const newOrdersCount = orders ? orders.filter(o => o.status === 'Yeni').length : 0;

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
          <div className="flex p-1 bg-slate-100 rounded-lg overflow-x-auto">
            <Button 
              variant={activeTab === 'orders' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('orders')}
              className={activeTab === 'orders' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}
            >
              <div className="relative flex items-center">
                <ListOrdered className="mr-2 h-4 w-4" />
                Masalar & Siparişler
                {newOrdersCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {newOrdersCount}
                  </span>
                )}
              </div>
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
            <Button 
              variant={activeTab === 'history' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('history')}
              className={activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}
            >
              <History className="mr-2 h-4 w-4" />
              Geçmiş Siparişler
            </Button>
          </div>
          <Button variant="outline" onClick={handleLogout} className="text-slate-500 shrink-0">
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
      ) : activeTab === 'history' ? (
        <AdminHistory />
      ) : (
        <AdminTables />
      )}
    </motion.div>
  );
}
