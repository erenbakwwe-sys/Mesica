import { useState } from 'react';
import { useCart, Staff } from '../context/CartContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { Plus, Trash2, User, Phone, Mail, DollarSign, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AdminStaff() {
  const { staff, addStaff, removeStaff } = useCart();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: 'Barista',
    salary: '',
    phone: '',
    email: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role || !formData.salary) {
      alert("Lütfen en azından İsim, Rol ve Maaş alanlarını doldurunuz.");
      return;
    }

    await addStaff({
      name: formData.name,
      role: formData.role,
      salary: parseFloat(formData.salary) || 0,
      phone: formData.phone,
      email: formData.email
    });

    setFormData({
      name: '',
      role: 'Barista',
      salary: '',
      phone: '',
      email: ''
    });
    setShowAddForm(false);
  };

  const totalSalaries = staff ? staff.reduce((sum, s) => sum + s.salary, 0) : 0;

  return (
    <div className="space-y-6 text-[#f5f2eb]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white font-sans">Personel Yönetimi</h2>
          <p className="text-neutral-400 font-medium text-xs sm:text-sm">Flux Zone Coffee ekip kadrosu ve aylık giderleri.</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="button-3d-primary rounded-full px-5 h-11 text-xs uppercase font-bold tracking-wider"
        >
          {showAddForm ? 'Formu Kapat' : <><Plus className="w-4 h-4 mr-1.5" /> Personel Ekle</>}
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
                  <User className="w-5 h-5" /> Yeni Personel Kaydı
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Ad Soyad</label>
                    <Input 
                      type="text" 
                      placeholder="Örn: Eren Bak"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-neutral-950/50 border-amber-950/20 text-white rounded-xl h-11"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Pozisyon / Rol</label>
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full h-11 rounded-xl border border-amber-950/20 px-3.5 text-sm font-semibold focus:border-[#dcae61] focus:outline-none focus:ring-1 focus:ring-[#dcae61] bg-neutral-950 text-white"
                    >
                      <option value="Barista">Barista</option>
                      <option value="Şef">Mutfak Şefi</option>
                      <option value="Kasiyer">Kasiyer</option>
                      <option value="Garson">Garson</option>
                      <option value="Müdür">Müdür</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Aylık Net Maaş (₺)</label>
                    <Input 
                      type="number" 
                      placeholder="Örn: 35000"
                      value={formData.salary}
                      onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                      className="bg-neutral-950/50 border-amber-950/20 text-white rounded-xl h-11"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Telefon Numarası</label>
                    <Input 
                      type="tel" 
                      placeholder="0555 123 4567"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-neutral-950/50 border-amber-950/20 text-white rounded-xl h-11"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">E-posta Adresi</label>
                  <Input 
                    type="email" 
                    placeholder="personel@fluxzone.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
                    Personeli Ekle
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Total Payroll Stat */}
        <Card className="card-3d border-none bg-gradient-to-tr from-amber-950/20 to-neutral-900/60 p-5 col-span-1 flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row justify-between items-center space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-neutral-400">Toplam Personel</CardTitle>
            <div className="p-2 rounded-xl bg-[#dcae61]/10 text-[#dcae61] border border-amber-950/15">
              <User className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-black text-white">{staff ? staff.length : 0} Kişi</div>
            <p className="text-xs text-neutral-500 font-semibold mt-1">Aktif çalışan sayısı</p>
          </CardContent>
        </Card>

        <Card className="card-3d border-none bg-gradient-to-tr from-amber-950/20 to-neutral-900/60 p-5 col-span-1 sm:col-span-2 flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row justify-between items-center space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-neutral-400 font-sans">Aylık Toplam Maaş Gideri</CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-black text-white">₺{totalSalaries.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-neutral-500 font-semibold mt-1">Bütçeden ayrılan aylık personel payı</p>
          </CardContent>
        </Card>
      </div>

      {!staff || staff.length === 0 ? (
        <Card className="card-3d border-dashed border-2 border-amber-950/15 bg-neutral-900/40 text-center py-16">
          <CardContent className="flex flex-col items-center justify-center">
            <div className="rounded-2xl bg-[#dcae61]/10 p-4 text-[#dcae61] mb-5 border border-amber-900/10 shadow-md">
              <Briefcase className="h-8 w-8" />
            </div>
            <CardTitle className="mb-2 text-xl font-bold text-white">Personel Kaydı Bulunmuyor</CardTitle>
            <CardDescription className="text-neutral-400 font-medium">Henüz sisteme eklenmiş bir çalışan personeli bulunmamaktadır.</CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => (
            <motion.div
              key={member.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full"
            >
              <Card className="card-3d h-full flex flex-col border-none hover:border-[#dcae61]/35 hover:translate-y-[-2px] transition-all relative overflow-hidden">
                <CardHeader className="p-5 pb-3 bg-neutral-900/30 border-b border-amber-950/10">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <CardTitle className="text-lg font-black text-white">{member.name}</CardTitle>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#dcae61]/15 text-[#dcae61] border border-[#dcae61]/20 mt-1">
                        {member.role}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeStaff(member.id)}
                      className="h-8 w-8 rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-5 flex-1 space-y-2.5">
                  <div className="flex items-center text-sm text-neutral-300 font-medium">
                    <DollarSign className="w-4 h-4 mr-2.5 text-[#dcae61]" />
                    <span className="text-neutral-500 mr-1.5 font-bold">Maaş:</span>
                    <span className="text-white font-extrabold">₺{member.salary.toLocaleString('tr-TR')} / ay</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center text-sm text-neutral-300 font-medium">
                      <Phone className="w-4 h-4 mr-2.5 text-[#dcae61]" />
                      <span className="text-neutral-500 mr-1.5 font-bold">Tel:</span>
                      <a href={`tel:${member.phone}`} className="text-[#dcae61] hover:underline font-bold">{member.phone}</a>
                    </div>
                  )}
                  {member.email && (
                    <div className="flex items-center text-sm text-neutral-300 font-medium">
                      <Mail className="w-4 h-4 mr-2.5 text-[#dcae61]" />
                      <span className="text-neutral-500 mr-1.5 font-bold">E-posta:</span>
                      <a href={`mailto:${member.email}`} className="text-[#dcae61] hover:underline font-bold truncate max-w-[160px]">{member.email}</a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
