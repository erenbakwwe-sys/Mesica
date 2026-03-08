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
    <div className="grid gap-8 md:grid-cols-3">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-orange-500" />
              Yapay Zeka ile Ürün Ekle
            </CardTitle>
            <CardDescription>
              Bir yemek fotoğrafı yükleyin veya yapay zekaya ürettirin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="flex gap-2">
              <Button 
                variant={imageSource === 'upload' ? 'default' : 'outline'} 
                onClick={() => setImageSource('upload')}
                className="flex-1"
                size="sm"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Yükle
              </Button>
              <Button 
                variant={imageSource === 'generate' ? 'default' : 'outline'} 
                onClick={() => setImageSource('generate')}
                className="flex-1"
                size="sm"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Üret
              </Button>
            </div>

            {imageSource === 'upload' ? (
              <div 
                className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors relative overflow-hidden h-48"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                ) : null}
                
                <div className="relative z-10 flex flex-col items-center">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-10 w-10 text-orange-500 animate-spin mb-2" />
                      <p className="text-sm font-medium text-slate-700">Yapay Zeka Analiz Ediyor...</p>
                    </>
                  ) : (
                    <>
                      <div className="bg-orange-100 p-3 rounded-full mb-3">
                        <ImageIcon className="h-6 w-6 text-orange-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-700">Resim Yükle veya Sürükle</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP</p>
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
              <div className="space-y-3 border-2 border-slate-100 bg-slate-50 rounded-xl p-4">
                {previewImage && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden mb-3">
                    <img src={previewImage} alt="Generated" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-xs">Ne resmi üretmek istersiniz?</Label>
                  <Input 
                    value={generatePrompt} 
                    onChange={e => setGeneratePrompt(e.target.value)} 
                    placeholder="Örn: Lezzetli bir Meksika tacosu, stüdyo çekimi" 
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Çözünürlük</Label>
                  <select 
                    className="flex h-8 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                    value={imageSize} 
                    onChange={e => setImageSize(e.target.value)}
                  >
                    <option value="1K">1K (Standart)</option>
                    <option value="2K">2K (Yüksek)</option>
                    <option value="4K">4K (Ultra Yüksek)</option>
                  </select>
                </div>
                <Button 
                  onClick={handleGenerateImage} 
                  disabled={isGenerating || isAnalyzing} 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-sm"
                >
                  {isGenerating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {isGenerating ? 'Üretiliyor...' : 'Resim Üret'}
                </Button>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label htmlFor="name">Ürün Adı</Label>
                <Input 
                  id="name" 
                  value={newItem.name} 
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})} 
                  placeholder="Örn: Acılı Taco"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="category">Kategori</Label>
                <Input 
                  id="category" 
                  value={newItem.category} 
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})} 
                  placeholder="Örn: Ana Yemek"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="price">Fiyat (₺)</Label>
                <Input 
                  id="price" 
                  type="number"
                  value={newItem.price} 
                  onChange={(e) => setNewItem({...newItem, price: e.target.value})} 
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Açıklama</Label>
                <Input 
                  id="description" 
                  value={newItem.description} 
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})} 
                  placeholder="Ürün açıklaması..."
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={handleSave} disabled={isAnalyzing || isGenerating}>
              <Plus className="mr-2 h-4 w-4" />
              Menüye Ekle
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="md:col-span-2">
        <h3 className="text-lg font-semibold mb-4">Mevcut Menü ({menuItems.length} Ürün)</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Card className="overflow-hidden flex flex-row h-32">
                <div className="w-32 bg-slate-100 shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="p-4 flex flex-col justify-center flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-slate-900 truncate pr-2">{item.name}</h4>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-orange-600">₺{item.price}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50" 
                        onClick={() => removeMenuItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-2">{item.description}</p>
                  <div className="mt-auto">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
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
