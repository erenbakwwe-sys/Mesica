import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle2, CreditCard, Wallet, Camera, X, ScanLine, Calculator, Users, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { useCart, PaymentMethod } from '../context/CartContext';

export function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders, addPaymentToTableOrders, coupons } = useCart();
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Kart');
  const [splitType, setSplitType] = useState<'full' | 'equal' | 'custom'>('full');
  const [splitCount, setSplitCount] = useState(2);
  const [customAmount, setCustomAmount] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  const [isScanning, setIsScanning] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');

  const [tipSelection, setTipSelection] = useState<'none' | '10' | '15' | '20' | 'custom'>('none');
  const [customTip, setCustomTip] = useState('');

  // Get current table from localStorage or URL
  const searchParams = new URLSearchParams(location.search);
  const urlTable = searchParams.get('table');
  const currentTable = urlTable || localStorage.getItem('current_table');

  useEffect(() => {
    if (!currentTable) {
      navigate('/menu');
    }
  }, [currentTable, navigate]);

  // Find all active (unpaid) orders for this table
  const activeOrders = currentTable ? orders.filter(o => o.table === currentTable && o.status !== 'Ödendi') : [];
  
  // Combined amount to pay before discount
  const originalAmountToPay = activeOrders.reduce((sum, o) => sum + (o.remainingAmount !== undefined ? o.remainingAmount : o.total), 0);

  // Calculate discount amount
  const discountAmount = appliedCoupon
    ? (appliedCoupon.discountType === 'percentage'
        ? (originalAmountToPay * appliedCoupon.discountValue) / 100
        : Math.min(appliedCoupon.discountValue, originalAmountToPay))
    : 0;

  const amountToPay = Math.max(0, originalAmountToPay - discountAmount);

  const currentPaymentAmount = splitType === 'full' 
    ? amountToPay 
    : splitType === 'equal' 
      ? amountToPay / splitCount 
      : parseFloat(customAmount) || 0;

  const tipAmount = tipSelection === 'none'
    ? 0
    : tipSelection === '10'
      ? currentPaymentAmount * 0.10
      : tipSelection === '15'
        ? currentPaymentAmount * 0.15
        : tipSelection === '20'
          ? currentPaymentAmount * 0.20
          : parseFloat(customTip) || 0;

  const applyCouponCode = () => {
    setCouponError('');
    const code = couponInput.toUpperCase().trim();
    if (!code) return;

    const coupon = coupons ? coupons.find(c => c.id.toUpperCase() === code) : null;
    if (!coupon) {
      setCouponError('Geçersiz kupon kodu.');
      setAppliedCoupon(null);
      return;
    }

    if (!coupon.isActive) {
      setCouponError('Bu kupon şu anda aktif değil.');
      setAppliedCoupon(null);
      return;
    }

    if (coupon.minOrderAmount && originalAmountToPay < coupon.minOrderAmount) {
      setCouponError(`Bu kupon için minimum sepet tutarı ₺${coupon.minOrderAmount} olmalıdır.`);
      setAppliedCoupon(null);
      return;
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate).getTime() < Date.now()) {
      setCouponError('Bu kuponun kullanım süresi dolmuştur.');
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(coupon);
    setCouponError('');
  };

  const handlePayment = async () => {
    if (!currentTable) return;
    if (currentPaymentAmount <= 0 || currentPaymentAmount > amountToPay) {
      alert("Lütfen geçerli bir tutar giriniz.");
      return;
    }

    setIsProcessing(true);
    
    try {
      await addPaymentToTableOrders(currentTable, currentPaymentAmount, paymentMethod, tipAmount);
      setIsProcessing(false);
      setIsSuccess(true);
    } catch (error) {
      console.error("Ödeme hatası:", error);
      alert("Ödeme işlemi sırasında bir hata oluştu.");
      setIsProcessing(false);
    }
  };

  const startScan = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Kamera erişimi reddedildi veya bulunamadı", err);
      alert("Kamera erişimi sağlanamadı. Lütfen tarayıcı izinlerinizi kontrol edin.");
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureAndRead = async () => {
    if (!videoRef.current) return;
    setIsProcessingImage(true);
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context not found");
      
      ctx.drawImage(videoRef.current, 0, 0);
      const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Image } },
            { text: "Extract credit card details from this image. Return a JSON object with exactly these keys: 'number' (string, format: XXXX XXXX XXXX XXXX), 'name' (string, uppercase), 'expiry' (string, format: MM/YY). If you cannot confidently read a field, return an empty string for that field." }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text);
      setCardDetails(prev => ({
        ...prev,
        number: result.number || prev.number,
        name: result.name || prev.name,
        expiry: result.expiry || prev.expiry
      }));
      
      stopCamera();
      setIsScanning(false);
    } catch (error) {
      console.error("OCR Error:", error);
      alert("Kart tam okunamadı, lütfen tekrar deneyin veya manuel girin.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const cancelScan = () => {
    stopCamera();
    setIsScanning(false);
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isScanning) {
        cancelScan();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopCamera();
    };
  }, [isScanning]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({ ...prev, [name]: value }));
  };

  if (isSuccess) {
    const isFullyPaid = (amountToPay - currentPaymentAmount <= 0);

    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center text-center px-4 relative text-[#f5f2eb]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-green-500/10 blur-3xl pointer-events-none" />
        
        <motion.div
          initial={{ scale: 0.7, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
          className="rounded-3xl bg-gradient-to-tr from-[#dcae61] to-[#ca8a04] p-6 text-slate-950 mb-8 shadow-lg shadow-amber-500/10 relative"
        >
          <CheckCircle2 className="h-16 w-16" />
          <Sparkles className="absolute -top-1.5 -right-1.5 h-6 w-6 text-white animate-pulse" />
        </motion.div>

        <h2 className="text-3xl font-black tracking-tight text-white">
          {isFullyPaid ? "Ödeme Başarıyla Alındı!" : "Kısmi Ödeme Yapıldı!"}
        </h2>
        <p className="mt-4 text-sm sm:text-base font-medium text-neutral-400 max-w-md leading-relaxed">
          {isFullyPaid 
            ? "Masa hesabınız başarıyla deaktif edilmiş ve ödenmiştir. FLUX Zone Coffee'yi tercih ettiğiniz için teşekkür ederiz. İyi akışlar, afiyet olsun!" 
            : "Ödemeniz başarıyla alındı. Masadaki diğer misafirlerin kalan tutarı ödemesi bekleniyor."}
        </p>
        
        {isFullyPaid && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 p-6 bg-[#0e0d0b]/80 backdrop-blur-md rounded-3xl border border-amber-950/15 max-w-md w-full shadow-xl"
          >
            <h3 className="text-lg font-bold text-white mb-2 flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-[#dcae61]" />
              Frekansı Paylaşın
            </h3>
            <p className="text-neutral-400 mb-5 text-xs sm:text-sm font-medium leading-relaxed">
              Kahvelerimiz ve mekan atmosferimiz hakkındaki geri bildirimleriniz çok değerli. Deneyiminizi Google Haritalar'da paylaşmak ister misiniz?
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={() => navigate('/')}
                className="button-3d-secondary rounded-full px-5 h-11 text-xs font-bold uppercase tracking-wider"
              >
                Geri Dön
              </Button>
              <Button 
                onClick={() => window.open('https://search.google.com/local/writereview?placeid=ChIJYbVq11fYuxQR4M2XuRiFapA', '_blank')}
                className="button-3d-primary rounded-full px-6 h-11 text-xs font-bold uppercase tracking-wider"
              >
                Yorum Yaz ↗
              </Button>
            </div>
          </motion.div>
        )}

        {!isFullyPaid && (
          <Button className="mt-8 button-3d-primary rounded-full px-8 h-12 text-xs uppercase font-bold tracking-widest" onClick={() => navigate('/')}>
            Ana Sayfaya Dön
          </Button>
        )}
      </div>
    );
  }

  if (activeOrders.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4 relative text-[#f5f2eb]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-amber-950/10 blur-3xl pointer-events-none" />
        <h2 className="text-2xl font-black text-white">Ödenmeyi Bekleyen Hesap Yok</h2>
        <p className="mt-2 text-neutral-400 max-w-sm font-medium text-sm leading-relaxed">Masanızın şu an ödenmeyi bekleyen aktif bir hesabı görünmüyor. Menümüzden dilediğiniz zaman sipariş oluşturabilirsiniz.</p>
        <Button className="mt-6 button-3d-primary rounded-full px-8 h-12 text-xs uppercase font-bold tracking-widest" onClick={() => navigate('/menu')}>Menüye Git</Button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-md pb-24 text-[#f5f2eb]"
    >
      <div className="mb-8 text-center">
        <span className="text-xs font-bold tracking-widest text-[#dcae61] uppercase block mb-1">KOLAY VE GÜVENLİ</span>
        <h1 className="text-3xl font-black tracking-tight text-white">Masa Ödeme</h1>
        <p className="mt-2 text-xs sm:text-sm font-medium text-neutral-400">
          Siparişlerinizi dilerseniz eşit bölün, dilerseniz serbest tutarla güvenle ödeyin.
        </p>
      </div>

      <Card className="card-3d border-none shadow-xl mb-6 overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-base sm:text-lg font-bold text-white">Hesap Dağılımı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1 mb-5 bg-[#dcae61]/5 border border-amber-950/15 p-4 rounded-2xl">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400 font-bold">Kalan Masa Hesabı:</span>
              <span className="font-bold text-neutral-300">₺{originalAmountToPay.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-emerald-400 text-xs mt-0.5">
                <span className="font-bold">Kupon İndirimi ({appliedCoupon?.id}):</span>
                <span className="font-extrabold">-₺{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-amber-950/10 pt-2 mt-1.5">
              <span className="text-neutral-300 font-bold text-sm">Ödenecek Tutar:</span>
              <span className="text-2xl font-black text-[#dcae61]">₺{amountToPay.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Split Type 1: Full Payment */}
            <div 
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${splitType === 'full' ? 'border-[#dcae61] bg-[#dcae61]/[0.05]' : 'border-amber-950/10 hover:border-amber-900/30'}`}
              onClick={() => setSplitType('full')}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Hesabın Tamamını Öde</span>
                <span className="font-black text-[#dcae61] text-lg">₺{amountToPay.toFixed(2)}</span>
              </div>
            </div>

            {/* Split Type 2: Equal Split */}
            <div 
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${splitType === 'equal' ? 'border-[#dcae61] bg-[#dcae61]/[0.05]' : 'border-amber-950/10 hover:border-amber-900/30'}`}
              onClick={() => setSplitType('equal')}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white text-sm">Eşit Bölüşerek Öde</span>
                <span className="font-black text-[#dcae61] text-lg">₺{(amountToPay / splitCount).toFixed(2)}</span>
              </div>
              {splitType === 'equal' && (
                <div className="flex items-center gap-3 mt-3 bg-neutral-900/50 p-2.5 rounded-xl border border-amber-950/10 shadow-inner">
                  <Users className="h-5 w-5 text-[#dcae61]" />
                  <input 
                    type="range" 
                    min="2" 
                    max="10" 
                    value={splitCount} 
                    onChange={(e) => setSplitCount(parseInt(e.target.value))}
                    className="flex-1 accent-[#dcae61]"
                  />
                  <span className="font-bold text-neutral-300 w-14 text-right text-xs sm:text-sm">{splitCount} Misafir</span>
                </div>
              )}
            </div>

            {/* Split Type 3: Custom Amount */}
            <div 
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${splitType === 'custom' ? 'border-[#dcae61] bg-[#dcae61]/[0.05]' : 'border-amber-950/10 hover:border-amber-900/30'}`}
              onClick={() => setSplitType('custom')}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">İstediğin Tutarı Öde</span>
                {splitType === 'custom' ? (
                  <div className="flex items-center gap-1.5 bg-neutral-900/60 px-3 py-1.5 rounded-lg border border-amber-950/15 shadow-inner">
                    <span className="text-[#dcae61] font-bold text-sm">₺</span>
                    <input 
                      type="number" 
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-20 text-right focus:outline-none font-extrabold text-[#dcae61] bg-transparent text-sm"
                    />
                  </div>
                ) : (
                  <span className="text-neutral-400 text-[10px] font-bold bg-[#dcae61]/5 px-2.5 py-1 rounded-lg border border-amber-950/10 uppercase tracking-wider">Manuel Tutar</span>
                )}
              </div>
            </div>
            
            {/* Coupon Code Section */}
            <div className="mt-5 pt-4 border-t border-amber-950/10">
              <label className="mb-1.5 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">İndirim Kuponu</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="KUPON KODU"
                  className="flex-1 rounded-xl border border-amber-950/20 px-3.5 py-2 text-xs font-bold uppercase focus:border-[#dcae61] focus:outline-none bg-neutral-900/60 text-white"
                />
                <Button 
                  type="button"
                  onClick={applyCouponCode}
                  className="h-9 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-amber-950/15 text-[10px] font-black uppercase px-4 text-[#dcae61] shadow"
                >
                  Uygula
                </Button>
              </div>
              {couponError && (
                <p className="text-red-400 text-[10px] font-bold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {couponError}
                </p>
              )}
              {appliedCoupon && (
                <div className="bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-xs rounded-xl p-3 mt-2.5 flex justify-between items-center">
                  <div>
                    <p className="font-extrabold">{appliedCoupon.id} Uygulandı!</p>
                    <p className="text-[10px] text-neutral-400 font-semibold">
                      İndirim tutarı: {appliedCoupon.discountType === 'percentage' ? `%${appliedCoupon.discountValue}` : `₺${appliedCoupon.discountValue}`}
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => { setAppliedCoupon(null); setCouponInput(''); }}
                    className="h-7 w-7 rounded-full p-0 text-neutral-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Bahşiş Sistemi Section */}
            <div className="mt-5 pt-4 border-t border-amber-950/10">
              <label className="mb-2 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#dcae61]" /> Ekibe Bahşiş Bırakın
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { id: 'none', label: 'Yok' },
                  { id: '10', label: '%10' },
                  { id: '15', label: '%15' },
                  { id: '20', label: '%20' },
                  { id: 'custom', label: 'Özel' }
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setTipSelection(option.id as any);
                      if (option.id !== 'custom') {
                        setCustomTip('');
                      }
                    }}
                    className={`h-9 rounded-xl border text-[11px] font-bold transition-all ${
                      tipSelection === option.id
                        ? 'bg-[#dcae61] text-neutral-950 border-[#dcae61] shadow-lg shadow-amber-500/10'
                        : 'bg-neutral-900/60 text-neutral-300 border-amber-950/20 hover:border-amber-900/30'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {tipSelection === 'custom' && (
                <div className="mt-3 flex items-center gap-2 bg-neutral-950/50 px-3.5 h-11 rounded-xl border border-amber-950/20 shadow-inner">
                  <span className="text-[#dcae61] font-bold text-xs">₺</span>
                  <input
                    type="number"
                    value={customTip}
                    onChange={(e) => setCustomTip(e.target.value)}
                    placeholder="Bahşiş tutarı girin"
                    className="flex-1 bg-transparent border-none focus:outline-none text-xs font-bold text-[#dcae61]"
                  />
                </div>
              )}

              {tipAmount > 0 && (
                <div className="mt-3 flex justify-between items-center bg-amber-500/5 border border-amber-500/10 rounded-xl p-2.5 text-xs">
                  <span className="text-neutral-400 font-semibold">Hesaplanmış Bahşiş:</span>
                  <span className="font-bold text-[#dcae61]">+₺{tipAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-3d border-none shadow-xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg font-bold text-white">Ödeme Kanalları</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-col gap-2">
            {/* Card Payment Method */}
            <div
              className={`flex cursor-pointer items-center rounded-2xl border-2 p-4 transition-all ${
                paymentMethod === 'Kart'
                  ? 'border-[#dcae61] bg-[#dcae61]/[0.05]'
                  : 'border-amber-950/10 hover:border-amber-900/30'
              }`}
              onClick={() => setPaymentMethod('Kart')}
            >
              <div className={`mr-4 rounded-xl p-2.5 ${paymentMethod === 'Kart' ? 'bg-[#dcae61] text-slate-950 shadow-md' : 'bg-neutral-900 text-neutral-400'}`}>
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white text-sm">Sanal POS ile Güvenli Ödeme</h4>
                <p className="text-xs text-neutral-400 font-medium">3D Secure ile anında saniyeler içinde tamamlayın</p>
              </div>
              {paymentMethod === 'Kart' && (
                <CheckCircle2 className="h-5 w-5 text-[#dcae61]" />
              )}
            </div>

            {/* Credit Card Input Form */}
            <AnimatePresence>
              {paymentMethod === 'Kart' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 rounded-2xl border border-amber-950/15 bg-neutral-900/40 p-4">
                    {/* Beautiful Coffee Vibe Credit Card Mockup */}
                    <div className="relative w-full h-44 rounded-2xl bg-gradient-to-tr from-[#0e0d0b] via-[#241f19] to-[#12110e] text-[#f5f2eb] p-5 shadow-2xl overflow-hidden border border-amber-950/40 mb-4 group transition-all duration-500 hover:shadow-2xl">
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(220,174,97,0.01)_1px,transparent_1px)] bg-[size:8px_8px] opacity-20" />
                      <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-[#dcae61]/10 blur-2xl" />
                      <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-amber-950/20 blur-2xl" />
                      
                      <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black tracking-widest text-[#dcae61]">FLUX ZONE COFFEE</span>
                            {/* Chip Graphic in Gold */}
                            <div className="mt-1.5 w-8 h-6 rounded-md bg-gradient-to-r from-amber-200 to-amber-400 border border-amber-500 shadow-inner flex items-center justify-center">
                              <div className="grid grid-cols-3 gap-0.5 w-full h-full p-1 opacity-30">
                                <div className="border-r border-b border-amber-700/40" />
                                <div className="border-r border-b border-amber-700/40" />
                                <div className="border-b border-amber-700/40" />
                                <div className="border-r border-amber-700/40" />
                                <div className="border-r border-amber-700/40" />
                              </div>
                            </div>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-[#dcae61] bg-[#dcae61]/10 px-2.5 py-0.5 rounded border border-[#dcae61]/25 backdrop-blur-sm">Sanal POS</span>
                        </div>
                        
                        <div>
                          <div className="text-base sm:text-lg font-mono tracking-widest font-extrabold mb-1 drop-shadow-md">
                            {cardDetails.number || '•••• •••• •••• ••••'}
                          </div>
                          <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                              <span className="text-[7px] text-neutral-500 font-bold tracking-wider">KART SAHİBİ</span>
                              <span className="text-xs font-bold tracking-wide uppercase truncate max-w-[150px] text-white">
                                {cardDetails.name || 'AD SOYAD'}
                              </span>
                            </div>
                            <div className="flex gap-3">
                              <div className="flex flex-col items-end">
                                <span className="text-[7px] text-neutral-500 font-bold tracking-wider">SKT</span>
                                <span className="text-[11px] font-bold text-white">
                                  {cardDetails.expiry || 'MM/YY'}
                                </span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-[7px] text-neutral-500 font-bold tracking-wider">CVV</span>
                                <span className="text-[11px] font-bold text-white">
                                  {cardDetails.cvv || '•••'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 flex items-center justify-between">
                      <h5 className="font-bold text-white text-xs">Kart Bilgileri</h5>
                      <Button onClick={startScan} className="h-8 text-[10px] button-3d-secondary px-3.5 uppercase tracking-wider font-bold">
                        <Camera className="mr-1.5 h-3.5 w-3.5 text-[#dcae61] animate-pulse" />
                        Kamerayla Tara
                      </Button>
                    </div>

                    <div className="grid gap-3 text-left">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Kart Numarası</label>
                        <input 
                          type="text" 
                          name="number"
                          value={cardDetails.number}
                          onChange={handleInputChange}
                          placeholder="0000 0000 0000 0000" 
                          className="w-full rounded-xl border border-amber-950/20 px-3.5 py-2 text-sm font-semibold focus:border-[#dcae61] focus:outline-none focus:ring-1 focus:ring-[#dcae61] bg-neutral-900/60 text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Kart Üzerindeki İsim</label>
                        <input 
                          type="text" 
                          name="name"
                          value={cardDetails.name}
                          onChange={handleInputChange}
                          placeholder="Ad Soyad" 
                          className="w-full rounded-xl border border-amber-950/20 px-3.5 py-2 text-sm font-semibold focus:border-[#dcae61] focus:outline-none focus:ring-1 focus:ring-[#dcae61] bg-neutral-900/60 text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Son Kullanma (AA/YY)</label>
                          <input 
                            type="text" 
                            name="expiry"
                            value={cardDetails.expiry}
                            onChange={handleInputChange}
                            placeholder="AA/YY" 
                            className="w-full rounded-xl border border-amber-950/20 px-3.5 py-2 text-sm font-semibold focus:border-[#dcae61] focus:outline-none focus:ring-1 focus:ring-[#dcae61] bg-neutral-900/60 text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">CVV</label>
                          <input 
                            type="text" 
                            name="cvv"
                            value={cardDetails.cvv}
                            onChange={handleInputChange}
                            placeholder="123" 
                            maxLength={4}
                            className="w-full rounded-xl border border-amber-950/20 px-3.5 py-2 text-sm font-semibold focus:border-[#dcae61] focus:outline-none focus:ring-1 focus:ring-[#dcae61] bg-neutral-900/60 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* POS Terminal Method */}
          <div
            className={`flex cursor-pointer items-center rounded-2xl border-2 p-4 transition-all ${
              paymentMethod === 'POS'
                ? 'border-[#dcae61] bg-[#dcae61]/[0.05]'
                : 'border-amber-950/10 hover:border-amber-900/30'
              }`}
            onClick={() => setPaymentMethod('POS')}
          >
            <div className={`mr-4 rounded-xl p-2.5 ${paymentMethod === 'POS' ? 'bg-[#dcae61] text-slate-950' : 'bg-neutral-900 text-neutral-400'}`}>
              <Calculator className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-white text-sm">Masaya Fiziksel POS</h4>
              <p className="text-xs text-neutral-400 font-medium">Baristamız kablosuz POS terminalini masanıza getirsin</p>
            </div>
            {paymentMethod === 'POS' && (
              <CheckCircle2 className="h-5 w-5 text-[#dcae61]" />
            )}
          </div>

          {/* Cash Payment Method */}
          <div
            className={`flex cursor-pointer items-center rounded-2xl border-2 p-4 transition-all ${
              paymentMethod === 'Nakit'
                ? 'border-[#dcae61] bg-[#dcae61]/[0.05]'
                : 'border-amber-950/10 hover:border-amber-900/30'
              }`}
            onClick={() => setPaymentMethod('Nakit')}
          >
            <div className={`mr-4 rounded-xl p-2.5 ${paymentMethod === 'Nakit' ? 'bg-[#dcae61] text-slate-950' : 'bg-neutral-900 text-neutral-400'}`}>
              <Wallet className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-white text-sm">Nakit Ödeme</h4>
              <p className="text-xs text-neutral-400 font-medium">Nakit ödemeyi masada doğrudan garsona yapın</p>
            </div>
            {paymentMethod === 'Nakit' && (
              <CheckCircle2 className="h-5 w-5 text-[#dcae61]" />
            )}
          </div>
        </CardContent>

        {/* Secure SSL Shield */}
        <div className="p-4 mx-6 mb-2 bg-[#dcae61]/5 rounded-2xl border border-amber-950/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#dcae61]" />
            <span className="text-[10px] sm:text-[11px] font-bold text-neutral-300">3D Secure & 256-Bit SSL Koruma</span>
          </div>
          <span className="text-[9px] font-black text-[#dcae61] tracking-wider">SECURE</span>
        </div>

        <CardFooter className="pt-4 pb-6">
          <Button 
            onClick={handlePayment}
            disabled={isProcessing || currentPaymentAmount <= 0 || currentPaymentAmount > amountToPay}
            className="w-full button-3d-primary rounded-full h-14 text-xs sm:text-sm uppercase font-bold tracking-widest"
          >
            {isProcessing 
              ? 'Ödeme İşleniyor...' 
              : `₺${(currentPaymentAmount + tipAmount).toFixed(2)} ${
                  paymentMethod === 'Kart' 
                    ? 'Sanal POS ile Öde' 
                    : paymentMethod === 'POS' 
                      ? 'Fiziksel POS Talep Et' 
                      : 'Garson Çağır ve Öde'
                }`}
          </Button>
        </CardFooter>
      </Card>

      {/* Credit Card Camera Scanner Modal */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 p-4 backdrop-blur-md"
          >
            <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-[#0e0d0b] border border-amber-950/30 shadow-2xl">
              <div className="absolute right-4 top-4 z-10">
                <Button variant="ghost" size="icon" onClick={cancelScan} className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="relative aspect-[4/3] w-full bg-black">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="h-full w-full object-cover"
                />
                
                {/* Scanner overlay alignment grid */}
                <div className="absolute inset-0 border-[35px] border-black/60">
                  <div className="relative h-full w-full border-2 border-[#dcae61] rounded-2xl">
                    <motion.div 
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-0.5 bg-[#dcae61] shadow-[0_0_8px_2px_rgba(220,174,97,0.5)]"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-6 text-center text-[#f5f2eb]">
                <ScanLine className="mx-auto mb-3 h-8 w-8 text-[#dcae61]" />
                <h3 className="mb-1.5 text-base sm:text-lg font-bold">Kartınızı Hizalayın</h3>
                <p className="text-xs text-neutral-400 mb-6 leading-relaxed font-medium">
                  Kamerayı kartınızın üzerine tutun ve okutmak için aşağıdaki butona basın.
                </p>
                
                <Button
                  onClick={captureAndRead}
                  disabled={isProcessingImage}
                  className="w-full button-3d-primary rounded-full h-12 text-xs uppercase font-bold tracking-widest"
                >
                  {isProcessingImage ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Yapay Zeka ile Kart Okunuyor...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Camera className="mr-2 h-5 w-5" />
                      Fotoğraf Çek ve Doldur
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
