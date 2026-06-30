import { useState } from 'react';
import { useCart, CartItem } from '../context/CartContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { BellRing, Utensils, Receipt, CheckCircle2, Play, Check, Plus, Minus, FileText, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AdminTables() {
  const { 
    tables, 
    orders, 
    waiterCalls, 
    openTable, 
    closeTable, 
    updateOrderStatus, 
    resolveWaiterCall,
    menuItems,
    placeWaiterOrder
  } = useCart();

  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  
  // Waiter Order Entry States
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [newOrderCart, setNewOrderCart] = useState<Record<string, number>>({}); // itemId -> qty
  const [newOrderNote, setNewOrderNote] = useState('');
  const [activeMenuCategory, setActiveMenuCategory] = useState<string>('Tümü');

  const getTableStats = (tableName: string) => {
    const tableOrders = orders.filter(o => o.table === tableName && o.status !== 'Ödendi');
    const tableCalls = waiterCalls.filter(c => c.table === tableName && !c.resolved);
    
    const newOrdersCount = tableOrders.filter(o => o.status === 'Yeni').length;
    const activeOrdersCount = tableOrders.length;
    
    // Calculate total unpaid of the table
    const unpaidTotal = tableOrders.reduce((sum, order) => {
      const remaining = order.remainingAmount !== undefined ? order.remainingAmount : order.total;
      return sum + remaining;
    }, 0);

    return {
      tableOrders,
      tableCalls,
      newOrdersCount,
      activeOrdersCount,
      unpaidTotal,
      hasNotification: newOrdersCount > 0 || tableCalls.length > 0
    };
  };

  const handleOpenAddOrder = () => {
    setNewOrderCart({});
    setNewOrderNote('');
    setActiveMenuCategory('Tümü');
    setIsAddingOrder(true);
  };

  const handleCloseAddOrder = () => {
    setIsAddingOrder(false);
  };

  const handleUpdateItemQty = (itemId: string, delta: number) => {
    setNewOrderCart(prev => {
      const currentQty = prev[itemId] || 0;
      const newQty = Math.max(0, currentQty + delta);
      return { ...prev, [itemId]: newQty };
    });
  };

  const handleSaveWaiterOrder = async (tableName: string) => {
    const itemsToOrder: CartItem[] = Object.entries(newOrderCart)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => {
        const item = menuItems.find(m => m.id === itemId);
        return item ? {
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: qty
        } : null;
      })
      .filter((item): item is CartItem => item !== null);

    if (itemsToOrder.length === 0) {
      alert("Lütfen en az bir ürün seçin.");
      return;
    }

    await placeWaiterOrder(tableName, itemsToOrder, newOrderNote);
    
    // Reset states
    setNewOrderCart({});
    setNewOrderNote('');
    setIsAddingOrder(false);
  };

  const categories = ['Tümü', ...Array.from(new Set(menuItems.map((item) => item.category)))];
  const filteredMenuItems = activeMenuCategory === 'Tümü'
    ? menuItems
    : menuItems.filter(item => item.category === activeMenuCategory);

  const calculateNewOrderTotal = () => {
    return Object.entries(newOrderCart).reduce((sum, [itemId, qty]) => {
      const item = menuItems.find(m => m.id === itemId);
      return sum + (item ? item.price * qty : 0);
    }, 0);
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
                      ? 'border-blue-400 bg-blue-50/50' 
                      : 'border-green-400 bg-green-50/50'
                    : 'border-slate-200 bg-slate-50/50 opacity-70 hover:opacity-100'
                } ${selectedTable === table.id ? 'ring-2 ring-slate-900 shadow-md' : ''}`}
                onClick={() => {
                  setSelectedTable(selectedTable === table.id ? null : table.id);
                  setIsAddingOrder(false);
                }}
              >
                <CardHeader className="p-4 pb-2 relative">
                  <CardTitle className="text-lg text-center font-bold">{table.name}</CardTitle>
                  
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
                      <div className="text-2xl font-black text-slate-900">
                        ₺{stats.unpaidTotal.toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-500 font-semibold tracking-wide uppercase">Aktif Hesap</div>
                      
                      <div className="flex gap-2 mt-2">
                        {stats.activeOrdersCount > 0 && (
                          <Badge variant="outline" className="bg-white/80 text-slate-700 border-slate-300">
                            <Utensils className="w-3 h-3 mr-1" />
                            {stats.activeOrdersCount} Sipariş
                          </Badge>
                        )}
                        {stats.tableCalls.length > 0 && (
                          <Badge variant="destructive" className="animate-pulse">
                            <BellRing className="w-3 h-3 mr-1" />
                            {stats.tableCalls.length} Çağrı
                          </Badge>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-slate-400 font-medium py-4">
                      Masa Kapalı
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="p-2 pt-0">
                  {table.isOpen ? (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold"
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
                      className="w-full text-xs border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 font-semibold"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl flex flex-col"
            >
              <Card className="border-0 shadow-none flex-1 flex flex-col overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between sticky top-0 z-10 p-5">
                  <div className="flex items-center gap-2">
                    {isAddingOrder && (
                      <Button variant="ghost" size="icon" onClick={handleCloseAddOrder} className="h-8 w-8 rounded-full mr-1 hover:bg-slate-200">
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                    )}
                    <CardTitle className="text-xl font-bold">
                      {tables.find(t => t.id === selectedTable)?.name} Detayları
                    </CardTitle>
                  </div>
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
                <CardContent className="p-6 overflow-y-auto max-h-[70vh]">
                  {(() => {
                    const table = tables.find(t => t.id === selectedTable);
                    if (!table) return null;
                    const stats = getTableStats(table.name);

                    if (!table.isOpen) {
                      return <div className="text-center text-slate-500 py-12 text-lg">Masa şu an kapalı. Sipariş almak için önce masayı açın.</div>;
                    }

                    if (isAddingOrder) {
                      const newOrderTotal = calculateNewOrderTotal();
                      
                      return (
                        <div className="space-y-6">
                          <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-bold text-slate-900 flex items-center">
                                <Utensils className="w-5 h-5 mr-2 text-blue-500" />
                                Garson Sipariş Girişi
                              </h3>
                              <span className="text-lg font-extrabold text-blue-600">Toplam: ₺{newOrderTotal.toFixed(2)}</span>
                            </div>
                            
                            {/* Categories */}
                            <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                              {categories.map(cat => (
                                <Button
                                  key={cat}
                                  variant={activeMenuCategory === cat ? 'default' : 'ghost'}
                                  size="sm"
                                  onClick={() => setActiveMenuCategory(cat)}
                                  className="rounded-md text-xs h-8"
                                >
                                  {cat}
                                </Button>
                              ))}
                            </div>

                            {/* Menu Grid */}
                            <div className="grid gap-3 sm:grid-cols-2">
                              {filteredMenuItems.map(item => {
                                const qty = newOrderCart[item.id] || 0;
                                return (
                                  <div key={item.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors bg-white">
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                                      </div>
                                      <div>
                                        <p className="font-semibold text-sm text-slate-900">{item.name}</p>
                                        <p className="text-xs font-bold text-blue-600">₺{item.price}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {qty > 0 && (
                                        <>
                                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-full text-slate-500 hover:text-red-600" onClick={() => handleUpdateItemQty(item.id, -1)}>
                                            <Minus className="h-3.5 h-3.5" />
                                          </Button>
                                          <span className="w-6 text-center font-bold text-sm text-slate-800">{qty}</span>
                                        </>
                                      )}
                                      <Button variant="outline" size="icon" className="h-7 w-7 rounded-full text-slate-500 hover:text-blue-600" onClick={() => handleUpdateItemQty(item.id, 1)}>
                                        <Plus className="h-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Notes */}
                            <div className="space-y-2 mt-2">
                              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-slate-400" />
                                Sipariş Notu
                              </label>
                              <input 
                                type="text"
                                value={newOrderNote}
                                onChange={(e) => setNewOrderNote(e.target.value)}
                                placeholder="Örn: Acılı olsun, limon ekleyin..."
                                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              />
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                              <Button variant="outline" onClick={handleCloseAddOrder}>
                                İptal Et
                              </Button>
                              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold" onClick={() => handleSaveWaiterOrder(table.name)}>
                                Siparişi Masaya Ekle (₺{newOrderTotal.toFixed(2)})
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-8">
                        {/* Table Header Controls */}
                        <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                          <div className="flex flex-col">
                            <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider">İşlem Menüsü</span>
                            <span className="text-sm text-slate-600 mt-0.5">Masa için yeni sipariş girebilirsiniz.</span>
                          </div>
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg" onClick={handleOpenAddOrder}>
                            <Plus className="w-4 h-4 mr-1.5" />
                            Yeni Sipariş Gir
                          </Button>
                        </div>

                        {/* Waiter Calls */}
                        {stats.tableCalls.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                              <BellRing className="w-5 h-5 mr-2 text-red-500" />
                              Garson Çağrıları
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              <AnimatePresence>
                                {stats.tableCalls.map(call => (
                                  <motion.div
                                    key={call.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <Card className="border-red-200 bg-red-50 h-full">
                                      <CardContent className="p-4 flex items-center justify-between h-full">
                                        <div className="text-sm text-red-800 font-medium">
                                          {new Date(call.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <Button 
                                          size="sm" 
                                          className="bg-red-600 hover:bg-red-700 text-white font-medium"
                                          onClick={() => resolveWaiterCall(call.id)}
                                        >
                                          <CheckCircle2 className="w-4 h-4 mr-1" />
                                          İlgilenildi
                                        </Button>
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </div>
                          </div>
                        )}

                        {/* Active Orders */}
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                            <Utensils className="w-5 h-5 mr-2 text-blue-500" />
                            Masa Siparişleri ve Hesap
                          </h3>
                          {stats.tableOrders.length === 0 ? (
                            <div className="text-slate-500 text-sm bg-slate-50 p-4 rounded-lg border border-slate-100 text-center py-8">Bu masaya ait aktif sipariş bulunmuyor. "Yeni Sipariş Gir" butonuyla ekleyebilirsiniz.</div>
                          ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              <AnimatePresence>
                                {stats.tableOrders.map(order => (
                                  <motion.div
                                    key={order.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full"
                                  >
                                    <Card className="border-slate-200 flex flex-col h-full shadow-sm">
                                      <CardHeader className="p-4 pb-2 border-b border-slate-100 bg-slate-50">
                                        <div className="flex justify-between items-center">
                                          <div className="text-xs font-semibold text-slate-500">
                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </div>
                                          <Badge variant={
                                            order.status === 'Yeni' ? 'info' : 
                                            order.status === 'Hazırlanıyor' ? 'warning' : 
                                            order.status === 'Hazır' ? 'success' : 
                                            order.status === 'Ödeme Bekleniyor' ? 'destructive' : 'default'
                                          }>
                                            {order.status}
                                          </Badge>
                                        </div>
                                      </CardHeader>
                                      <CardContent className="p-4 flex-1">
                                        <ul className="space-y-2 mb-4">
                                          {order.items.map(item => (
                                            <li key={item.id} className="flex justify-between text-sm">
                                              <span className="text-slate-700 font-semibold">{item.quantity}x {item.name}</span>
                                              <span className="text-slate-500">₺{(item.price * item.quantity).toFixed(2)}</span>
                                            </li>
                                          ))}
                                        </ul>
                                        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                              {order.status === 'Ödeme Bekleniyor' ? 'Kısmi Ödenen' : 'Hesap'}
                                            </span>
                                            <span className="font-bold text-slate-900 text-base">₺{order.total.toFixed(2)}</span>
                                          </div>
                                          {order.paidAmount !== undefined && order.paidAmount > 0 && (
                                            <div className="flex justify-between items-center text-xs text-green-600">
                                              <span>Ödenen:</span>
                                              <span className="font-bold">₺{order.paidAmount.toFixed(2)}</span>
                                            </div>
                                          )}
                                          {order.remainingAmount !== undefined && order.remainingAmount > 0 && (
                                            <div className="flex justify-between items-center text-xs text-red-600 font-semibold">
                                              <span>Kalan:</span>
                                              <span className="font-bold">₺{order.remainingAmount.toFixed(2)}</span>
                                            </div>
                                          )}
                                        </div>
                                        {order.note && (
                                          <div className="mt-3 text-xs bg-amber-50 text-amber-800 p-2.5 rounded-md border border-amber-100">
                                            <span className="font-semibold block mb-0.5">Not:</span> {order.note}
                                          </div>
                                        )}
                                      </CardContent>
                                      <CardFooter className="p-4 pt-0 flex gap-2 mt-auto">
                                        {order.status === 'Yeni' && (
                                          <Button size="sm" className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium" onClick={() => updateOrderStatus(order.id, 'Hazırlanıyor')}>
                                            <Play className="w-3 h-3 mr-1" />
                                            Hazırlanıyor
                                          </Button>
                                        )}
                                        {order.status === 'Hazırlanıyor' && (
                                          <Button size="sm" className="w-full bg-green-500 hover:bg-green-600 text-white font-medium" onClick={() => updateOrderStatus(order.id, 'Hazır')}>
                                            <Check className="w-3 h-3 mr-1" />
                                            Hazır
                                          </Button>
                                        )}
                                        {order.status === 'Hazır' && (
                                          <Button size="sm" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium" onClick={() => updateOrderStatus(order.id, 'Teslim Edildi')}>
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Teslim Edildi
                                          </Button>
                                        )}
                                        {order.status === 'Teslim Edildi' && (
                                          <div className="w-full text-center text-xs font-semibold text-slate-500 py-2 bg-slate-50 rounded-md">
                                            Müşteriye teslim edildi
                                          </div>
                                        )}
                                        {order.status === 'Ödeme Bekleniyor' && (
                                          <div className="w-full text-center text-xs font-semibold text-amber-600 py-2 bg-amber-50 rounded-md">
                                            Ödemesi devam ediyor
                                          </div>
                                        )}
                                      </CardFooter>
                                    </Card>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
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
