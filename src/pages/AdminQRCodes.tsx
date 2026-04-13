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
    <div className="space-y-6">
      <div className="print:hidden">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">QR Kod Oluşturucu</h2>
        <p className="text-slate-500">Masalarınız için kalıcı QR kodlar oluşturun ve yazdırın.</p>
      </div>

      <Card className="border-none shadow-md print:hidden">
        <CardHeader>
          <CardTitle>Masa Sayısı</CardTitle>
          <CardDescription>Kaç adet masa için QR kod üretmek istiyorsunuz?</CardDescription>
        </CardHeader>
        <CardContent className="flex items-end gap-4">
          <div className="space-y-2 flex-1 max-w-xs">
            <Label htmlFor="tableCount">Masa Adedi</Label>
            <Input 
              id="tableCount" 
              type="number" 
              min="1" 
              max="100" 
              value={tableCount} 
              onChange={(e) => setTableCount(parseInt(e.target.value) || 0)} 
            />
          </div>
          <Button onClick={handleGenerate} className="bg-blue-600 hover:bg-blue-700">
            <QrCode className="mr-2 h-4 w-4" />
            Üret / Güncelle
          </Button>
          {generated && (
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Yazdır
            </Button>
          )}
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
                className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm print:border-2 print:border-black print:shadow-none"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-4">{tableName}</h3>
                <QRCodeSVG 
                  value={qrUrl} 
                  size={120}
                  level="M"
                  includeMargin={false}
                />
                <p className="text-xs text-slate-500 mt-4 text-center break-all print:hidden">
                  {qrUrl}
                </p>
                <p className="text-xs font-medium text-slate-900 mt-2 hidden print:block">
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
