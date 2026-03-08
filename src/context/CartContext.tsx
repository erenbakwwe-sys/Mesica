import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { MENU_ITEMS as INITIAL_MENU_ITEMS } from '../data/menu';
import { playSound } from '../lib/sounds';
import { toast } from 'sonner';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export type OrderStatus = 'Yeni' | 'Hazırlanıyor' | 'Hazır' | 'Teslim Edildi';

export interface WaiterCall {
  id: string;
  table: string;
  time: Date;
  resolved: boolean;
}

export interface Order {
  id: string;
  table: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
}

interface CartContextType {
  menuItems: MenuItem[];
  addMenuItem: (item: MenuItem) => void;
  removeMenuItem: (itemId: string) => void;
  cart: CartItem[];
  addToCart: (itemId: string) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  total: number;
  orders: Order[];
  placeOrder: (table: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  callWaiter: (table: string) => void;
  waiterCalls: WaiterCall[];
  resolveWaiterCall: (id: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const savedMenu = localStorage.getItem('casa_mexicana_menu');
    if (savedMenu) {
      try {
        const parsedMenu = JSON.parse(savedMenu);
        if (Array.isArray(parsedMenu)) {
          return parsedMenu;
        }
      } catch (e) {
        console.error("Failed to parse menu from localStorage", e);
      }
    }
    return INITIAL_MENU_ITEMS;
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>(() => {
    const saved = localStorage.getItem('casa_mexicana_waiter_calls');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((c: any) => ({ ...c, time: new Date(c.time) }));
      } catch (e) {
        console.error("Failed to parse waiter calls", e);
      }
    }
    return [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const savedOrders = localStorage.getItem('casa_mexicana_orders');
    if (savedOrders) {
      try {
        const parsed = JSON.parse(savedOrders);
        return parsed.map((o: any) => ({
          ...o,
          createdAt: new Date(o.createdAt)
        }));
      } catch (e) {
        console.error("Failed to parse orders from localStorage", e);
      }
    }
    return [];
  });

  // Save menu items to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('casa_mexicana_menu', JSON.stringify(menuItems));
    } catch (e) {
      console.error("Failed to save menu to localStorage", e);
      toast.error("Depolama alanı dolu. Lütfen daha küçük resimler kullanın veya bazı ürünleri silin.");
    }
  }, [menuItems]);

  const addMenuItem = (item: MenuItem) => {
    setMenuItems((prev) => [...prev, item]);
    toast.success(`${item.name} menüye eklendi!`);
  };

  const removeMenuItem = (itemId: string) => {
    setMenuItems((prev) => prev.filter(item => item.id !== itemId));
    setCart((prev) => prev.filter(item => item.id !== itemId));
    toast.success('Ürün menüden başarıyla silindi.');
  };

  // Listen for storage events to sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'casa_mexicana_orders' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const formatted = parsed.map((o: any) => ({
            ...o,
            createdAt: new Date(o.createdAt)
          }));
          
          // Check for new orders or status changes to play sounds
          setOrders(prev => {
            // Find new orders
            const newOrders = formatted.filter((fo: Order) => !prev.some(po => po.id === fo.id));
            if (newOrders.length > 0) {
              playSound('new_order');
              toast.success(`Yeni sipariş geldi! (${newOrders[0].table})`);
            } else {
              // Check for status changes
              formatted.forEach((fo: Order) => {
                const existing = prev.find(po => po.id === fo.id);
                if (existing && existing.status !== fo.status) {
                  if (fo.status === 'Hazırlanıyor') {
                    playSound('preparing');
                    toast.info(`Sipariş hazırlanıyor (${fo.table})`);
                  } else if (fo.status === 'Hazır') {
                    playSound('ready');
                    toast.success(`Sipariş hazır! (${fo.table})`);
                  } else if (fo.status === 'Teslim Edildi') {
                    playSound('delivered');
                    toast(`Sipariş teslim edildi (${fo.table})`);
                  }
                }
              });
            }
            return formatted;
          });
        } catch (e) {
          console.error("Failed to parse orders from storage event", e);
        }
      } else if (e.key === 'casa_mexicana_waiter_calls' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const formatted = parsed.map((c: any) => ({ ...c, time: new Date(c.time) }));
          setWaiterCalls(prev => {
            const newCalls = formatted.filter((fc: WaiterCall) => 
              !fc.resolved && !prev.some(pc => pc.id === fc.id)
            );
            if (newCalls.length > 0) {
              playSound('waiter');
              toast.warning(`Garson çağrıldı: ${newCalls[0].table}`);
            }
            return formatted;
          });
        } catch (e) {
          console.error("Failed to parse waiter calls from storage event", e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save orders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('casa_mexicana_orders', JSON.stringify(orders));
  }, [orders]);

  const addToCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === itemId);
      if (existing) {
        return prev.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      const menuItem = menuItems.find((item) => item.id === itemId);
      if (menuItem) {
        return [...prev, { ...menuItem, quantity: 1 }];
      }
      return prev;
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter((item) => item.id !== itemId);
    });
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const placeOrder = (table: string) => {
    if (cart.length === 0) return;
    
    const newOrder: Order = {
      id: Math.random().toString(36).substring(2, 9),
      table,
      items: [...cart],
      total,
      status: 'Yeni',
      createdAt: new Date(),
    };
    
    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    
    // Play sound and show toast locally as well
    playSound('new_order');
    toast.success("Siparişiniz mutfağa gönderildi.");
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status } : order))
    );
    
    // Play sound and show toast locally
    if (status === 'Hazırlanıyor') {
      playSound('preparing');
      toast.info("Sipariş hazırlanıyor");
    } else if (status === 'Hazır') {
      playSound('ready');
      toast.success("Sipariş hazır!");
    } else if (status === 'Teslim Edildi') {
      playSound('delivered');
      toast("Sipariş teslim edildi");
    }
  };

  const callWaiter = (table: string) => {
    const newCall: WaiterCall = {
      id: Math.random().toString(36).substring(2, 9),
      table,
      time: new Date(),
      resolved: false
    };
    setWaiterCalls(prev => [newCall, ...prev]);
    playSound('waiter');
    toast.success("Garsona bildirim gönderildi.");
  };

  const resolveWaiterCall = (id: string) => {
    setWaiterCalls(prev => prev.map(call => call.id === id ? { ...call, resolved: true } : call));
  };

  // Save waiter calls to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('casa_mexicana_waiter_calls', JSON.stringify(waiterCalls));
  }, [waiterCalls]);

  return (
    <CartContext.Provider
      value={{
        menuItems,
        addMenuItem,
        removeMenuItem,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        total,
        orders,
        placeOrder,
        updateOrderStatus,
        callWaiter,
        waiterCalls,
        resolveWaiterCall,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
