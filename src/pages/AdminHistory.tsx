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
  
  // Filter only paid orders
  const pastOrders = orders.filter(o => o.status === 'Ödendi');
  
  // Filter by search term
  const filteredOrders = pastOrders.filter(o => 
    o.table.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by table
  const groupedOrders = filteredOrders.reduce((acc, order) => {
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
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Geçmiş Siparişler</h2>
          <p className="text-slate-500">Kapatılan masaların ve ödenen siparişlerin arşivi.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="search"
            placeholder="Masa ara..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {pastOrders.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 text-center py-16">
          <CardContent className="flex flex-col items-center justify-center">
            <div className="rounded-full bg-slate-100 p-4 text-slate-400 mb-4">
              <History className="h-8 w-8" />
            </div>
            <CardTitle className="mb-2">Geçmiş Sipariş Yok</CardTitle>
            <CardDescription>Henüz hesabı kapatılmış bir sipariş bulunmuyor.</CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sortedTables.map(tableName => (
            <div key={tableName} className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-900 border-b pb-2">{tableName}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groupedOrders[tableName]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map(order => (
                  <Card key={order.id} className="border-slate-200 flex flex-col bg-slate-50/50">
                    <CardHeader className="p-4 pb-2 border-b border-slate-100 bg-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(order.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-slate-100 text-slate-600">
                          {order.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 flex-1">
                      <ul className="space-y-2 mb-4">
                        {order.items.map(item => (
                          <li key={item.id} className="flex justify-between text-sm">
                            <span className="text-slate-700">{item.quantity}x {item.name}</span>
                            <span className="text-slate-500">₺{(item.price * item.quantity).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                        <span className="text-xs font-medium px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600">
                          {order.paymentMethod}
                        </span>
                        <span className="font-bold text-slate-900">₺{order.total.toFixed(2)}</span>
                      </div>
                      {order.note && (
                        <div className="mt-3 text-xs bg-white text-slate-600 p-2 rounded border border-slate-200">
                          <span className="font-semibold">Not:</span> {order.note}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-end mt-auto">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setOrderToDelete(order.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Sil
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {orderToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Siparişi Sil</h3>
                <p className="text-slate-500 mb-6">
                  Bu geçmiş siparişi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setOrderToDelete(null)}
                    className="flex-1"
                  >
                    İptal
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteConfirm}
                    className="flex-1 bg-red-600 hover:bg-red-700"
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
