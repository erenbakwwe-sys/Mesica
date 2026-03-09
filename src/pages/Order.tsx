import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, PaymentMethod } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { BellRing, CheckCircle2, ChevronRight, Minus, Plus, ShoppingBag, Trash2, CreditCard, Banknote, Loader2, MessageSquarePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Order() {
  const { cart, addToCart, removeFromCart, total, placeOrder, callWaiter } = useCart();
  const navigate = useNavigate();
  const [tableNumber] = useState('Masa 7');
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Kart');
  const [wantsNote, setWantsNote] = useState(false);
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCallWaiter = () => {
    callWaiter(tableNumber);
    setWaiterCalled(true);
    setTimeout(() => setWaiterCalled(false), 3000);
  };

  const handlePlaceOrder = () => {
    const finalNote = wantsNote ? note : '';
    if (paymentMethod === 'Kart') {
      setIsProcessing(true);
      // Simulate payment processing
      setTimeout(() => {
        setIsProcessing(false);
        placeOrder(tableNumber, paymentMethod, finalNote);
        setOrderPlaced(true);
      }, 2000);
    } else {
      // Cash payment, place order immediately
      placeOrder(tableNumber, paymentMethod, finalNote || 'Nakit ödenecek');
      setOrderPlaced(true);
    }
  };

  if (orderPlaced) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="rounded-full bg-green-100 p-6 text-green-600 mb-6"
        >
          <CheckCircle2 className="h-16 w-16" />
        </motion.div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Siparişiniz Alındı!</h2>
        <p className="mt-4 text-lg text-slate-600">Siparişiniz mutfağa iletildi. Afiyet olsun!</p>
        <Button onClick={() => navigate('/menu')} className="mt-8 rounded-full" variant="outline">
          Menüye Dön
        </Button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-3xl pb-12"
    >
      <div className="mb-8 flex items-center justify-between rounded-2xl bg-orange-50 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{tableNumber} – Dijital Menü</h1>
          <p className="text-slate-500">QR Sipariş Ekranı</p>
        </div>
        <Button
          variant={waiterCalled ? "default" : "outline"}
          className={`rounded-full transition-all ${waiterCalled ? 'bg-green-600 hover:bg-green-700 text-white border-none' : 'border-orange-200 text-orange-600 hover:bg-orange-100'}`}
          onClick={handleCallWaiter}
          disabled={waiterCalled}
        >
          <BellRing className="mr-2 h-4 w-4" />
          {waiterCalled ? 'Garson Çağrıldı' : 'Garsonu Çağır'}
        </Button>
      </div>

      {cart.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 text-center py-16">
          <CardContent className="flex flex-col items-center justify-center">
            <div className="rounded-full bg-slate-100 p-4 text-slate-400 mb-4">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <CardTitle className="mb-2">Sepetiniz Boş</CardTitle>
            <CardDescription className="mb-6">Sipariş vermek için menüden ürün ekleyin.</CardDescription>
            <Button onClick={() => navigate('/menu')} className="rounded-full">
              Menüye Dön
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden border-none shadow-md">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <ShoppingBag className="h-5 w-5 text-orange-600" />
                Sipariş Özeti
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-slate-100">
                {cart.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 p-6 hover:bg-slate-50/50 transition-colors">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between">
                        <h4 className="font-semibold text-slate-900">{item.name}</h4>
                        <span className="font-medium text-slate-900">₺{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm text-slate-500">₺{item.price.toFixed(2)} / adet</span>
                        <div className="flex items-center rounded-full border border-slate-200 bg-white shadow-sm">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-l-full text-slate-500 hover:text-orange-600"
                            onClick={() => removeFromCart(item.id)}
                            disabled={isProcessing}
                          >
                            {item.quantity === 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-r-full text-slate-500 hover:text-orange-600"
                            onClick={() => addToCart(item.id)}
                            disabled={isProcessing}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Sipariş Notu</CardTitle>
              <CardDescription>Siparişinizle ilgili özel bir isteğiniz var mı?</CardDescription>
            </CardHeader>
            <CardContent>
              {!wantsNote ? (
                <Button 
                  variant="outline" 
                  className="w-full border-dashed border-2 text-slate-500 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50"
                  onClick={() => setWantsNote(true)}
                  disabled={isProcessing}
                >
                  <MessageSquarePlus className="mr-2 h-4 w-4" />
                  Sipariş Notu Ekle
                </Button>
              ) : (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <Input 
                      placeholder="Örn: Ketçap olmasın, az pişmiş olsun..." 
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      disabled={isProcessing}
                      autoFocus
                    />
                    <div className="flex justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setWantsNote(false);
                          setNote('');
                        }}
                        disabled={isProcessing}
                        className="text-slate-500 hover:text-red-600"
                      >
                        Notu İptal Et
                      </Button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Ödeme Yöntemi</CardTitle>
              <CardDescription>Nasıl ödemek istersiniz?</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button
                variant={paymentMethod === 'Kart' ? 'default' : 'outline'}
                className={`flex-1 h-14 ${paymentMethod === 'Kart' ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                onClick={() => setPaymentMethod('Kart')}
                disabled={isProcessing}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Kredi Kartı
              </Button>
              <Button
                variant={paymentMethod === 'Nakit' ? 'default' : 'outline'}
                className={`flex-1 h-14 ${paymentMethod === 'Nakit' ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                onClick={() => setPaymentMethod('Nakit')}
                disabled={isProcessing}
              >
                <Banknote className="mr-2 h-5 w-5" />
                Nakit
              </Button>
            </CardContent>
            <CardFooter className="flex-col items-stretch border-t border-slate-100 bg-slate-50/50 p-6 gap-6">
              <div className="flex items-center justify-between text-lg font-semibold text-slate-900">
                <span>Toplam Tutar</span>
                <span className="text-2xl text-orange-600">₺{total.toFixed(2)}</span>
              </div>
              <Button 
                size="lg" 
                className="w-full rounded-full h-14 text-base bg-slate-900 hover:bg-slate-800 text-white" 
                onClick={handlePlaceOrder}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Ödeme Alınıyor...
                  </>
                ) : (
                  <>
                    Siparişi Onayla ve Öde
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </motion.div>
  );
}
