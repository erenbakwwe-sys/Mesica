import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Trash2, History, Search, AlertTriangle } from 'lucide-react';
import { Input } from '../components/ui/input';
import { motion, AnimatePresence } from 'motion/react';

export function AdminHistory() {
  const { orders, deleteOrder } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [visibleLimit, setVisibleLimit] = useState(30);
  
  // Filter only paid orders
  const pastOrders = orders.filter(o => o.status === 'Ödendi');
  
  // Filter by search term
  const filteredOrders = pastOrders.filter(o => 
    o.table.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort filtered orders by date descending
  const sortedPastOrders = [...filteredOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Slice based on visibleLimit
  const visibleOrdersList = sortedPastOrders.slice(0, visibleLimit);

  // Group by table
  const groupedOrders = visibleOrdersList.reduce((acc, order) => {
    if (!acc[order.table]) {
      acc[order.table] = [];
    }
    acc[order.table].push(order);
    return acc;
  }, {} as Record<string, typeof orders>);

  // Sort tables alphabetically/numerically
  const sortedTables = Object.keys(groupedOrders).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  const handleDeleteConfirm = () => {
    if (orderToDelete) {
      deleteOrder(orderToDelete);
      setOrderToDelete(null);
    }
  };

  return (
    <div className="space-y-6 relative text-[#f5f2eb]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white font-sans">Geçmiş Siparişler</h2>
          <p className="text-neutral-400 font-medium text-xs sm:text-sm">Kapatılan masaların ve ödenen siparişlerin arşivi.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-neutral-500" />
          <Input
            type="search"
            placeholder="Masa ara..."
            className="pl-10 h-11 bg-neutral-950/50 border-amber-950/20 text-white rounded-xl focus:border-[#dcae61] focus:ring-1 focus:ring-[#dcae61]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {pastOrders.length === 0 ? (
        <Card className="card-3d border-dashed border-2 border-amber-950/15 bg-neutral-900/40 text-center py-20">
          <CardContent className="flex flex-col items-center justify-center">
            <div className="rounded-2xl bg-[#dcae61]/10 p-4 text-[#dcae61] mb-5 border border-amber-900/10 shadow-md">
              <History className="h-8 w-8" />
            </div>
            <CardTitle className="mb-2 text-xl font-bold text-white">Geçmiş Sipariş Yok</CardTitle>
            <CardDescription className="text-neutral-400 font-medium text-xs sm:text-sm">Henüz hesabı kapatılmış bir sipariş bulunmuyor.</CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sortedTables.map(tableName => (
            <div key={tableName} className="space-y-4">
              <h3 className="text-xl font-black text-[#dcae61] border-b border-amber-950/15 pb-2">{tableName}</h3>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {groupedOrders[tableName]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map(order => (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      <Card className="card-3d flex flex-col h-full border-none hover:border-[#dcae61]/35 hover:translate-y-[-2px] transition-all duration-300 overflow-hidden">
                        <CardHeader className="p-5 pb-3 border-b border-amber-950/10 bg-neutral-900/30">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm font-bold text-white">
                                {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                              </div>
                              <div className="text-xs text-neutral-400 mt-1 font-medium flex items-center gap-1.5">
                                <Search className="h-3 w-3 text-[#dcae61]" />
                                {new Date(order.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </div>
                            </div>
                            <Badge className="bg-[#dcae61]/15 text-[#dcae61] border border-[#dcae61]/25 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
                              {order.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-5 flex-1">
                          <ul className="space-y-2 mb-4">
                            {order.items.map(item => (
                              <li key={item.id} className="flex justify-between text-sm">
                                <span className="text-neutral-300 font-medium">{item.quantity}x {item.name}</span>
                                <span className="text-neutral-400 font-semibold">₺{(item.price * item.quantity).toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="pt-3 border-t border-amber-950/10 flex justify-between items-center">
                            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-xl bg-neutral-950/40 border border-amber-950/10 text-[#dcae61] uppercase tracking-wider">
                              {order.paymentMethod}
                            </span>
                            <span className="font-extrabold text-[#dcae61] text-base">₺{order.total.toFixed(2)}</span>
                          </div>
                          {order.note && (
                            <div className="mt-3 text-xs bg-neutral-950/40 text-neutral-300 p-2.5 rounded-xl border border-amber-950/10 font-medium">
                              <span className="font-bold text-[#dcae61]">Not:</span> {order.note}
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="p-5 pt-0 flex justify-end mt-auto">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full h-8 px-4 font-bold text-xs uppercase tracking-wider"
                            onClick={() => setOrderToDelete(order.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            Sil
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
          {sortedPastOrders.length > visibleLimit && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => setVisibleLimit(prev => prev + 50)}
                className="button-3d-primary rounded-full px-8 h-11 text-xs font-bold uppercase tracking-widest"
              >
                Daha Fazla Göster ({sortedPastOrders.length - visibleLimit} sipariş daha var)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {orderToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm card-3d border-none shadow-2xl overflow-hidden p-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Siparişi Sil</h3>
                <p className="text-neutral-400 mb-6 text-xs sm:text-sm font-medium leading-relaxed">
                  Bu geçmiş siparişi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={() => setOrderToDelete(null)}
                    className="flex-1 button-3d-secondary rounded-full h-11 text-xs font-bold uppercase tracking-wider"
                  >
                    İptal
                  </Button>
                  <Button 
                    onClick={handleDeleteConfirm}
                    className="flex-1 button-3d-danger rounded-full h-11 text-xs font-bold uppercase tracking-wider"
                  >
                    Evet, Sil
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
