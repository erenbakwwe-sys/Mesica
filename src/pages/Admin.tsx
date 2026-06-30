import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Clock, CheckCircle2, ChefHat, Play, Check, ListOrdered, UtensilsCrossed, BellRing, History, LayoutDashboard, QrCode, Users, Box, Receipt, Tag, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminMenu } from './AdminMenu';
import { AdminTables } from './AdminTables';
import { AdminHistory } from './AdminHistory';
import { AdminDashboard } from './AdminDashboard';
import { AdminQRCodes } from './AdminQRCodes';
import { AdminStaff } from '../components/AdminStaff';
import { AdminStock } from '../components/AdminStock';
import { AdminProfitLoss } from '../components/AdminProfitLoss';
import { AdminAnalytics } from '../components/AdminAnalytics';
import { AdminCoupons } from '../components/AdminCoupons';

export function Admin() {
  const { orders, updateOrderStatus, waiterCalls, resolveWaiterCall } = useCart();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'menu' | 'waiter' | 'history' | 'qr' | 'staff' | 'stock' | 'profitloss' | 'analytics' | 'coupons'>('dashboard');
  
  const activeWaiterCalls = waiterCalls ? waiterCalls.filter(c => !c.resolved) : [];
  const newOrdersCount = orders ? orders.filter(o => o.status === 'Yeni' || o.status === 'Ödeme Bekleniyor').length : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-8"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white font-sans">Admin Paneli</h1>
          <p className="mt-1 text-neutral-400 font-medium">Flux Zone Coffee işletme paneli.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="flex p-1.5 bg-neutral-900/80 border border-amber-950/15 rounded-2xl whitespace-nowrap gap-1">
            <Button 
              variant="ghost"
              size="sm" 
              onClick={() => setActiveTab('dashboard')}
              className={`rounded-xl transition-all h-9 px-4 text-xs font-bold uppercase tracking-wider ${
                activeTab === 'dashboard' 
                  ? 'bg-[#dcae61] text-stone-950 shadow-md font-black hover:bg-[#dcae61]/90' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
              }`}
            >
              <LayoutDashboard className="mr-1.5 h-4 w-4" />
              Özet & Finans
            </Button>
            <Button 
              variant="ghost"
              size="sm" 
              onClick={() => setActiveTab('orders')}
              className={`rounded-xl transition-all h-9 px-4 text-xs font-bold uppercase tracking-wider ${
                activeTab === 'orders' 
                  ? 'bg-[#dcae61] text-stone-950 shadow-md font-black hover:bg-[#dcae61]/90' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
              }`}
            >
              <div className="relative flex items-center">
                <ListOrdered className="mr-1.5 h-4 w-4" />
                Masalar
                {newOrdersCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow-md">
                    {newOrdersCount}
                  </span>
                )}
              </div>
            </Button>
            <Button 
              variant="ghost"
              size="sm" 
              onClick={() => setActiveTab('waiter')}
              className={`rounded-xl transition-all h-9 px-4 text-xs font-bold uppercase tracking-wider ${
                activeTab === 'waiter' 
                  ? 'bg-[#dcae61] text-stone-950 shadow-md font-black hover:bg-[#dcae61]/90' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
              }`}
            >
              <div className="relative flex items-center">
                <BellRing className="mr-1.5 h-4 w-4" />
                Çağrılar
                {activeWaiterCalls.length > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow-md animate-pulse">
                    {activeWaiterCalls.length}
                  </span>
                )}
              </div>
            </Button>
            <Button 
              variant="ghost"
              size="sm" 
              onClick={() => setActiveTab('menu')}
              className={`rounded-xl transition-all h-9 px-4 text-xs font-bold uppercase tracking-wider ${
                activeTab === 'menu' 
                  ? 'bg-[#dcae61] text-stone-950 shadow-md font-black hover:bg-[#dcae61]/90' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
              }`}
            >
              <UtensilsCrossed className="mr-1.5 h-4 w-4" />
              Menü
            </Button>
            <Button 
              variant="ghost"
              size="sm" 
              onClick={() => setActiveTab('history')}
              className={`rounded-xl transition-all h-9 px-4 text-xs font-bold uppercase tracking-wider ${
                activeTab === 'history' 
                  ? 'bg-[#dcae61] text-stone-950 shadow-md font-black hover:bg-[#dcae61]/90' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
              }`}
            >
              <History className="mr-1.5 h-4 w-4" />
              Geçmiş
            </Button>
            <Button 
              variant="ghost"
              size="sm" 
              onClick={() => setActiveTab('qr')}
              className={`rounded-xl transition-all h-9 px-4 text-xs font-bold uppercase tracking-wider ${
                activeTab === 'qr' 
                  ? 'bg-[#dcae61] text-stone-950 shadow-md font-black hover:bg-[#dcae61]/90' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
              }`}
            >
              <QrCode className="mr-1.5 h-4 w-4" />
              QR Kodlar
            </Button>
            <Button 
              variant="ghost"
              size="sm" 
              onClick={() => setActiveTab('staff')}
              className={`rounded-xl transition-all h-9 px-4 text-xs font-bold uppercase tracking-wider ${
                activeTab === 'staff' 
                  ? 'bg-[#dcae61] text-stone-950 shadow-md font-black hover:bg-[#dcae61]/90' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
              }`}
            >
              <Users className="mr-1.5 h-4 w-4" />
              Personel
            </Button>
            <Button 
              variant="ghost"
              size="sm" 
              onClick={() => setActiveTab('stock')}
              className={`rounded-xl transition-all h-9 px-4 text-xs font-bold uppercase tracking-wider ${
                activeTab === 'stock' 
                  ? 'bg-[#dcae61] text-stone-950 shadow-md font-black hover:bg-[#dcae61]/90' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
              }`}
            >
              <Box className="mr-1.5 h-4 w-4" />
              Stok Yönetimi
            </Button>
            <Button 
              variant="ghost"
              size="sm" 
              onClick={() => setActiveTab('profitloss')}
              className={`rounded-xl transition-all h-9 px-4 text-xs font-bold uppercase tracking-wider ${
                activeTab === 'profitloss' 
                  ? 'bg-[#dcae61] text-stone-950 shadow-md font-black hover:bg-[#dcae61]/90' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
              }`}
            >
              <Receipt className="mr-1.5 h-4 w-4" />
              Kâr-Zarar
            </Button>
            <Button 
              variant="ghost"
              size="sm" 
              onClick={() => setActiveTab('analytics')}
              className={`rounded-xl transition-all h-9 px-4 text-xs font-bold uppercase tracking-wider ${
                activeTab === 'analytics' 
                  ? 'bg-[#dcae61] text-stone-950 shadow-md font-black hover:bg-[#dcae61]/90' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
              }`}
            >
              <TrendingUp className="mr-1.5 h-4 w-4" />
                Analiz
            </Button>
            <Button 
              variant="ghost"
              size="sm" 
              onClick={() => setActiveTab('coupons')}
              className={`rounded-xl transition-all h-9 px-4 text-xs font-bold uppercase tracking-wider ${
                activeTab === 'coupons' 
                  ? 'bg-[#dcae61] text-stone-950 shadow-md font-black hover:bg-[#dcae61]/90' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
              }`}
            >
              <Tag className="mr-1.5 h-4 w-4" />
              Kuponlar
            </Button>
          </div>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <AdminDashboard />
      ) : activeTab === 'waiter' ? (
        activeWaiterCalls.length === 0 ? (
          <Card className="card-3d border-dashed border-2 border-amber-950/15 bg-neutral-900/40 text-center py-20">
            <CardContent className="flex flex-col items-center justify-center">
              <div className="rounded-2xl bg-[#dcae61]/10 p-4 text-[#dcae61] mb-5 border border-amber-900/10 shadow-md">
                <BellRing className="h-8 w-8" />
              </div>
              <CardTitle className="mb-2 text-xl font-bold text-white">Bekleyen Çağrı Yok</CardTitle>
              <CardDescription className="text-neutral-400 font-medium">Şu an için yardım veya hesap isteyen aktif garson çağrısı bulunmuyor.</CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {activeWaiterCalls.map((call, index) => (
                <motion.div
                  key={call.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="card-3d h-full flex flex-col border-none hover:border-[#dcae61]/35 hover:translate-y-[-2px] transition-all relative overflow-hidden">
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-red-500" />
                    <CardHeader className="pb-4 pl-8">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl font-black text-white">{call.table}</CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-1.5 text-neutral-400 font-medium text-xs">
                            <Clock className="h-3.5 w-3.5 text-[#dcae61]" />
                            {new Date(call.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </CardDescription>
                        </div>
                        <Badge className="bg-red-500/15 text-red-400 border border-red-500/25 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase animate-pulse">
                          Bekliyor
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardFooter className="flex-col items-stretch border-t border-amber-950/10 bg-neutral-900/30 p-4 mt-auto pl-8">
                      <Button 
                        className="w-full button-3d-primary rounded-full h-11 text-xs uppercase font-bold tracking-wider" 
                        onClick={() => resolveWaiterCall(call.id)}
                      >
                        <CheckCircle2 className="mr-1.5 h-4 w-4" />
                        Çağrıya Cevap Verildi
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )
      ) : activeTab === 'menu' ? (
        <AdminMenu />
      ) : activeTab === 'history' ? (
        <AdminHistory />
      ) : activeTab === 'qr' ? (
        <AdminQRCodes />
      ) : activeTab === 'staff' ? (
        <AdminStaff />
      ) : activeTab === 'stock' ? (
        <AdminStock />
      ) : activeTab === 'profitloss' ? (
        <AdminProfitLoss />
      ) : activeTab === 'analytics' ? (
        <AdminAnalytics />
      ) : activeTab === 'coupons' ? (
        <AdminCoupons />
      ) : (
        <AdminTables />
      )}
    </motion.div>
  );
}
