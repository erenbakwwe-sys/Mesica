import { useState } from 'react';
import { useCart, Coupon } from '../context/CartContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { Plus, Trash2, Tag, Percent, ToggleLeft, ToggleRight, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AdminCoupons() {
  const { coupons, addCoupon, toggleCouponStatus, removeCoupon } = useCart();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    minOrderAmount: '',
    expiryDate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.discountValue) {
      alert("Lütfen kupon kodu ve indirim miktarını giriniz.");
      return;
    }

    await addCoupon({
      id: formData.id.toUpperCase().trim(),
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue) || 0,
      isActive: true,
      minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
      expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : null
    });

    setFormData({
      id: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderAmount: '',
      expiryDate: ''
    });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6 text-[#f5f2eb]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white font-sans">Kupon Yönetimi</h2>
          <p className="text-neutral-400 font-medium text-xs sm:text-sm">Flux Zone Coffee özel promosyon ve indirim kodları.</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="button-3d-primary rounded-full px-5 h-11 text-xs uppercase font-bold tracking-wider"
        >
          {showAddForm ? 'Formu Kapat' : <><Plus className="w-4 h-4 mr-1.5" /> İndirim Kuponu Ekle</>}
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
                  <Tag className="w-5 h-5" /> Yeni İndirim Kuponu Tanımla
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Kupon Kodu</label>
                    <Input 
                      type="text" 
                      placeholder="Örn: FLUX20"
                      value={formData.id}
                      onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                      className="bg-neutral-950/50 border-amber-950/20 text-white rounded-xl h-11 uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">İndirim Türü</label>
                    <select 
                      value={formData.discountType}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value as 'percentage' | 'fixed' }))}
                      className="w-full h-11 rounded-xl border border-amber-950/20 px-3.5 text-sm font-semibold focus:border-[#dcae61] focus:outline-none focus:ring-1 focus:ring-[#dcae61] bg-neutral-950 text-white"
                    >
                      <option value="percentage">Yüzde (%)</option>
                      <option value="fixed">Sabit Tutar (₺)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">İndirim Miktarı</label>
                    <Input 
                      type="number" 
                      placeholder={formData.discountType === 'percentage' ? "Örn: 20" : "Örn: 50"}
                      value={formData.discountValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                      className="bg-neutral-950/50 border-amber-950/20 text-white rounded-xl h-11"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Minimum Sipariş Tutarı (₺)</label>
                    <Input 
                      type="number" 
                      placeholder="Örn: 150 (Opsiyonel)"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, minOrderAmount: e.target.value }))}
                      className="bg-neutral-950/50 border-amber-950/20 text-white rounded-xl h-11"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Geçerlilik Son Tarihi</label>
                    <Input 
                      type="date" 
                      value={formData.expiryDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                      className="bg-neutral-950/50 border-amber-950/20 text-white rounded-xl h-11"
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
                    Kupon Oluştur
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!coupons || coupons.length === 0 ? (
        <Card className="card-3d border-dashed border-2 border-amber-950/15 bg-neutral-900/40 text-center py-16">
          <CardContent className="flex flex-col items-center justify-center">
            <div className="rounded-2xl bg-[#dcae61]/10 p-4 text-[#dcae61] mb-5 border border-amber-900/10 shadow-md">
              <Tag className="h-8 w-8" />
            </div>
            <CardTitle className="mb-2 text-xl font-bold text-white">Promosyon Kuponu Yok</CardTitle>
            <CardDescription className="text-neutral-400 font-medium">Henüz sisteme tanımlanmış bir indirim kuponu bulunmamaktadır.</CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon) => (
            <motion.div
              key={coupon.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full"
            >
              <Card className={`card-3d h-full flex flex-col justify-between border-2 ${coupon.isActive ? 'border-[#dcae61]/25 bg-[#dcae61]/[0.01]' : 'border-neutral-900/40 bg-neutral-950/10'} hover:border-[#dcae61]/35 hover:translate-y-[-2px] transition-all relative overflow-hidden`}>
                <div className="absolute top-0 right-0 p-3 flex gap-2 items-center">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => toggleCouponStatus(coupon.id, !coupon.isActive)}
                    className={`h-8 w-8 rounded-full ${coupon.isActive ? 'text-emerald-400' : 'text-neutral-500'}`}
                  >
                    {coupon.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeCoupon(coupon.id)}
                    className="h-8 w-8 rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </Button>
                </div>

                <CardContent className="p-5 pt-10 flex flex-col justify-between h-full space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      {coupon.discountType === 'percentage' ? (
                        <Percent className="w-5 h-5 text-[#dcae61]" />
                      ) : (
                        <DollarSign className="w-5 h-5 text-[#dcae61]" />
                      )}
                      <span className="text-2xl font-black text-white font-sans tracking-wide">{coupon.id}</span>
                    </div>

                    <div className="space-y-1 mt-3">
                      <p className="text-sm text-neutral-300 font-bold">
                        İndirim Değeri:{' '}
                        <span className="text-[#dcae61] font-black">
                          {coupon.discountType === 'percentage' ? `%${coupon.discountValue}` : `₺${coupon.discountValue}`}
                        </span>
                      </p>
                      {coupon.minOrderAmount !== undefined && (
                        <p className="text-xs text-neutral-400 font-semibold">
                          Minimum Sepet Tutarı:{' '}
                          <span className="text-white">₺{coupon.minOrderAmount}</span>
                        </p>
                      )}
                      {coupon.expiryDate && (
                        <p className="text-xs text-neutral-400 font-semibold">
                          Son Kullanma:{' '}
                          <span className="text-white">
                            {new Date(coupon.expiryDate).toLocaleDateString('tr-TR')}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-amber-950/10 flex justify-between items-center">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${coupon.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'bg-neutral-900 text-neutral-500 border border-neutral-900'}`}>
                      {coupon.isActive ? 'AKTİF' : 'PASİF'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
