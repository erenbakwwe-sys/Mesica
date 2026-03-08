import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle2, CreditCard, Wallet, Camera, X, ScanLine } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';

export function Payment() {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
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

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 1500);
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
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Ödeme Başarılı!</h2>
        <p className="mt-4 text-lg text-slate-600">Demo ödeme başarıyla tamamlandı. Bizi tercih ettiğiniz için teşekkür ederiz.</p>
        <Button className="mt-8 rounded-full" onClick={() => navigate('/')}>
          Ana Sayfaya Dön
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
      className="mx-auto max-w-md"
    >
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Ödeme</h1>
        <p className="mt-2 text-slate-500">Lütfen ödeme yönteminizi seçin.</p>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Ödeme Yöntemi</CardTitle>
          <CardDescription>Demo ortamında gerçek ödeme alınmamaktadır.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-col gap-2">
            <div
              className={`flex cursor-pointer items-center rounded-xl border-2 p-4 transition-all ${
                paymentMethod === 'card'
                  ? 'border-orange-600 bg-orange-50'
                  : 'border-slate-100 hover:border-orange-200'
              }`}
              onClick={() => setPaymentMethod('card')}
            >
              <div className={`mr-4 rounded-full p-2 ${paymentMethod === 'card' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900">Kart ile Ödeme</h4>
                <p className="text-sm text-slate-500">Kredi veya banka kartı</p>
              </div>
              {paymentMethod === 'card' && (
                <CheckCircle2 className="h-5 w-5 text-orange-600" />
              )}
            </div>

            <AnimatePresence>
              {paymentMethod === 'card' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h5 className="font-medium text-slate-900">Kart Bilgileri</h5>
                      <Button variant="outline" size="sm" onClick={startScan} className="h-8 text-xs text-orange-600 border-orange-200 hover:bg-orange-100 bg-white">
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
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
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
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
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
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
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
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
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
              paymentMethod === 'cash'
                ? 'border-orange-600 bg-orange-50'
                : 'border-slate-100 hover:border-orange-200'
            }`}
            onClick={() => setPaymentMethod('cash')}
          >
            <div className={`mr-4 rounded-full p-2 ${paymentMethod === 'cash' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
              <Wallet className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900">Masada Ödeme</h4>
              <p className="text-sm text-slate-500">Nakit veya pos cihazı ile</p>
            </div>
            {paymentMethod === 'cash' && (
              <CheckCircle2 className="h-5 w-5 text-orange-600" />
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-4">
          <Button 
            className="w-full rounded-full h-12 text-base" 
            onClick={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? 'İşleniyor...' : 'Ödemeyi Tamamla'}
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
                  <div className="relative h-full w-full border-2 border-orange-500 rounded-lg">
                    <motion.div 
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-0.5 bg-orange-500 shadow-[0_0_8px_2px_rgba(249,115,22,0.5)]"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-6 text-center text-white">
                <ScanLine className="mx-auto mb-3 h-8 w-8 text-orange-500" />
                <h3 className="mb-2 text-lg font-semibold">Kartınızı Okutun</h3>
                <p className="text-sm text-slate-400 mb-6">
                  Kamerayı kartınızın üzerine tutun ve okutmak için aşağıdaki butona basın.
                </p>
                
                <Button
                  onClick={captureAndRead}
                  disabled={isProcessingImage}
                  className="w-full rounded-full bg-orange-600 hover:bg-orange-700 text-white h-12"
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
