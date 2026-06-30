import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle2, CreditCard, Wallet, Camera, X, ScanLine, Calculator, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { useCart, PaymentMethod } from '../context/CartContext';

export function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders, addPaymentToTableOrders } = useCart();
  
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
  
  // Combined amount to pay
  const amountToPay = activeOrders.reduce((sum, o) => sum + (o.remainingAmount !== undefined ? o.remainingAmount : o.total), 0);

  const currentPaymentAmount = splitType === 'full' 
    ? amountToPay 
    : splitType === 'equal' 
      ? amountToPay / splitCount 
      : parseFloat(customAmount) || 0;

  const handlePayment = async () => {
    if (!currentTable) return;
    if (currentPaymentAmount <= 0 || currentPaymentAmount > amountToPay) {
      alert("Lütfen geçerli bir tutar giriniz.");
      return;
    }

    setIsProcessing(true);
    
    try {
      await addPaymentToTableOrders(currentTable, currentPaymentAmount, paymentMethod);
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
        model: "gemini-3-flash-preview",
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
    return () => {
      stopCamera();
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({ ...prev, [name]: value }));
  };

  if (isSuccess) {
    const isFullyPaid = (amountToPay - currentPaymentAmount <= 0);

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="rounded-full bg-green-100 p-6 text-green-600 mb-6"
        >
          <CheckCircle2 className="h-16 w-16" />
        </motion.div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          {isFullyPaid ? "Ödeme Tamamlandı!" : "Kısmi Ödeme Alındı!"}
        </h2>
        <p className="mt-4 text-lg text-slate-600 max-w-md">
          {isFullyPaid 
            ? "Masa hesabınız başarıyla ödenmiştir. İzmir Deniz Restaurant'ı tercih ettiğiniz için teşekkür ederiz. Afiyet olsun!" 
            : "Ödemeniz başarıyla alındı. Masadaki diğer kişilerin kalan tutarı ödemesi bekleniyor."}
        </p>
        
        {isFullyPaid && (
          <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100 max-w-md w-full">
            <h3 className="text-xl font-semibold text-blue-900 mb-2">Deneyiminizi Bizimle Paylaşın</h3>
            <p className="text-blue-700 mb-4 text-sm leading-relaxed">
              Bizim için her geri bildirim çok değerli. Deneyiminizi Google Haritalar'da paylaşmak ister misiniz?
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline" 
                className="border-blue-200 text-blue-700 hover:bg-blue-100 bg-white"
                onClick={() => navigate('/')}
              >
                Hayır, Teşekkürler
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                onClick={() => window.open('https://search.google.com/local/writereview?placeid=ChIJYbVq11fYuxQR4M2XuRiFapA', '_blank')}
              >
                Evet, Yorum Yap
              </Button>
            </div>
          </div>
        )}

        {!isFullyPaid && (
          <Button className="mt-8 rounded-full" onClick={() => navigate('/')}>
            Ana Sayfaya Dön
          </Button>
        )}
      </div>
    );
  }

  if (activeOrders.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold text-slate-900">Ödenmeyi Bekleyen Hesap Yok</h2>
        <p className="mt-2 text-slate-500 max-w-sm">Masanızın şu an ödenmeyi bekleyen bir hesabı görünmüyor. Sipariş verdikten sonra dilediğiniz an bu ekrandan ödeme yapabilirsiniz.</p>
        <Button className="mt-6 rounded-full" onClick={() => navigate('/menu')}>Menüye Dön</Button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-md pb-24"
    >
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Ödeme</h1>
        <p className="mt-2 text-slate-500">
          Masanızın hesabı için ödeme tutarınızı belirleyin ve yöntemi seçin.
        </p>
      </div>

      <Card className="border-none shadow-md mb-6">
        <CardHeader className="pb-4">
          <CardTitle>Ödenecek Tutar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-600 font-medium">Toplam Kalan Hesap:</span>
            <span className="text-2xl font-bold text-blue-600">₺{amountToPay.toFixed(2)}</span>
          </div>

          <div className="space-y-3">
            <div 
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${splitType === 'full' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-blue-200'}`}
              onClick={() => setSplitType('full')}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">Tamamını Öde</span>
                <span className="font-bold text-blue-600 text-lg">₺{amountToPay.toFixed(2)}</span>
              </div>
            </div>

            <div 
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${splitType === 'equal' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-blue-200'}`}
              onClick={() => setSplitType('equal')}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-900">Kişi Başı Eşit Öde</span>
                <span className="font-bold text-blue-600 text-lg">₺{(amountToPay / splitCount).toFixed(2)}</span>
              </div>
              {splitType === 'equal' && (
                <div className="flex items-center gap-3 mt-3 bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                  <Users className="h-5 w-5 text-slate-400" />
                  <input 
                    type="range" 
                    min="2" 
                    max="10" 
                    value={splitCount} 
                    onChange={(e) => setSplitCount(parseInt(e.target.value))}
                    className="flex-1 accent-blue-600"
                  />
                  <span className="font-semibold text-slate-700 w-14 text-right">{splitCount} Kişi</span>
                </div>
              )}
            </div>

            <div 
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${splitType === 'custom' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-blue-200'}`}
              onClick={() => setSplitType('custom')}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">Özel Tutar Öde</span>
                {splitType === 'custom' ? (
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-slate-500 font-bold">₺</span>
                    <input 
                      type="number" 
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-20 text-right focus:outline-none font-bold text-blue-600 bg-transparent"
                    />
                  </div>
                ) : (
                  <span className="text-slate-400 text-sm">Miktar Girin</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Ödeme Yöntemi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-col gap-2">
            <div
              className={`flex cursor-pointer items-center rounded-xl border-2 p-4 transition-all ${
                paymentMethod === 'Kart'
                  ? 'border-blue-600 bg-blue-50/50'
                  : 'border-slate-100 hover:border-blue-200'
              }`}
              onClick={() => setPaymentMethod('Kart')}
            >
              <div className={`mr-4 rounded-full p-2 ${paymentMethod === 'Kart' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900">Sanal POS (Online Kart)</h4>
                <p className="text-xs text-slate-500">Güvenli 3D Secure ile online ödeyin</p>
              </div>
              {paymentMethod === 'Kart' && (
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              )}
            </div>

            <AnimatePresence>
              {paymentMethod === 'Kart' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h5 className="font-semibold text-slate-900 text-sm">Kart Bilgileri</h5>
                      <Button variant="outline" size="sm" onClick={startScan} className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-100 bg-white">
                        <Camera className="mr-2 h-3.5 w-3.5" />
                        Kartı Tara
                      </Button>
                    </div>
                    <div className="grid gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Kart Numarası</label>
                        <input 
                          type="text" 
                          name="number"
                          value={cardDetails.number}
                          onChange={handleInputChange}
                          placeholder="0000 0000 0000 0000" 
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Kart Üzerindeki İsim</label>
                        <input 
                          type="text" 
                          name="name"
                          value={cardDetails.name}
                          onChange={handleInputChange}
                          placeholder="Ad Soyad" 
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-500">Son Kullanma (AA/YY)</label>
                          <input 
                            type="text" 
                            name="expiry"
                            value={cardDetails.expiry}
                            onChange={handleInputChange}
                            placeholder="AA/YY" 
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-500">CVV</label>
                          <input 
                            type="text" 
                            name="cvv"
                            value={cardDetails.cvv}
                            onChange={handleInputChange}
                            placeholder="123" 
                            maxLength={4}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div
            className={`flex cursor-pointer items-center rounded-xl border-2 p-4 transition-all ${
              paymentMethod === 'POS'
                ? 'border-blue-600 bg-blue-50/50'
                : 'border-slate-100 hover:border-blue-200'
            }`}
            onClick={() => setPaymentMethod('POS')}
          >
            <div className={`mr-4 rounded-full p-2 ${paymentMethod === 'POS' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
              <Calculator className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900">Masa Başında POS</h4>
              <p className="text-xs text-slate-500">Garson kredi kartı için POS cihazı getirsin</p>
            </div>
            {paymentMethod === 'POS' && (
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            )}
          </div>

          <div
            className={`flex cursor-pointer items-center rounded-xl border-2 p-4 transition-all ${
              paymentMethod === 'Nakit'
                ? 'border-blue-600 bg-blue-50/50'
                : 'border-slate-100 hover:border-blue-200'
            }`}
            onClick={() => setPaymentMethod('Nakit')}
          >
            <div className={`mr-4 rounded-full p-2 ${paymentMethod === 'Nakit' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
              <Wallet className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900">Masada Nakit</h4>
              <p className="text-xs text-slate-500">Ödemeyi nakit olarak garsona yapın</p>
            </div>
            {paymentMethod === 'Nakit' && (
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-4 pb-6">
          <Button 
            className="w-full rounded-full h-14 text-base bg-blue-600 hover:bg-blue-700 text-white font-semibold" 
            onClick={handlePayment}
            disabled={isProcessing || currentPaymentAmount <= 0 || currentPaymentAmount > amountToPay}
          >
            {isProcessing ? 'İşleniyor...' : `₺${currentPaymentAmount.toFixed(2)} Öde`}
          </Button>
        </CardFooter>
      </Card>

      {/* Scanner Overlay Modal */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          >
            <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-slate-900 shadow-2xl">
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
                
                {/* Scanner Overlay */}
                <div className="absolute inset-0 border-[40px] border-black/50">
                  <div className="relative h-full w-full border-2 border-blue-500 rounded-lg">
                    <motion.div 
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_8px_2px_rgba(59,130,246,0.5)]"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-6 text-center text-white">
                <ScanLine className="mx-auto mb-3 h-8 w-8 text-blue-500" />
                <h3 className="mb-2 text-lg font-semibold">Kartınızı Okutun</h3>
                <p className="text-sm text-slate-400 mb-6">
                  Kamerayı kartınızın üzerine tutun ve okutmak için aşağıdaki butona basın.
                </p>
                
                <Button
                  onClick={captureAndRead}
                  disabled={isProcessingImage}
                  className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white h-12"
                >
                  {isProcessingImage ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Kart Okunuyor...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Camera className="mr-2 h-5 w-5" />
                      Fotoğraf Çek ve Oku
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
