import { useState } from 'react';
import { useCart, Expense } from '../context/CartContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Wallet, DollarSign, Calendar, Landmark, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AdminProfitLoss() {
  const { orders, staff, stock, expenses, addExpense, removeExpense } = useCart();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Kira',
    description: '',
    amount: ''
  });

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.amount) {
      alert("Lütfen Kategori ve Tutar alanlarını doldurunuz.");
      return;
    }

    await addExpense({
      category: formData.category,
      description: formData.description || '',
      amount: parseFloat(formData.amount) || 0
    });

    setFormData({
      category: 'Kira',
      description: '',
      amount: ''
    });
    setShowAddForm(false);
  };

  // 1. Calculate Revenue
  const totalRevenue = orders ? orders.reduce((sum, o) => {
    if (o.status === 'Ödeme Bekleniyor') {
      return sum + (o.paidAmount || 0);
    }
    // If not unpaid/pending, it represents fully completed/paid orders
    return sum + (o.total || 0);
  }, 0) : 0;

  // 2. Calculate Staff Costs (Monthly)
  const totalStaffCost = staff ? staff.reduce((sum, s) => sum + s.salary, 0) : 0;

  // 3. Calculate Stock Asset/Purchased Material Value
  const totalStockCost = stock ? stock.reduce((sum, s) => sum + s.quantity * s.unitPrice, 0) : 0;

  // 4. Calculate Custom Operational Expenses
  const totalCustomExpenses = expenses ? expenses.reduce((sum, e) => sum + e.amount, 0) : 0;

  // 5. Calculate Total Tips
  const totalTips = orders ? orders.reduce((sum, o) => {
    if (o.payments) {
      return sum + o.payments.reduce((pSum, p) => pSum + (p.tip || 0), 0);
    }
    return sum;
  }, 0) : 0;

  // Total Expenses (Sum of Staff, Stock Assets purchased, and Custom logged expenses)
  const totalExpenses = totalStaffCost + totalStockCost + totalCustomExpenses;

  // Net Profit or Loss
  const netProfit = totalRevenue - totalExpenses;
  const isProfit = netProfit >= 0;

  return (
    <div className="space-y-6 text-[#f5f2eb]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white font-sans">Kâr & Zarar Tablosu</h2>
          <p className="text-neutral-400 font-medium text-xs sm:text-sm">Flux Zone Coffee anlık finansal sağlık raporu.</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="button-3d-primary rounded-full px-5 h-11 text-xs uppercase font-bold tracking-wider"
        >
          {showAddForm ? 'Formu Kapat' : <><Plus className="w-4 h-4 mr-1.5" /> Gider Logu Ekle</>}
        </Button>
      </div>

      {/* Main Kar-Zarar Card */}
      <Card className="card-3d border-none bg-gradient-to-tr from-neutral-900/90 to-amber-950/20 p-6 overflow-hidden relative">
        <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20 ${isProfit ? 'bg-emerald-500' : 'bg-red-500'}`} />
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Net Finansal Durum</span>
              <div className={`text-4xl sm:text-5xl font-black mt-1 flex items-baseline gap-2 ${isProfit ? 'text-emerald-400' : 'text-red-500'}`}>
                ₺{netProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-sm font-bold uppercase tracking-wider text-neutral-500">
                  {isProfit ? 'Net Kâr' : 'Net Zarar'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-medium mt-2 max-w-md leading-relaxed">
                Bu tablo, tüm zamanların sipariş gelirlerinden; aylık personel giderleri, mevcut hammadde/envanter varlık giderleri ve sisteme kaydedilen fatura/kira gibi işletme maliyetlerinin düşülmesiyle hesaplanır.
              </p>
            </div>
            <div className={`flex items-center gap-3 rounded-2xl px-5 py-4 border ${isProfit ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-400' : 'bg-red-500/10 border-red-500/15 text-red-400'}`}>
              {isProfit ? <ArrowUpRight className="w-10 h-10" /> : <ArrowDownRight className="w-10 h-10" />}
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Verimlilik</span>
                <span className="text-lg font-extrabold">
                  {totalExpenses > 0 ? `${((totalRevenue / totalExpenses) * 100 - 100).toFixed(1)}%` : '100%'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Revenue */}
        <Card className="card-3d border-none bg-neutral-900/60 p-5 flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row justify-between items-center space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-neutral-400">Toplam Gelir (Ciro)</CardTitle>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-black text-white">₺{totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-neutral-500 font-semibold mt-1">Ödemesi tamamlanmış tüm siparişler</p>
          </CardContent>
        </Card>

        {/* Staff salaries cost */}
        <Card className="card-3d border-none bg-neutral-900/60 p-5 flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row justify-between items-center space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-neutral-400">Personel Gideri</CardTitle>
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/15">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-black text-white">₺{totalStaffCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-neutral-500 font-semibold mt-1">Aylık toplam maaş ödemesi</p>
          </CardContent>
        </Card>

        {/* Stock value */}
        <Card className="card-3d border-none bg-neutral-900/60 p-5 flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row justify-between items-center space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-neutral-400">Envanter Maliyeti</CardTitle>
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/15">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-black text-white">₺{totalStockCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-neutral-500 font-semibold mt-1">Hammadde ve malzeme maliyetleri</p>
          </CardContent>
        </Card>

        {/* Logged other expenses */}
        <Card className="card-3d border-none bg-neutral-900/60 p-5 flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row justify-between items-center space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-neutral-400">İşletme Giderleri</CardTitle>
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/15">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-black text-white">₺{totalCustomExpenses.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-neutral-500 font-semibold mt-1">Kira, faturalar ve diğer giderler</p>
          </CardContent>
        </Card>

        {/* Total Tips card */}
        <Card className="card-3d border-none bg-neutral-900/60 p-5 flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row justify-between items-center space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-neutral-400">Toplam Bahşiş</CardTitle>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/15">
              <Sparkles className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-black text-white">₺{totalTips.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-neutral-500 font-semibold mt-1">Ekibe bırakılan toplam bahşiş</p>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="card-3d border-none shadow-xl bg-neutral-900/60 backdrop-blur-md p-6 max-w-xl">
              <form onSubmit={handleAddExpense} className="space-y-4">
                <h3 className="text-lg font-bold text-[#dcae61] mb-2 flex items-center gap-2">
                  <Wallet className="w-5 h-5" /> İşletme Gider Logu Ekle
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Kategori</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full h-11 rounded-xl border border-amber-950/20 px-3.5 text-sm font-semibold focus:border-[#dcae61] focus:outline-none focus:ring-1 focus:ring-[#dcae61] bg-neutral-950 text-white"
                    >
                      <option value="Kira">Kira Gideri</option>
                      <option value="Fatura">Elektrik / Su / İnternet Faturası</option>
                      <option value="Kahve Alımı">Sertifikalı Kahve Çekirdeği Tedariği</option>
                      <option value="Sarf Malzeme">Karton Bardak / Pipet Tedariği</option>
                      <option value="Reklam & Pazarlama">Reklam & Pazarlama</option>
                      <option value="Diğer">Diğer Giderler</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Tutar (₺)</label>
                    <Input 
                      type="number" 
                      step="any"
                      placeholder="Örn: 8500"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      className="bg-neutral-950/50 border-amber-950/20 text-white rounded-xl h-11"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Açıklama</label>
                  <Input 
                    type="text" 
                    placeholder="Örn: Haziran ayı elektrik faturası"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-neutral-950/50 border-amber-950/20 text-white rounded-xl h-11 w-full"
                  />
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
                    Gideri Kaydet
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expenses History Table / List */}
      <Card className="card-3d border-none shadow-xl bg-neutral-900/40 p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#dcae61]" /> Gider Kayıtları ve Arşivi
          </CardTitle>
          <CardDescription className="text-neutral-400">Sisteme girilmiş olan tüm işletme gider ve harcama detayları.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!expenses || expenses.length === 0 ? (
            <div className="text-center py-10 text-neutral-500 font-semibold text-xs sm:text-sm">
              Henüz kaydedilmiş özel bir gider bulunmamaktadır.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-amber-950/15 text-[10px] font-black uppercase tracking-wider text-neutral-500">
                    <th className="py-3 px-4">Tarih</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Açıklama</th>
                    <th className="py-3 px-4 text-right">Tutar</th>
                    <th className="py-3 px-4 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-950/5">
                  {expenses
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((expense) => (
                      <tr key={expense.id} className="text-sm hover:bg-neutral-900/30 transition-all font-medium text-neutral-300">
                        <td className="py-3.5 px-4 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                          {new Date(expense.date).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-[#dcae61]/10 text-[#dcae61] border border-amber-950/15 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase">
                            {expense.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate">{expense.description || '-'}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-red-400">
                          ₺{expense.amount.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeExpense(expense.id)}
                            className="h-8 w-8 rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
