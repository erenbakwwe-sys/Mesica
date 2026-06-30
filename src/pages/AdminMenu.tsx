import { useState, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, Image as ImageIcon, Loader2, Wand2, Sparkles, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleGenAI, Type } from '@google/genai';
import { toast } from 'sonner';

const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => resolve(base64Str);
  });
};

export function AdminMenu() {
  const { menuItems, addMenuItem, removeMenuItem } = useCart();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<'upload' | 'generate'>('upload');
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [imageSize, setImageSize] = useState('1K');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Ana Yemek',
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const compressed = await compressImage(base64String);
      setPreviewImage(compressed);
      await analyzeImage(compressed.split(',')[1], 'image/jpeg');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateImage = async () => {
    if (!generatePrompt) {
      toast.error('Lütfen ne resmi üretmek istediğinizi yazın.');
      return;
    }

    setIsGenerating(true);
    try {
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await aistudio.openSelectKey();
        }
      }

      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API key is not set');
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: generatePrompt,
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: imageSize as "1K" | "2K" | "4K"
          }
        }
      });

      let base64Image = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (base64Image) {
        const compressed = await compressImage(base64Image);
        setPreviewImage(compressed);
        toast.success('Görsel başarıyla üretildi!');
        // Optionally analyze the generated image to fill the form
        await analyzeImage(compressed.split(',')[1], 'image/jpeg');
      } else {
        toast.error('Görsel üretilemedi.');
      }
    } catch (error: any) {
      console.error('Image generation error:', error);
      if (error.message?.includes('Requested entity was not found')) {
         toast.error('API anahtarı geçersiz. Lütfen tekrar seçin.');
         const aistudio = (window as any).aistudio;
         if (aistudio) await aistudio.openSelectKey();
      } else {
         toast.error('Görsel üretilirken bir hata oluştu.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeImage = async (base64Data: string, mimeType: string) => {
    setIsAnalyzing(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set');
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: 'Bu yemek resmini analiz et. Bana şu bilgileri JSON formatında ver: "name" (yemeğin adı, kısa ve çekici), "description" (iştah açıcı Türkçe açıklama), "price" (150 ile 600 arasında mantıklı bir TL fiyatı, sadece sayı), "category" (Tacos, Burritos, Nachos, İçecekler, Ana Yemek, Başlangıç veya Tatlı kategorilerinden en uygun olanı).',
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              price: { type: Type.NUMBER },
              category: { type: Type.STRING },
            },
            required: ['name', 'description', 'price', 'category'],
          },
        },
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        setNewItem({
          name: data.name || '',
          description: data.description || '',
          price: data.price ? data.price.toString() : '',
          category: data.category || 'Ana Yemek',
        });
        toast.success('Yapay zeka resmi başarıyla analiz etti!');
      }
    } catch (error) {
      console.error('AI Analysis Error:', error);
      toast.error('Resim analiz edilirken bir hata oluştu.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!newItem.name || !newItem.price || !previewImage) {
      toast.error('Lütfen tüm alanları doldurun ve bir resim yükleyin.');
      return;
    }

    addMenuItem({
      id: Math.random().toString(36).substring(2, 9),
      name: newItem.name,
      description: newItem.description,
      price: parseFloat(newItem.price),
      category: newItem.category,
      image: previewImage,
    });

    // Reset form
    setNewItem({ name: '', description: '', price: '', category: 'Ana Yemek' });
    setPreviewImage(null);
    setGeneratePrompt('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="grid gap-8 md:grid-cols-3 text-[#f5f2eb]">
      <div className="md:col-span-1">
        <Card className="card-3d border-none bg-neutral-900/40 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-amber-950/10 bg-neutral-900/20">
            <CardTitle className="flex items-center gap-2 text-white font-sans text-lg font-black">
              <Wand2 className="h-5 w-5 text-[#dcae61]" />
              Yapay Zeka ile Ürün Ekle
            </CardTitle>
            <CardDescription className="text-neutral-400 font-medium text-xs mt-1">
              Bir yemek veya içecek fotoğrafı yükleyin ya da yapay zeka ile görsel üreterek ürün detaylarını otomatik oluşturun.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            
            <div className="flex gap-2">
              <Button 
                variant="ghost"
                onClick={() => setImageSource('upload')}
                className={`flex-1 rounded-xl text-xs font-bold uppercase tracking-wider h-9 ${
                  imageSource === 'upload'
                    ? 'bg-[#dcae61] text-stone-950 font-black shadow-md'
                    : 'border border-amber-950/20 text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
                size="sm"
              >
                <ImageIcon className="mr-1.5 h-4 w-4" />
                Görsel Yükle
              </Button>
              <Button 
                variant="ghost"
                onClick={() => setImageSource('generate')}
                className={`flex-1 rounded-xl text-xs font-bold uppercase tracking-wider h-9 ${
                  imageSource === 'generate'
                    ? 'bg-[#dcae61] text-stone-950 font-black shadow-md'
                    : 'border border-amber-950/20 text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
                size="sm"
              >
                <Sparkles className="mr-1.5 h-4 w-4" />
                Görsel Üret
              </Button>
            </div>

            {imageSource === 'upload' ? (
              <div 
                className="border-2 border-dashed border-amber-950/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#dcae61]/30 hover:bg-neutral-950/10 transition-all relative overflow-hidden h-48 bg-neutral-950/20"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                ) : null}
                
                <div className="relative z-10 flex flex-col items-center">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-10 w-10 text-[#dcae61] animate-spin mb-2.5" />
                      <p className="text-sm font-bold text-white">Yapay Zeka Analiz Ediyor...</p>
                    </>
                  ) : (
                    <>
                      <div className="bg-amber-950/20 p-3 rounded-full mb-3 border border-[#dcae61]/10">
                        <ImageIcon className="h-6 w-6 text-[#dcae61]" />
                      </div>
                      <p className="text-sm font-bold text-white">Resim Yükle veya Sürükle</p>
                      <p className="text-xs text-neutral-500 mt-1 uppercase font-semibold tracking-wider">PNG, JPG, WEBP</p>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isAnalyzing || isGenerating}
                />
              </div>
            ) : (
              <div className="space-y-4 border border-amber-950/15 bg-neutral-950/30 rounded-2xl p-4">
                {previewImage && (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3 border border-amber-950/10">
                    <img src={previewImage} alt="Generated" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-neutral-300">Ne resmi üretmek istersiniz?</Label>
                  <Input 
                    value={generatePrompt} 
                    onChange={e => setGeneratePrompt(e.target.value)} 
                    placeholder="Örn: Kremalı latte kahve, stüdyo çekimi" 
                    className="h-10 text-sm bg-neutral-950/50 border border-amber-950/25 text-white focus:border-[#dcae61] focus:ring-[#dcae61] rounded-xl placeholder-neutral-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-neutral-300">Çözünürlük</Label>
                  <select 
                    className="flex h-10 w-full rounded-xl border border-amber-950/25 bg-neutral-950/50 text-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#dcae61]"
                    value={imageSize} 
                    onChange={e => setImageSize(e.target.value)}
                  >
                    <option value="1K" className="bg-stone-900">1K (Standart)</option>
                    <option value="2K" className="bg-stone-900">2K (Yüksek)</option>
                    <option value="4K" className="bg-stone-900">4K (Ultra Yüksek)</option>
                  </select>
                </div>
                <Button 
                  onClick={handleGenerateImage} 
                  disabled={isGenerating || isAnalyzing} 
                  className="button-3d-primary w-full h-10 text-xs font-bold uppercase tracking-widest rounded-xl mt-2"
                >
                  {isGenerating ? <Loader2 className="animate-spin mr-1.5 h-4 w-4" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
                  {isGenerating ? 'Üretiliyor...' : 'Görsel Üret'}
                </Button>
              </div>
            )}

            <div className="space-y-4 pt-2 border-t border-amber-950/10">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Ürün Adı</Label>
                <Input 
                  id="name" 
                  value={newItem.name} 
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})} 
                  placeholder="Örn: Caramel Macchiato"
                  className="bg-neutral-950/50 border border-amber-950/25 text-white focus:border-[#dcae61] focus:ring-[#dcae61] rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Kategori</Label>
                <Input 
                  id="category" 
                  value={newItem.category} 
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})} 
                  placeholder="Örn: Sıcak Kahveler"
                  className="bg-neutral-950/50 border border-amber-950/25 text-white focus:border-[#dcae61] focus:ring-[#dcae61] rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Fiyat (₺)</Label>
                <Input 
                  id="price" 
                  type="number"
                  value={newItem.price} 
                  onChange={(e) => setNewItem({...newItem, price: e.target.value})} 
                  placeholder="0.00"
                  className="bg-neutral-950/50 border border-amber-950/25 text-white focus:border-[#dcae61] focus:ring-[#dcae61] rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Açıklama</Label>
                <Input 
                  id="description" 
                  value={newItem.description} 
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})} 
                  placeholder="Kavrulmuş çekirdekler, süt köpüğü..."
                  className="bg-neutral-950/50 border border-amber-950/25 text-white focus:border-[#dcae61] focus:ring-[#dcae61] rounded-xl"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-5 pt-0 bg-neutral-900/10">
            <Button className="button-3d-primary w-full h-11 text-xs font-bold uppercase tracking-widest rounded-xl" onClick={handleSave} disabled={isAnalyzing || isGenerating}>
              <Plus className="mr-1.5 h-4 w-4" />
              Menüye Ekle
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="md:col-span-2 space-y-6">
        <h3 className="text-lg font-black text-white font-sans uppercase tracking-wider flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-[#dcae61]" />
          Mevcut Menü ({menuItems.length} Ürün)
        </h3>
        <div className="grid gap-6 sm:grid-cols-2">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Card className="overflow-hidden flex flex-row h-36 card-3d border-none hover:border-[#dcae61]/25 transition-all duration-300 shadow-lg">
                <div className="w-32 bg-neutral-950/40 shrink-0 border-r border-amber-950/10">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="p-4 flex flex-col justify-center flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-[#f5f2eb] truncate text-base pr-2">{item.name}</h4>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-extrabold text-[#dcae61] text-base">₺{item.price}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full" 
                        onClick={() => removeMenuItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed">{item.description}</p>
                  <div className="mt-3.5">
                    <span className="badge-glass inline-flex items-center rounded-full border border-amber-950/20 px-2.5 py-0.5 text-[10px] font-bold text-[#dcae61] uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
