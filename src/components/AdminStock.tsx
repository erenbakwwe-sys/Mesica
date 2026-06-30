import { useState } from 'react';
import { useCart, StockItem } from '../context/CartContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Plus, Minus, Trash2, Box, AlertTriangle, Layers, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AdminStock() {
  const { stock, addStockItem, updateStockItem, removeStockItem } = useCart();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    minQuantity: '',
    unit: 'Adet',
    unitPrice: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.quantity || !formData.minQuantity || !formData.unitPrice) {
      alert("Lütfen tüm alanları doldurunuz.");
      return;
    }

    await addStockItem({
      name: formData.name,
      quantity: parseFloat(formData.quantity) || 0,
      minQuantity: parseFloat(formData.minQuantity) || 0,
      unit: formData.unit,
      unitPrice: parseFloat(formData.unitPrice) || 0
    });

    setFormData({
      name: '',
      quantity: '',
      minQuantity: '',
      unit: 'Adet',
      unitPrice: ''
    });
    setShowAddForm(false);
  };

  const adjustQuantity = async (id: string, currentQty: number, change: number) => {
    const newQty = Math.max(0, currentQty + change);
    await updateStockItem(id, { quantity: newQty });
  };

  const criticalItems = stock ? stock.filter(item => item.quantity <= item.minQuantity) : [];
  const totalStockCost = stock ? stock.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) : 0;

  return (
    <div className="space-y-6 text-[#f5f2eb]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white font-sans">Stok Yönetimi</h2>
          <p className="text-neutral-400 font-medium text-xs sm:text-sm">Flux Zone Coffee malzeme, kahve çekirdeği ve sarf malzeme takibi.</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="button-3d-primary rounded-full px-5 h-11 text-xs uppercase font-bold tracking-wider"
        >
          {showAddForm ? 'Formu Kapat' : <><Plus className="w-4 h-4 mr-1.5" /> Stok Kalemi Ekle</>}
        </Button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="card-3d border-none shadow-xl bg-neutral-900/60 backdrop-blur-md p-6 max-w-2xl">
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-bold text-[#dcae61] mb-2 flex items-center gap-2">
                  <Box className="w-5 h-5" /> Yeni Malzeme Girişi
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Malzeme Adı</label>
                    <Input 
                      type="text" 
                      placeholder="Örn: Espresso Çekirdeği (Blend)"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-neutral-950/50 border-amber-950/20 text-white rounded-xl h-11"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Ölçü Birimi</label>
                    <select 
                      value={formData.unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                      className="w-full h-11 rounded-xl border border-amber-950/20 px-3.5 text-sm font-semibold focus:border-[#dcae61] focus:outline-none focus:ring-1 focus:ring-[#dcae61] bg-neutral-950 text-white"
                    >
                      <option value="Kg">Kilogram (Kg)</option>
                      <option value="Litre">Litre (L)</option>
                      <option value="Adet">Adet (Pcs)</option>
                      <option value="Paket">Paket (Pkg)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Mevcut Miktar</label>
                    <Input 
                      type="number" 
                      step="any"
                      placeholder="Örn: 25"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      className="bg-neutral-950/50 border-amber-950/20 text-white rounded-xl h-11"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Kritik Eşik Miktarı</label>
                    <Input 
                      type="number" 
                      step="any"
                      placeholder="Örn: 5"
                      value={formData.minQuantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, minQuantity: e.target.value }))}
                      className="bg-neutral-950/50 border-amber-950/20 text-white rounded-xl h-11"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Birim Alış Fiyatı (₺)</label>
                    <Input 
                      type="number" 
                      step="any"
                      placeholder="Örn: 320"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
                      className="bg-neutral-950/50 border-amber-950/20 text-white rounded-xl h-11"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <Button 
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="button-3d-secondary rounded-full h-11 px-5 text-xs font-bold uppercase tracking-wider"
                  >
                    Vazgeç
                  </Button>
                  <Button 
                    type="submit"
                    className="button-3d-primary rounded-full h-11 px-6 text-xs font-bold uppercase tracking-wider"
                  >
                    Stok Ekle
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats row */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Total Stock Cost Stat */}
        <Card className="card-3d border-none bg-gradient-to-tr from-amber-950/20 to-neutral-900/60 p-5 col-span-1 flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row justify-between items-center space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-neutral-400">Toplam Envanter Değeri</CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-black text-white">₺{totalStockCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-neutral-500 font-semibold mt-1">Stoklardaki ürünlerin toplam alış değeri</p>
          </CardContent>
        </Card>

        {/* Critical Level Stat */}
        <Card className="card-3d border-none bg-gradient-to-tr from-amber-950/20 to-neutral-900/60 p-5 col-span-1 flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row justify-between items-center space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-neutral-400">Kritik Stoklar</CardTitle>
            <div className={`p-2 rounded-xl ${criticalItems.length > 0 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-[#dcae61]/10 text-[#dcae61] border border-amber-950/15'}`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className={`text-3xl font-black ${criticalItems.length > 0 ? 'text-red-500' : 'text-white'}`}>{criticalItems.length} Kalem</div>
            <p className="text-xs text-neutral-500 font-semibold mt-1">Eşik altına düşmüş malzemeler</p>
          </CardContent>
        </Card>

        {/* Total Unique Items Stat */}
        <Card className="card-3d border-none bg-gradient-to-tr from-amber-950/20 to-neutral-900/60 p-5 col-span-1 flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row justify-between items-center space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-neutral-400">Toplam Benzersiz Ürün</CardTitle>
            <div className="p-2 rounded-xl bg-[#dcae61]/10 text-[#dcae61] border border-amber-950/15">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-black text-white">{stock ? stock.length : 0} Çeşit</div>
            <p className="text-xs text-neutral-500 font-semibold mt-1">Aktif takip edilen envanter çeşidi</p>
          </CardContent>
        </Card>
      </div>

      {!stock || stock.length === 0 ? (
        <Card className="card-3d border-dashed border-2 border-amber-950/15 bg-neutral-900/40 text-center py-16">
          <CardContent className="flex flex-col items-center justify-center">
            <div className="rounded-2xl bg-[#dcae61]/10 p-4 text-[#dcae61] mb-5 border border-amber-900/10 shadow-md">
              <Box className="h-8 w-8" />
            </div>
            <CardTitle className="mb-2 text-xl font-bold text-white">Stok Kalemi Bulunmuyor</CardTitle>
            <CardDescription className="text-neutral-400 font-medium">Henüz sisteme eklenmiş bir stok veya malzeme bulunmamaktadır.</CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stock.map((item) => {
            const isCritical = item.quantity <= item.minQuantity;
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full"
              >
                <Card className={`card-3d h-full flex flex-col border-2 ${isCritical ? 'border-red-500/20 bg-red-500/[0.02]' : 'border-none'} hover:border-[#dcae61]/35 hover:translate-y-[-2px] transition-all relative overflow-hidden`}>
                  {isCritical && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white font-extrabold px-3 py-1 rounded-bl-xl text-[9px] uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Kritik Stok
                    </div>
                  )}
                  <CardHeader className="p-5 pb-3 bg-neutral-900/30 border-b border-amber-950/10">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <CardTitle className="text-lg font-black text-white">{item.name}</CardTitle>
                        <p className="text-xs text-neutral-400 font-medium mt-1">Birim Alış: ₺{item.unitPrice.toFixed(2)} / {item.unit}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeStockItem(item.id)}
                        className="h-8 w-8 rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Mevcut Seviye</span>
                        <span className="text-2xl font-black text-white">{item.quantity} {item.unit}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Minimum Limit</span>
                        <span className="text-sm font-bold text-[#dcae61]">{item.minQuantity} {item.unit}</span>
                      </div>
                    </div>

                    {/* Stock Adjustment Controls */}
                    <div className="flex gap-2 items-center bg-neutral-950/50 p-2 rounded-xl border border-amber-950/10 shadow-inner">
                      <Button 
                        onClick={() => adjustQuantity(item.id, item.quantity, -1)}
                        className="flex-1 rounded-lg h-9 bg-neutral-900 border border-amber-950/10 hover:bg-neutral-850 hover:text-white"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-xs font-bold text-neutral-400 px-2 uppercase tracking-wide">Miktar Güncelle</span>
                      <Button 
                        onClick={() => adjustQuantity(item.id, item.quantity, 1)}
                        className="flex-1 rounded-lg h-9 bg-neutral-900 border border-amber-950/10 hover:bg-neutral-850 hover:text-white"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
