import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Minus, ShoppingCart, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Menu() {
  const { menuItems, cart, addToCart, removeFromCart, total } = useCart();
  const [activeCategory, setActiveCategory] = useState<string>('Tümü');
  const navigate = useNavigate();

  const categories = ['Tümü', ...Array.from(new Set(menuItems.map((item) => item.category)))];

  const filteredItems = activeCategory === 'Tümü' 
    ? menuItems 
    : menuItems.filter((item) => item.category === activeCategory);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-8 pb-24" // Added pb-24 for the sticky bottom bar
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dijital Menü</h1>
          <p className="text-slate-500 mt-1">Lezzetlerimizi keşfedin ve siparişinizi oluşturun.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item, index) => {
          const cartItem = cart.find((c) => c.id === item.id);
          const quantity = cartItem?.quantity || 0;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden h-full flex flex-col border-none shadow-sm hover:shadow-md transition-all">
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <CardHeader className="p-5 pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-xl">{item.name}</CardTitle>
                    <span className="font-semibold text-orange-600">₺{item.price}</span>
                  </div>
                  <CardDescription className="mt-2 line-clamp-2">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="p-5 pt-4 mt-auto">
                  {quantity > 0 ? (
                    <div className="flex w-full items-center justify-between rounded-full bg-orange-50 p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-orange-600 hover:bg-orange-200 hover:text-orange-700"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-semibold text-orange-900 w-8 text-center">{quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-orange-600 hover:bg-orange-200 hover:text-orange-700"
                        onClick={() => addToCart(item.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full rounded-full bg-slate-900 text-white hover:bg-slate-800" 
                      onClick={() => addToCart(item.id)}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Sepete Ekle
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
          >
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-sm text-slate-500 font-medium">{cartItemCount} ürün</span>
                <span className="text-xl font-bold text-orange-600">₺{total.toFixed(2)}</span>
              </div>
              <Button 
                size="lg" 
                className="rounded-full bg-orange-600 hover:bg-orange-700 text-white px-8"
                onClick={() => navigate('/order')}
              >
                Sepete Git
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
