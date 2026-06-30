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
    <div className="space-y-6 text-[#f5f2eb]">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {tables.map((table) => {
          const stats = getTableStats(table.name);
          
          return (
            <motion.div
              key={table.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={`cursor-pointer h-full flex flex-col transition-all duration-300 card-3d border-none relative overflow-hidden ${
                  table.isOpen 
                    ? stats.hasNotification 
                      ? 'shadow-[0_0_20px_rgba(239,68,68,0.2)] ring-1 ring-red-500/30' 
                      : 'shadow-[0_0_15px_rgba(34,197,94,0.1)] ring-1 ring-emerald-500/20'
                    : 'opacity-50 hover:opacity-90'
                } ${selectedTable === table.id ? 'ring-2 ring-[#dcae61] shadow-[0_0_25px_rgba(220,174,97,0.3)] scale-[1.02]' : ''}`}
                onClick={() => {
                  setSelectedTable(selectedTable === table.id ? null : table.id);
                  setIsAddingOrder(false);
                }}
              >
                {/* Decorative status bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  table.isOpen
                    ? stats.hasNotification
                      ? 'bg-red-500'
                      : 'bg-emerald-500'
                    : 'bg-neutral-800'
                }`} />

                <CardHeader className="p-4 pb-2 relative pt-6">
                  <CardTitle className="text-lg text-center font-black text-white">{table.name}</CardTitle>
                  
                  {/* Notifications Badge */}
                  {stats.hasNotification && (
                    <div className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow-lg animate-pulse">
                      {stats.newOrdersCount + stats.tableCalls.length}
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="p-5 pt-2 flex-1 flex flex-col items-center justify-center gap-2">
                  {table.isOpen ? (
                    <>
                      <div className="text-2xl font-black text-[#dcae61]">
                        ₺{stats.unpaidTotal.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-extrabold tracking-wider uppercase">Aktif Masa</div>
                      
                      <div className="flex flex-wrap gap-1.5 justify-center mt-2.5">
                        {stats.activeOrdersCount > 0 && (
                          <Badge className="badge-glass text-xs text-[#dcae61] border border-amber-950/20 px-2.5 py-0.5 rounded-full font-bold">
                            <Utensils className="w-3 h-3 mr-1 text-[#dcae61]" />
                            {stats.activeOrdersCount} Sipariş
                          </Badge>
                        )}
                        {stats.tableCalls.length > 0 && (
                          <Badge className="bg-red-500/15 text-red-400 border border-red-500/25 px-2.5 py-0.5 rounded-full text-xs font-bold animate-pulse">
                            <BellRing className="w-3 h-3 mr-1 text-red-400" />
                            {stats.tableCalls.length} Çağrı
                          </Badge>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-neutral-500 font-bold uppercase tracking-wider py-5">
                      Masa Kapalı
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="p-3 pt-0">
                  {table.isOpen ? (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="w-full text-xs text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 rounded-xl font-bold h-9 uppercase tracking-wider"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTable(table.id);
                        if (selectedTable === table.id) setSelectedTable(null);
                      }}
                    >
                      <Receipt className="w-3 h-3 mr-1.5 text-red-400" />
                      Hesabı Kapat
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="w-full text-xs text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/15 rounded-xl font-bold h-9 uppercase tracking-wider"
                      onClick={(e) => {
                        e.stopPropagation();
                        openTable(table.id);
                      }}
                    >
                      <Utensils className="w-3 h-3 mr-1.5 text-emerald-400" />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-hidden card-3d border-none shadow-2xl flex flex-col p-0"
            >
              <Card className="border-0 shadow-none bg-transparent flex-1 flex flex-col overflow-hidden">
                <CardHeader className="bg-neutral-900/80 border-b border-amber-950/15 flex flex-row items-center justify-between sticky top-0 z-10 p-5">
                  <div className="flex items-center gap-2">
                    {isAddingOrder && (
                      <Button variant="ghost" size="icon" onClick={handleCloseAddOrder} className="h-9 w-9 rounded-full mr-1 hover:bg-neutral-800 text-neutral-400 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                    )}
                    <CardTitle className="text-xl font-black text-white font-sans">
                      {tables.find(t => t.id === selectedTable)?.name} Detayları
                    </CardTitle>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setSelectedTable(null)}
                    className="h-9 w-9 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
                  >
                    <span className="sr-only">Kapat</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </Button>
                </CardHeader>
                <CardContent className="p-6 overflow-y-auto max-h-[70vh] text-[#f5f2eb]">
                  {(() => {
                    const table = tables.find(t => t.id === selectedTable);
                    if (!table) return null;
                    const stats = getTableStats(table.name);

                    if (!table.isOpen) {
                      return <div className="text-center text-neutral-400 py-16 text-lg font-bold">Masa şu an kapalı. Sipariş almak için önce masayı açın.</div>;
                    }

                    if (isAddingOrder) {
                      const newOrderTotal = calculateNewOrderTotal();
                      
                      return (
                        <div className="space-y-6">
                          <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-black text-white flex items-center font-sans">
                                <Utensils className="w-5 h-5 mr-2 text-[#dcae61]" />
                                Garson Sipariş Girişi
                              </h3>
                              <span className="text-lg font-extrabold text-[#dcae61]">Toplam: ₺{newOrderTotal.toFixed(2)}</span>
                            </div>
                            
                            {/* Categories */}
                            <div className="flex flex-wrap gap-1.5 bg-neutral-950/40 p-2 rounded-2xl border border-amber-950/10">
                              {categories.map(cat => (
                                <Button
                                  key={cat}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setActiveMenuCategory(cat)}
                                  className={`rounded-xl text-xs font-bold uppercase tracking-wider h-8 px-4 ${
                                    activeMenuCategory === cat
                                      ? 'bg-[#dcae61] text-stone-950 shadow-sm font-black'
                                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                                  }`}
                                >
                                  {cat}
                                </Button>
                              ))}
                            </div>

                            {/* Menu Grid */}
                            <div className="grid gap-4 sm:grid-cols-2">
                              {filteredMenuItems.map(item => {
                                const qty = newOrderCart[item.id] || 0;
                                return (
                                  <div key={item.id} className="flex items-center justify-between p-3.5 border border-amber-950/10 rounded-2xl hover:border-[#dcae61]/25 transition-all bg-neutral-950/30">
                                    <div className="flex items-center gap-3">
                                      <div className="h-11 w-11 rounded-xl overflow-hidden bg-neutral-900 shrink-0 border border-amber-950/10">
                                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                                      </div>
                                      <div>
                                        <p className="font-bold text-sm text-white">{item.name}</p>
                                        <p className="text-xs font-black text-[#dcae61] mt-0.5">₺{item.price}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {qty > 0 && (
                                        <>
                                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-full border-amber-950/20 text-neutral-400 hover:text-red-400 hover:border-red-500/30" onClick={() => handleUpdateItemQty(item.id, -1)}>
                                            <Minus className="h-3.5 w-3.5" />
                                          </Button>
                                          <span className="w-6 text-center font-extrabold text-sm text-white">{qty}</span>
                                        </>
                                      )}
                                      <Button variant="outline" size="icon" className="h-7 w-7 rounded-full border-amber-950/20 text-neutral-400 hover:text-[#dcae61] hover:border-[#dcae61]/30" onClick={() => handleUpdateItemQty(item.id, 1)}>
                                        <Plus className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Notes */}
                            <div className="space-y-2 mt-2">
                              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-[#dcae61]" />
                                Sipariş Notu
                              </label>
                              <input 
                                type="text"
                                value={newOrderNote}
                                onChange={(e) => setNewOrderNote(e.target.value)}
                                placeholder="Örn: Acılı olsun, limon ekleyin..."
                                className="w-full px-3.5 py-3 rounded-xl border border-amber-950/20 text-sm focus:border-[#dcae61] focus:outline-none focus:ring-1 focus:ring-[#dcae61] bg-neutral-950/50 text-white placeholder-neutral-500"
                              />
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end gap-3 pt-5 border-t border-amber-950/10">
                              <Button onClick={handleCloseAddOrder} className="button-3d-secondary rounded-full h-11 px-6 text-xs uppercase font-bold tracking-wider">
                                İptal Et
                              </Button>
                              <Button className="button-3d-primary rounded-full h-11 px-6 text-xs uppercase font-bold tracking-widest" onClick={() => handleSaveWaiterOrder(table.name)}>
                                Siparişi Masaya Ekle (₺{newOrderTotal.toFixed(2)})
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-8 text-[#f5f2eb]">
                        {/* Table Header Controls */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-amber-950/10 p-5 rounded-2xl border border-amber-950/15 gap-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-[#dcae61] font-black uppercase tracking-widest">İşlem Menüsü</span>
                            <span className="text-sm text-neutral-400 mt-1 font-medium">Bu masa için manuel sipariş girişi başlatın.</span>
                          </div>
                          <Button className="button-3d-primary rounded-full h-11 px-6 text-xs uppercase font-bold tracking-widest" onClick={handleOpenAddOrder}>
                            <Plus className="w-4 h-4 mr-1.5" />
                            Yeni Sipariş Gir
                          </Button>
                        </div>

                        {/* Waiter Calls */}
                        {stats.tableCalls.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="text-lg font-black text-white flex items-center font-sans">
                              <BellRing className="w-5 h-5 mr-2 text-red-500 animate-pulse" />
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
                                    <Card className="card-3d bg-red-950/10 border-red-500/20 h-full flex flex-col justify-between overflow-hidden">
                                      <div className="p-4 flex items-center justify-between h-full">
                                        <div className="text-sm text-red-400 font-bold">
                                          {new Date(call.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <Button 
                                          size="sm" 
                                          className="button-3d-danger rounded-full h-9 px-4 text-xs font-bold uppercase tracking-wider"
                                          onClick={() => resolveWaiterCall(call.id)}
                                        >
                                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                          Cevapla
                                        </Button>
                                      </div>
                                    </Card>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </div>
                          </div>
                        )}

                        {/* Active Orders */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-black text-white flex items-center font-sans">
                            <Utensils className="w-5 h-5 mr-2 text-[#dcae61]" />
                            Masa Siparişleri ve Hesap
                          </h3>
                          {stats.tableOrders.length === 0 ? (
                            <div className="card-3d border-dashed border-2 border-amber-950/15 bg-neutral-900/10 p-8 rounded-2xl text-center text-neutral-400 font-semibold text-sm">
                              Bu masaya ait aktif sipariş bulunmuyor. "Yeni Sipariş Gir" butonuyla ekleyebilirsiniz.
                            </div>
                          ) : (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                                    <Card className="card-3d border-none flex flex-col h-full hover:border-[#dcae61]/25 transition-all duration-300 overflow-hidden shadow-xl">
                                      <CardHeader className="p-4 pb-2.5 border-b border-amber-950/10 bg-neutral-900/30">
                                        <div className="flex justify-between items-center">
                                          <div className="text-xs font-bold text-neutral-400">
                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </div>
                                          <Badge className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                            order.status === 'Yeni' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25' : 
                                            order.status === 'Hazırlanıyor' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' : 
                                            order.status === 'Hazır' ? 'bg-green-500/15 text-green-400 border border-green-500/25' : 
                                            order.status === 'Ödeme Bekleniyor' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25 animate-pulse' : 'bg-neutral-800 text-neutral-400'
                                          }`}>
                                            {order.status}
                                          </Badge>
                                        </div>
                                      </CardHeader>
                                      <CardContent className="p-4.5 flex-1">
                                        <ul className="space-y-2 mb-4.5">
                                          {order.items.map(item => (
                                            <li key={item.id} className="flex justify-between text-sm">
                                              <span className="text-neutral-300 font-bold">{item.quantity}x {item.name}</span>
                                              <span className="text-neutral-400 font-semibold">₺{(item.price * item.quantity).toFixed(2)}</span>
                                            </li>
                                          ))}
                                        </ul>
                                        <div className="pt-3 border-t border-amber-950/10 flex flex-col gap-2">
                                          <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-xl bg-neutral-950/40 border border-amber-950/10 text-[#dcae61] uppercase tracking-wider">
                                              {order.status === 'Ödeme Bekleniyor' ? 'Kısmi Ödenen' : 'Hesap'}
                                            </span>
                                            <span className="font-extrabold text-[#dcae61] text-base">₺{order.total.toFixed(2)}</span>
                                          </div>
                                          {order.paidAmount !== undefined && order.paidAmount > 0 && (
                                            <div className="flex justify-between items-center text-xs text-emerald-400 font-semibold">
                                              <span>Ödenen:</span>
                                              <span className="font-bold">₺{order.paidAmount.toFixed(2)}</span>
                                            </div>
                                          )}
                                          {order.remainingAmount !== undefined && order.remainingAmount > 0 && (
                                            <div className="flex justify-between items-center text-xs text-red-400 font-bold">
                                              <span>Kalan:</span>
                                              <span className="font-bold">₺{order.remainingAmount.toFixed(2)}</span>
                                            </div>
                                          )}
                                        </div>
                                        {order.note && (
                                          <div className="mt-3 text-xs bg-amber-950/10 text-amber-300 p-2.5 rounded-xl border border-amber-900/15 font-medium leading-relaxed">
                                            <span className="font-bold text-[#dcae61] block mb-0.5">Not:</span> {order.note}
                                          </div>
                                        )}
                                      </CardContent>
                                      <CardFooter className="p-4 pt-0 flex gap-2 mt-auto">
                                        {order.status === 'Yeni' && (
                                          <Button size="sm" className="w-full button-3d-accent rounded-full h-10 text-xs uppercase font-bold tracking-wider" onClick={() => updateOrderStatus(order.id, 'Hazırlanıyor')}>
                                            <Play className="w-3.5 h-3.5 mr-1" />
                                            Hazırlanıyor
                                          </Button>
                                        )}
                                        {order.status === 'Hazırlanıyor' && (
                                          <Button size="sm" className="w-full button-3d-primary rounded-full h-10 text-xs uppercase font-bold tracking-widest" onClick={() => updateOrderStatus(order.id, 'Hazır')}>
                                            <Check className="w-3.5 h-3.5 mr-1" />
                                            Hazır
                                          </Button>
                                        )}
                                        {order.status === 'Hazır' && (
                                          <Button size="sm" className="w-full button-3d-secondary rounded-full h-10 text-xs uppercase font-bold tracking-wider" onClick={() => updateOrderStatus(order.id, 'Teslim Edildi')}>
                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                            Teslim Edildi
                                          </Button>
                                        )}
                                        {order.status === 'Teslim Edildi' && (
                                          <div className="w-full text-center text-xs font-bold text-neutral-400 py-2.5 bg-neutral-950/40 border border-amber-950/5 rounded-xl uppercase tracking-wider">
                                            Teslim edildi
                                          </div>
                                        )}
                                        {order.status === 'Ödeme Bekleniyor' && (
                                          <div className="w-full text-center text-xs font-bold text-[#dcae61] py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl uppercase tracking-wider animate-pulse">
                                            Ödemesi bekleniyor
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
