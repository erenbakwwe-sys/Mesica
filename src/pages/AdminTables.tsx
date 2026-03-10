import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { BellRing, Utensils, Receipt, CheckCircle2, Play, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AdminTables() {
  const { tables, orders, waiterCalls, openTable, closeTable, updateOrderStatus, resolveWaiterCall } = useCart();
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const getTableStats = (tableName: string) => {
    const tableOrders = orders.filter(o => o.table === tableName && o.status !== 'Ödendi');
    const tableCalls = waiterCalls.filter(c => c.table === tableName && !c.resolved);
    
    const newOrdersCount = tableOrders.filter(o => o.status === 'Yeni').length;
    const activeOrdersCount = tableOrders.length;
    
    // Sadece nakit ödemelerin tutarını hesapla
    const cashTotal = tableOrders
      .filter(o => o.paymentMethod === 'Nakit')
      .reduce((sum, order) => sum + order.total, 0);

    return {
      tableOrders,
      tableCalls,
      newOrdersCount,
      activeOrdersCount,
      cashTotal,
      hasNotification: newOrdersCount > 0 || tableCalls.length > 0
    };
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {tables.map((table) => {
          const stats = getTableStats(table.name);
          
          return (
            <motion.div
              key={table.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={`cursor-pointer h-full flex flex-col transition-colors ${
                  table.isOpen 
                    ? stats.hasNotification 
                      ? 'border-orange-400 bg-orange-50' 
                      : 'border-green-400 bg-green-50'
                    : 'border-slate-200 bg-slate-50 opacity-70 hover:opacity-100'
                } ${selectedTable === table.id ? 'ring-2 ring-slate-900 shadow-md' : ''}`}
                onClick={() => setSelectedTable(selectedTable === table.id ? null : table.id)}
              >
                <CardHeader className="p-4 pb-2 relative">
                  <CardTitle className="text-lg text-center">{table.name}</CardTitle>
                  
                  {/* Notifications Badge */}
                  {stats.hasNotification && (
                    <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm animate-pulse">
                      {stats.newOrdersCount + stats.tableCalls.length}
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="p-4 pt-0 flex-1 flex flex-col items-center justify-center gap-2">
                  {table.isOpen ? (
                    <>
                      <div className="text-2xl font-bold text-slate-900">
                        ₺{stats.cashTotal.toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Nakit Toplam</div>
                      
                      <div className="flex gap-2 mt-2">
                        {stats.activeOrdersCount > 0 && (
                          <Badge variant="outline" className="bg-white/50 text-slate-700 border-slate-300">
                            <Utensils className="w-3 h-3 mr-1" />
                            {stats.activeOrdersCount}
                          </Badge>
                        )}
                        {stats.tableCalls.length > 0 && (
                          <Badge variant="destructive" className="animate-pulse">
                            <BellRing className="w-3 h-3 mr-1" />
                            {stats.tableCalls.length}
                          </Badge>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-slate-400 font-medium py-4">
                      Kapalı
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="p-2 pt-0">
                  {table.isOpen ? (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTable(table.id);
                        if (selectedTable === table.id) setSelectedTable(null);
                      }}
                    >
                      <Receipt className="w-3 h-3 mr-1" />
                      Hesabı Kapat
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full text-xs border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        openTable(table.id);
                      }}
                    >
                      <Utensils className="w-3 h-3 mr-1" />
                      Masayı Aç
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Table Details Modal */}
      <AnimatePresence>
        {selectedTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl"
            >
              <Card className="border-0 shadow-none">
                <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between sticky top-0 z-10">
                  <CardTitle className="text-xl">Masa {selectedTable} Detayları</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setSelectedTable(null)}
                    className="h-8 w-8 rounded-full hover:bg-slate-200"
                  >
                    <span className="sr-only">Kapat</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  {(() => {
                    const table = tables.find(t => t.id === selectedTable);
                    if (!table) return null;
                    const stats = getTableStats(table.name);

                    if (!table.isOpen) {
                      return <div className="text-center text-slate-500 py-12 text-lg">Masa şu an kapalı. Sipariş almak için masayı açın.</div>;
                    }

                    return (
                      <div className="space-y-8">
                        {/* Waiter Calls */}
                        {stats.tableCalls.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                              <BellRing className="w-5 h-5 mr-2 text-red-500" />
                              Garson Çağrıları
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {stats.tableCalls.map(call => (
                                <Card key={call.id} className="border-red-200 bg-red-50">
                                  <CardContent className="p-4 flex items-center justify-between">
                                    <div className="text-sm text-red-800 font-medium">
                                      {new Date(call.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <Button 
                                      size="sm" 
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                      onClick={() => resolveWaiterCall(call.id)}
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-1" />
                                      İlgilenildi
                                    </Button>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Active Orders */}
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                            <Utensils className="w-5 h-5 mr-2 text-orange-500" />
                            Aktif Siparişler
                          </h3>
                          {stats.tableOrders.length === 0 ? (
                            <div className="text-slate-500 text-sm bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">Bu masaya ait aktif sipariş bulunmuyor.</div>
                          ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {stats.tableOrders.map(order => (
                                <Card key={order.id} className="border-slate-200 flex flex-col">
                                  <CardHeader className="p-4 pb-2 border-b border-slate-100 bg-slate-50">
                                    <div className="flex justify-between items-center">
                                      <div className="text-sm font-medium text-slate-500">
                                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                      <Badge variant={
                                        order.status === 'Yeni' ? 'info' : 
                                        order.status === 'Hazırlanıyor' ? 'warning' : 
                                        order.status === 'Hazır' ? 'success' : 'default'
                                      }>
                                        {order.status}
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="p-4 flex-1">
                                    <ul className="space-y-2 mb-4">
                                      {order.items.map(item => (
                                        <li key={item.id} className="flex justify-between text-sm">
                                          <span className="text-slate-700 font-medium">{item.quantity}x {item.name}</span>
                                          <span className="text-slate-500">₺{(item.price * item.quantity).toFixed(2)}</span>
                                        </li>
                                      ))}
                                    </ul>
                                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                                      <span className="text-xs font-medium px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                                        {order.paymentMethod}
                                      </span>
                                      <span className="font-bold text-slate-900 text-lg">₺{order.total.toFixed(2)}</span>
                                    </div>
                                    {order.note && (
                                      <div className="mt-3 text-sm bg-orange-50 text-orange-800 p-3 rounded-md border border-orange-100">
                                        <span className="font-semibold block mb-1">Not:</span> {order.note}
                                      </div>
                                    )}
                                  </CardContent>
                                  <CardFooter className="p-4 pt-0 flex gap-2 mt-auto">
                                    {order.status === 'Yeni' && (
                                      <Button size="sm" className="w-full bg-yellow-500 hover:bg-yellow-600 text-white" onClick={() => updateOrderStatus(order.id, 'Hazırlanıyor')}>
                                        <Play className="w-3 h-3 mr-1" />
                                        Hazırlanıyor
                                      </Button>
                                    )}
                                    {order.status === 'Hazırlanıyor' && (
                                      <Button size="sm" className="w-full bg-green-500 hover:bg-green-600 text-white" onClick={() => updateOrderStatus(order.id, 'Hazır')}>
                                        <Check className="w-3 h-3 mr-1" />
                                        Hazır
                                      </Button>
                                    )}
                                    {order.status === 'Hazır' && (
                                      <Button size="sm" className="w-full bg-slate-800 hover:bg-slate-900 text-white" onClick={() => updateOrderStatus(order.id, 'Teslim Edildi')}>
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Teslim Edildi
                                      </Button>
                                    )}
                                    {order.status === 'Teslim Edildi' && (
                                      <div className="w-full text-center text-sm font-medium text-slate-500 py-2 bg-slate-50 rounded-md">
                                        Müşteriye teslim edildi
                                      </div>
                                    )}
                                  </CardFooter>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
