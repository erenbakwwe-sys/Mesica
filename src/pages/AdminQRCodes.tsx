import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Printer, QrCode } from 'lucide-react';
import { motion } from 'motion/react';

export function AdminQRCodes() {
  const [tableCount, setTableCount] = useState<number>(() => {
    const saved = localStorage.getItem('qr_table_count');
    return saved ? parseInt(saved, 10) : 50;
  });
  const [generated, setGenerated] = useState<boolean>(() => {
    return localStorage.getItem('qr_generated') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('qr_table_count', tableCount.toString());
  }, [tableCount]);

  useEffect(() => {
    localStorage.setItem('qr_generated', generated.toString());
  }, [generated]);

  const handleGenerate = () => {
    if (tableCount > 0 && tableCount <= 100) {
      setGenerated(true);
    } else {
      alert("Lütfen 1 ile 100 arasında bir masa sayısı girin.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const baseUrl = 'https://izmirdenizrestaurant.vercel.app';

  return (
    <div className="space-y-6 text-[#f5f2eb]">
      <div className="print:hidden">
        <h2 className="text-2xl font-black tracking-tight text-white font-sans">QR Kod Oluşturucu</h2>
        <p className="text-neutral-400 font-medium text-xs sm:text-sm">Masalarınız için kalıcı QR kodlar oluşturun ve yazdırın.</p>
      </div>

      <Card className="card-3d border-none shadow-xl print:hidden">
        <CardHeader className="p-6">
          <CardTitle className="text-lg font-bold text-white">Masa Sayısı</CardTitle>
          <CardDescription className="text-neutral-400 font-medium text-xs">Kaç adet masa için QR kod üretmek istiyorsunuz?</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 p-6 pt-0">
          <div className="space-y-2 flex-1 max-w-xs">
            <Label htmlFor="tableCount" className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Masa Adedi</Label>
            <Input 
              id="tableCount" 
              type="number" 
              min="1" 
              max="100" 
              className="h-11 bg-neutral-950/50 border-amber-950/20 text-white rounded-xl focus:border-[#dcae61] focus:ring-1 focus:ring-[#dcae61]"
              value={tableCount} 
              onChange={(e) => setTableCount(parseInt(e.target.value) || 0)} 
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleGenerate} className="button-3d-primary rounded-full h-11 text-xs uppercase font-bold tracking-widest px-6 flex-1 sm:flex-none">
              <QrCode className="mr-1.5 h-4 w-4" />
              Üret / Güncelle
            </Button>
            {generated && (
              <Button onClick={handlePrint} className="button-3d-secondary rounded-full h-11 text-xs uppercase font-bold tracking-wider px-6">
                <Printer className="mr-1.5 h-4 w-4" />
                Yazdır
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {generated && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 print:grid-cols-3 print:gap-8">
          {Array.from({ length: tableCount }).map((_, i) => {
            const tableName = `Masa ${i + 1}`;
            const qrUrl = `${baseUrl}/?table=${encodeURIComponent(tableName)}`;
            
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: (i % 10) * 0.05 }}
                className="flex flex-col items-center justify-center p-5 card-3d border-none hover:border-[#dcae61]/30 transition-all duration-300 shadow-xl print:bg-white print:text-black print:border-2 print:border-black print:shadow-none"
              >
                <h3 className="text-base font-black text-[#dcae61] mb-4 print:text-black print:font-bold">{tableName}</h3>
                
                {/* White frame around QR for scannability on dark mode screen */}
                <div className="p-3 bg-white rounded-xl shadow-inner flex items-center justify-center border border-amber-950/5 print:p-0 print:border-none print:shadow-none">
                  <QRCodeSVG 
                    value={qrUrl} 
                    size={120}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                
                <p className="text-[10px] text-neutral-400 font-semibold mt-4 text-center break-all print:hidden max-w-full truncate hover:text-[#dcae61] transition-colors cursor-pointer" title={qrUrl}>
                  {qrUrl}
                </p>
                <p className="text-xs font-bold text-neutral-900 mt-2 hidden print:block">
                  Sipariş için okutun
                </p>
              </motion.div>
            );
          })}
        </div>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .print\\:gap-8 {
            gap: 2rem;
          }
          .print\\:border-black {
            border-color: black;
          }
          .print\\:shadow-none {
            box-shadow: none;
          }
          .print\\:block {
            display: block !important;
          }
          .grid {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .grid * {
            visibility: visible;
          }
        }
      `}</style>
    </div>
  );
}
