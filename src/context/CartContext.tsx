import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { MENU_ITEMS as INITIAL_MENU_ITEMS } from '../data/menu';
import { playSound } from '../lib/sounds';
import { toast } from 'sonner';
import { db, auth } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp, 
  setDoc,
  getDocs,
  getDocFromServer
} from 'firebase/firestore';

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

export type OrderStatus = 'Ödeme Bekleniyor' | 'Yeni' | 'Hazırlanıyor' | 'Hazır' | 'Teslim Edildi' | 'Ödendi';
export type PaymentMethod = 'Nakit' | 'Kart' | 'POS';

export interface WaiterCall {
  id: string;
  table: string;
  time: Date;
  resolved: boolean;
}

export interface PaymentRecord {
  method: PaymentMethod;
  amount: number;
  date: Date;
  tip?: number;
}

export interface Order {
  id: string;
  table: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  paymentMethod: PaymentMethod; // Primary or initial method
  note?: string;
  paidAmount?: number;
  remainingAmount?: number;
  payments?: PaymentRecord[];
}

export interface Table {
  id: string;
  name: string;
  isOpen: boolean;
  openedAt?: Date | null;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  salary: number;
  phone: string;
  email: string;
}

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  unitPrice: number;
  lastUpdated: Date;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: Date;
}

export interface Coupon {
  id: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  isActive: boolean;
  minOrderAmount?: number;
  expiryDate?: Date | null;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  }
}

let globalOnFirestoreError: ((error: unknown, operationType: OperationType, path: string | null) => void) | null = null;
const syncChannel = typeof window !== 'undefined' ? new BroadcastChannel('izmir_deniz_sync') : null;

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (globalOnFirestoreError) {
    globalOnFirestoreError(error, operationType, path);
  }
  if (operationType !== OperationType.LIST) {
    throw new Error(JSON.stringify(errInfo));
  }
}

export interface CartContextType {
  useLocalFallback: boolean;
  setUseLocalFallback: (val: boolean) => void;
  menuItems: MenuItem[];
  addMenuItem: (item: MenuItem) => void;
  removeMenuItem: (itemId: string) => void;
  cart: CartItem[];
  addToCart: (itemId: string) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  total: number;
  orders: Order[];
  placeOrder: (table: string, paymentMethod: PaymentMethod, note?: string, paidAmount?: number) => Promise<string | undefined>;
  placeWaiterOrder: (table: string, items: CartItem[], note?: string) => Promise<string | undefined>;
  addPaymentToOrder: (orderId: string, amount: number, method: PaymentMethod, tipAmount?: number) => Promise<void>;
  addPaymentToTableOrders: (tableName: string, amount: number, method: PaymentMethod, tipAmount?: number) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  deleteOrder: (orderId: string) => void;
  callWaiter: (table: string) => void;
  waiterCalls: WaiterCall[];
  resolveWaiterCall: (id: string) => void;
  tables: Table[];
  openTable: (id: string) => void;
  closeTable: (id: string) => void;
  staff: Staff[];
  addStaff: (staffMember: Omit<Staff, 'id'>) => Promise<void>;
  removeStaff: (id: string) => Promise<void>;
  stock: StockItem[];
  addStockItem: (item: Omit<StockItem, 'id' | 'lastUpdated'>) => Promise<void>;
  updateStockItem: (id: string, item: Partial<StockItem>) => Promise<void>;
  removeStockItem: (id: string) => Promise<void>;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  coupons: Coupon[];
  addCoupon: (coupon: Coupon) => Promise<void>;
  toggleCouponStatus: (id: string, isActive: boolean) => Promise<void>;
  removeCoupon: (id: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const sendPushNotification = async (title: string, body: string) => {
  try {
    if (!("Notification" in window)) return;
    const isAdmin = sessionStorage.getItem('izmir_deniz_admin_logged_in') === 'true';
    if (isAdmin && Notification.permission === "granted") {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.showNotification(title, { 
            body, 
            icon: '/vite.svg',
            vibrate: [200, 100, 200]
          } as any);
          return;
        }
      }
      new Notification(title, { body });
    }
  } catch (error) {
    console.error("Bildirim gönderilirken hata oluştu:", error);
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [useLocalFallback, setUseLocalFallback] = useState<boolean>(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const playSoundWithSync = (soundName: string) => {
    playSound(soundName as any);
    syncChannel?.postMessage({ type: 'PLAY_SOUND', sound: soundName });
  };

  // Clean up any previously stored fallback keys on load
  useEffect(() => {
    localStorage.removeItem('firebase_quota_fallback');
  }, []);

  // Register global onFirestoreError callback
  useEffect(() => {
    globalOnFirestoreError = (err, opType, path) => {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`Firestore Error caught in global handler (Operation: ${opType}, Path: ${path}):`, errMsg);
    };
    return () => {
      globalOnFirestoreError = null;
    };
  }, []);

  // Synchronize state across tabs when using local fallback
  useEffect(() => {
    if (!syncChannel) return;

    const handleSyncMessage = (event: MessageEvent) => {
      const { type, key, data } = event.data;
      if (type === 'SYNC_DATA') {
        if (!useLocalFallback) return;
        switch (key) {
          case 'fallback_menu':
            setMenuItems(data);
            break;
          case 'fallback_tables':
            setTables(data);
            break;
          case 'fallback_orders':
            const parsedOrders = data.map((o: any) => ({
              ...o,
              createdAt: new Date(o.createdAt),
              payments: o.payments ? o.payments.map((p: any) => ({ ...p, date: new Date(p.date) })) : []
            }));
            setOrders(parsedOrders);
            break;
          case 'fallback_waiter_calls':
            const parsedCalls = data.map((c: any) => ({
              ...c,
              time: new Date(c.time)
            }));
            setWaiterCalls(parsedCalls);
            break;
          case 'fallback_staff':
            setStaff(data);
            break;
          case 'fallback_stock':
            const parsedStock = data.map((s: any) => ({
              ...s,
              lastUpdated: new Date(s.lastUpdated)
            }));
            setStock(parsedStock);
            break;
          case 'fallback_expenses':
            const parsedExpenses = data.map((e: any) => ({
              ...e,
              date: new Date(e.date)
            }));
            setExpenses(parsedExpenses);
            break;
          case 'fallback_coupons':
            const parsedCoupons = data.map((cp: any) => ({
              ...cp,
              expiryDate: cp.expiryDate ? new Date(cp.expiryDate) : null
            }));
            setCoupons(parsedCoupons);
            break;
          default:
            break;
        }
      } else if (type === 'FALLBACK_TOGGLED') {
        setUseLocalFallback(event.data.value);
      } else if (type === 'PLAY_SOUND') {
        playSound(event.data.sound);
      }
    };

    syncChannel.addEventListener('message', handleSyncMessage);
    return () => {
      syncChannel.removeEventListener('message', handleSyncMessage);
    };
  }, [useLocalFallback]);

  const saveFallbackMenu = (newMenu: MenuItem[]) => {
    setMenuItems(newMenu);
    localStorage.setItem('fallback_menu', JSON.stringify(newMenu));
    syncChannel?.postMessage({ type: 'SYNC_DATA', key: 'fallback_menu', data: newMenu });
  };

  const saveFallbackTables = (newTables: Table[]) => {
    setTables(newTables);
    localStorage.setItem('fallback_tables', JSON.stringify(newTables));
    syncChannel?.postMessage({ type: 'SYNC_DATA', key: 'fallback_tables', data: newTables });
  };

  const saveFallbackOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
    localStorage.setItem('fallback_orders', JSON.stringify(newOrders));
    syncChannel?.postMessage({ type: 'SYNC_DATA', key: 'fallback_orders', data: newOrders });
  };

  const saveFallbackWaiterCalls = (newCalls: WaiterCall[]) => {
    setWaiterCalls(newCalls);
    localStorage.setItem('fallback_waiter_calls', JSON.stringify(newCalls));
    syncChannel?.postMessage({ type: 'SYNC_DATA', key: 'fallback_waiter_calls', data: newCalls });
  };

  const saveFallbackStaff = (newStaff: Staff[]) => {
    setStaff(newStaff);
    localStorage.setItem('fallback_staff', JSON.stringify(newStaff));
    syncChannel?.postMessage({ type: 'SYNC_DATA', key: 'fallback_staff', data: newStaff });
  };

  const saveFallbackStock = (newStock: StockItem[]) => {
    setStock(newStock);
    localStorage.setItem('fallback_stock', JSON.stringify(newStock));
    syncChannel?.postMessage({ type: 'SYNC_DATA', key: 'fallback_stock', data: newStock });
  };

  const saveFallbackExpenses = (newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    localStorage.setItem('fallback_expenses', JSON.stringify(newExpenses));
    syncChannel?.postMessage({ type: 'SYNC_DATA', key: 'fallback_expenses', data: newExpenses });
  };

  const saveFallbackCoupons = (newCoupons: Coupon[]) => {
    setCoupons(newCoupons);
    localStorage.setItem('fallback_coupons', JSON.stringify(newCoupons));
    syncChannel?.postMessage({ type: 'SYNC_DATA', key: 'fallback_coupons', data: newCoupons });
  };

  // Load fallback data if active
  useEffect(() => {
    if (useLocalFallback) {
      // 1. Menu Items
      const localMenu = localStorage.getItem('fallback_menu');
      if (localMenu) {
        setMenuItems(JSON.parse(localMenu));
      } else {
        localStorage.setItem('fallback_menu', JSON.stringify(INITIAL_MENU_ITEMS));
        setMenuItems(INITIAL_MENU_ITEMS);
      }

      // 2. Tables
      const localTables = localStorage.getItem('fallback_tables');
      if (localTables) {
        setTables(JSON.parse(localTables));
      } else {
        const initialTables = Array.from({ length: 20 }, (_, i) => ({
          id: (i + 1).toString(),
          name: `Masa ${i + 1}`,
          isOpen: false,
          openedAt: null
        }));
        localStorage.setItem('fallback_tables', JSON.stringify(initialTables));
        setTables(initialTables);
      }

      // 3. Orders
      const localOrders = localStorage.getItem('fallback_orders');
      if (localOrders) {
        const parsedOrders = JSON.parse(localOrders).map((o: any) => ({
          ...o,
          createdAt: new Date(o.createdAt),
          payments: o.payments ? o.payments.map((p: any) => ({ ...p, date: new Date(p.date) })) : []
        }));
        setOrders(parsedOrders);
      } else {
        localStorage.setItem('fallback_orders', JSON.stringify([]));
        setOrders([]);
      }

      // 4. Waiter Calls
      const localCalls = localStorage.getItem('fallback_waiter_calls');
      if (localCalls) {
        const parsedCalls = JSON.parse(localCalls).map((c: any) => ({
          ...c,
          time: new Date(c.time)
        }));
        setWaiterCalls(parsedCalls);
      } else {
        localStorage.setItem('fallback_waiter_calls', JSON.stringify([]));
        setWaiterCalls([]);
      }

      // 5. Staff
      const localStaff = localStorage.getItem('fallback_staff');
      if (localStaff) {
        setStaff(JSON.parse(localStaff));
      } else {
        localStorage.setItem('fallback_staff', JSON.stringify([]));
        setStaff([]);
      }

      // 6. Stock
      const localStock = localStorage.getItem('fallback_stock');
      if (localStock) {
        const parsedStock = JSON.parse(localStock).map((s: any) => ({
          ...s,
          lastUpdated: new Date(s.lastUpdated)
        }));
        setStock(parsedStock);
      } else {
        localStorage.setItem('fallback_stock', JSON.stringify([]));
        setStock([]);
      }

      // 7. Expenses
      const localExpenses = localStorage.getItem('fallback_expenses');
      if (localExpenses) {
        const parsedExpenses = JSON.parse(localExpenses).map((e: any) => ({
          ...e,
          date: new Date(e.date)
        }));
        setExpenses(parsedExpenses);
      } else {
        localStorage.setItem('fallback_expenses', JSON.stringify([]));
        setExpenses([]);
      }

      // 8. Coupons
      const localCoupons = localStorage.getItem('fallback_coupons');
      if (localCoupons) {
        const parsedCoupons = JSON.parse(localCoupons).map((cp: any) => ({
          ...cp,
          expiryDate: cp.expiryDate ? new Date(cp.expiryDate) : null
        }));
        setCoupons(parsedCoupons);
      } else {
        localStorage.setItem('fallback_coupons', JSON.stringify([]));
        setCoupons([]);
      }
    }
  }, [useLocalFallback]);

  // Test Connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Sync Menu
  useEffect(() => {
    if (useLocalFallback) return;
    const q = query(collection(db, 'menu'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // Populate initial menu if empty
        INITIAL_MENU_ITEMS.forEach(async (item) => {
          try {
            await setDoc(doc(db, 'menu', item.id), item);
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, 'menu');
          }
        });
      } else {
        const items = snapshot.docs.map(doc => doc.data() as MenuItem);
        setMenuItems(items);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'menu');
    });
    return () => unsubscribe();
  }, [useLocalFallback]);

  // Sync Tables
  useEffect(() => {
    if (useLocalFallback) return;
    const q = query(collection(db, 'tables'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const existingTableIds = new Set(snapshot.docs.map(doc => doc.id));
      const missingTables = [];
      
      for (let i = 1; i <= 20; i++) {
        if (!existingTableIds.has(i.toString())) {
          missingTables.push(i);
        }
      }

      if (missingTables.length > 0) {
        missingTables.forEach(i => {
          const table: Table = {
            id: i.toString(),
            name: `Masa ${i}`,
            isOpen: false,
            openedAt: null
          };
          setDoc(doc(db, 'tables', i.toString()), table).catch(e => handleFirestoreError(e, OperationType.WRITE, 'tables'));
        });
      }

      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          openedAt: data.openedAt?.toDate ? data.openedAt.toDate() : (data.openedAt ? new Date(data.openedAt) : null)
        } as Table;
      });
      items.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      setTables(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tables');
    });
    return () => unsubscribe();
  }, [useLocalFallback]);

  // Sync Orders
  useEffect(() => {
    if (useLocalFallback) return;
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const formatted = snapshot.docs.map(doc => {
        const data = doc.data({ serverTimestamps: 'estimate' });
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date())
        } as Order;
      });

      setOrders(prev => {
        const newOrders = formatted.filter(fo => !prev.some(po => po.id === fo.id));
        const isAdminUser = typeof window !== 'undefined' && sessionStorage.getItem('izmir_deniz_admin_logged_in') === 'true';
        const currentCustomerTable = typeof window !== 'undefined' ? localStorage.getItem('current_table') : null;

        if (newOrders.length > 0 && prev.length > 0) {
          const isMyTable = currentCustomerTable && newOrders[0].table === currentCustomerTable;
          if (isAdminUser || isMyTable) {
            playSound('new_order');
            if (isAdminUser) {
              toast.success(`Yeni sipariş geldi! (${newOrders[0].table})`);
              sendPushNotification("Yeni Sipariş", `${newOrders[0].table} masasından yeni bir sipariş geldi.`);
            } else {
              toast.success(`Siparişiniz sisteme girildi! (${currentCustomerTable}) ✨`);
            }
          }
        } else {
          formatted.forEach(fo => {
            const existing = prev.find(po => po.id === fo.id);
            if (existing && existing.status !== fo.status) {
              const isMyTable = currentCustomerTable && fo.table === currentCustomerTable;
              if (isAdminUser || isMyTable) {
                if (fo.status === 'Hazırlanıyor') {
                  playSound('preparing');
                  toast.info(isMyTable ? "Siparişiniz hazırlanıyor ☕" : `Sipariş hazırlanıyor (${fo.table})`);
                } else if (fo.status === 'Hazır') {
                  playSound('ready');
                  toast.success(isMyTable ? "Siparişiniz hazır! Afiyet olsun. 🎉" : `Sipariş hazır! (${fo.table})`);
                } else if (fo.status === 'Teslim Edildi') {
                  playSound('delivered');
                  toast(isMyTable ? "Siparişiniz teslim edildi" : `Sipariş teslim edildi (${fo.table})`);
                }
              }
            }
          });
        }
        return formatted;
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });
    return () => unsubscribe();
  }, [useLocalFallback]);

  // Sync Waiter Calls
  useEffect(() => {
    if (useLocalFallback) return;
    const q = query(collection(db, 'waiter_calls'), orderBy('time', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const formatted = snapshot.docs.map(doc => {
        const data = doc.data({ serverTimestamps: 'estimate' });
        return {
          ...data,
          id: doc.id,
          time: data.time?.toDate ? data.time.toDate() : (data.time ? new Date(data.time) : new Date())
        } as WaiterCall;
      });

      setWaiterCalls(prev => {
        const newCalls = formatted.filter(fc => !fc.resolved && !prev.some(pc => pc.id === fc.id));
        const isAdminUser = typeof window !== 'undefined' && sessionStorage.getItem('izmir_deniz_admin_logged_in') === 'true';

        if (newCalls.length > 0 && prev.length > 0) {
          if (isAdminUser) {
            playSound('waiter');
            toast.warning(`Garson çağrıldı: ${newCalls[0].table}`);
            sendPushNotification("Garson Çağrısı", `${newCalls[0].table} garson çağırıyor.`);
          }
        }
        return formatted;
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'waiter_calls');
    });
    return () => unsubscribe();
  }, [useLocalFallback]);

  // Sync Staff
  useEffect(() => {
    if (useLocalFallback) return;
    const q = query(collection(db, 'staff'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Staff));
      setStaff(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'staff');
    });
    return () => unsubscribe();
  }, [useLocalFallback]);

  // Sync Stock
  useEffect(() => {
    if (useLocalFallback) return;
    const q = query(collection(db, 'stock'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          lastUpdated: data.lastUpdated?.toDate ? data.lastUpdated.toDate() : (data.lastUpdated ? new Date(data.lastUpdated) : new Date())
        } as StockItem;
      });
      setStock(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'stock');
    });
    return () => unsubscribe();
  }, [useLocalFallback]);

  // Sync Expenses
  useEffect(() => {
    if (useLocalFallback) return;
    const q = query(collection(db, 'expenses'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          date: data.date?.toDate ? data.date.toDate() : (data.date ? new Date(data.date) : new Date())
        } as Expense;
      });
      setExpenses(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'expenses');
    });
    return () => unsubscribe();
  }, [useLocalFallback]);

  // Sync Coupons
  useEffect(() => {
    if (useLocalFallback) return;
    const q = query(collection(db, 'coupons'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          expiryDate: data.expiryDate?.toDate ? data.expiryDate.toDate() : (data.expiryDate ? new Date(data.expiryDate) : null)
        } as Coupon;
      });
      setCoupons(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'coupons');
    });
    return () => unsubscribe();
  }, [useLocalFallback]);

  const addMenuItem = async (item: MenuItem) => {
    if (useLocalFallback) {
      saveFallbackMenu([...menuItems, item]);
      toast.success(`${item.name} menüye eklendi!`);
      return;
    }
    try {
      await setDoc(doc(db, 'menu', item.id), item);
      toast.success(`${item.name} menüye eklendi!`);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'menu');
    }
  };

  const removeMenuItem = async (itemId: string) => {
    if (useLocalFallback) {
      saveFallbackMenu(menuItems.filter(item => item.id !== itemId));
      setCart((prev) => prev.filter(item => item.id !== itemId));
      toast.success('Ürün menüden başarıyla silindi.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'menu', itemId));
      setCart((prev) => prev.filter(item => item.id !== itemId));
      toast.success('Ürün menüden başarıyla silindi.');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'menu');
    }
  };

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

  const placeOrder = async (table: string, paymentMethod: PaymentMethod, note?: string, paidAmount?: number) => {
    if (cart.length === 0) return;
    
    const isPartialPayment = paidAmount !== undefined && paidAmount < total;
    const initialStatus: OrderStatus = isPartialPayment ? 'Ödeme Bekleniyor' : 'Yeni';
    
    const localId = 'order_' + Date.now();
    const newOrder = {
      id: localId,
      table,
      items: [...cart],
      total,
      status: initialStatus,
      createdAt: new Date(),
      paymentMethod,
      note: note || '',
      paidAmount: paidAmount || (isPartialPayment ? 0 : total),
      remainingAmount: isPartialPayment ? total - paidAmount : 0,
      payments: paidAmount ? [{ method: paymentMethod, amount: paidAmount, date: new Date() }] : []
    };

    if (useLocalFallback) {
      saveFallbackOrders([newOrder, ...orders]);
      const tableObj = tables.find(t => t.name === table);
      if (tableObj && !tableObj.isOpen) {
        saveFallbackTables(tables.map(t => t.id === tableObj.id ? { ...t, isOpen: true, openedAt: new Date() } : t));
      }
      clearCart();
      if (!isPartialPayment) {
        playSoundWithSync('new_order');
        toast.success("Siparişiniz mutfağa gönderildi.");
      } else {
        toast.success("Kısmi ödeme alındı, diğer ödemeler bekleniyor.");
      }
      return localId;
    }
    
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...newOrder,
        createdAt: serverTimestamp()
      });
      
      // If table is not open, open it automatically
      const tableObj = tables.find(t => t.name === table);
      if (tableObj && !tableObj.isOpen) {
        await updateDoc(doc(db, 'tables', tableObj.id), {
          isOpen: true,
          openedAt: serverTimestamp()
        });
      }

      clearCart();
      if (!isPartialPayment) {
        playSoundWithSync('new_order');
        toast.success("Siparişiniz mutfağa gönderildi.");
      } else {
        toast.success("Kısmi ödeme alındı, diğer ödemeler bekleniyor.");
      }
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'orders');
    }
  };

  const placeWaiterOrder = async (table: string, items: CartItem[], note?: string) => {
    if (items.length === 0) return;
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const localId = 'order_' + Date.now();
    const newOrder = {
      id: localId,
      table,
      items: [...items],
      total: totalAmount,
      status: 'Yeni' as OrderStatus,
      createdAt: new Date(),
      paymentMethod: 'Kart' as PaymentMethod,
      note: note || '',
      paidAmount: 0,
      remainingAmount: totalAmount,
      payments: []
    };

    if (useLocalFallback) {
      saveFallbackOrders([newOrder, ...orders]);
      const tableObj = tables.find(t => t.name === table);
      if (tableObj && !tableObj.isOpen) {
        saveFallbackTables(tables.map(t => t.id === tableObj.id ? { ...t, isOpen: true, openedAt: new Date() } : t));
      }
      playSoundWithSync('new_order');
      toast.success(`Sipariş girildi (${table})`);
      return localId;
    }

    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...newOrder,
        createdAt: serverTimestamp()
      });
      // If table is not open, open it automatically
      const tableObj = tables.find(t => t.name === table);
      if (tableObj && !tableObj.isOpen) {
        await updateDoc(doc(db, 'tables', tableObj.id), {
          isOpen: true,
          openedAt: serverTimestamp()
        });
      }
      playSoundWithSync('new_order');
      toast.success(`Sipariş girildi (${table})`);
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'orders');
    }
  };

  const addPaymentToOrder = async (orderId: string, amount: number, method: PaymentMethod, tipAmount: number = 0) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const newPaidAmount = (order.paidAmount || 0) + amount;
    const newRemainingAmount = Math.max(0, order.total - newPaidAmount);
    const isFullyPaid = newRemainingAmount <= 0;

    const newPaymentRecord = { method, amount, date: new Date(), tip: tipAmount };

    if (useLocalFallback) {
      const updatedOrders = orders.map(o => o.id === orderId ? {
        ...o,
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        payments: [...(o.payments || []), newPaymentRecord],
        status: isFullyPaid ? 'Yeni' as OrderStatus : 'Ödeme Bekleniyor' as OrderStatus
      } : o);
      
      saveFallbackOrders(updatedOrders);
      if (isFullyPaid) {
        playSoundWithSync('new_order');
        toast.success("Ödeme tamamlandı, sipariş mutfağa gönderildi.");
      } else {
        toast.success(`₺${amount.toFixed(2)} ödeme alındı. Kalan: ₺${newRemainingAmount.toFixed(2)}`);
      }
      return;
    }

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        payments: [...(order.payments || []), newPaymentRecord],
        status: isFullyPaid ? 'Yeni' : 'Ödeme Bekleniyor'
      });

      if (isFullyPaid) {
        playSoundWithSync('new_order');
        toast.success("Ödeme tamamlandı, sipariş mutfağa gönderildi.");
      } else {
        toast.success(`₺${amount.toFixed(2)} ödeme alındı. Kalan: ₺${newRemainingAmount.toFixed(2)}`);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const addPaymentToTableOrders = async (tableName: string, amount: number, method: PaymentMethod, tipAmount: number = 0) => {
    if (useLocalFallback) {
      const updatedOrders = orders.map(o => ({ ...o }));
      // Find all active table orders that are not paid
      const tableOrders = updatedOrders.filter(o => o.table === tableName && o.status !== 'Ödendi');
      // Sort oldest first
      tableOrders.sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
        return aTime - bTime;
      });

      let remainingPayment = amount;
      let remainingTip = tipAmount;
      let isFirst = true;

      for (const order of tableOrders) {
        if (remainingPayment <= 0 && remainingTip <= 0) break;

        const currentUnpaid = order.remainingAmount !== undefined ? order.remainingAmount : order.total;
        if (currentUnpaid <= 0 && remainingTip <= 0) continue;

        const recordAmount = Math.min(remainingPayment, Math.max(0, currentUnpaid));
        const orderTip = isFirst ? remainingTip : 0;
        if (isFirst) {
          remainingTip = 0;
          isFirst = false;
        }

        const orderPaidRecord = { method, amount: recordAmount, date: new Date(), tip: orderTip };
        order.payments = [...(order.payments || []), orderPaidRecord];

        if (remainingPayment >= currentUnpaid) {
          order.paidAmount = order.total;
          order.remainingAmount = 0;
          order.status = 'Ödendi' as OrderStatus;
          remainingPayment -= Math.max(0, currentUnpaid);
        } else {
          order.paidAmount = (order.paidAmount || 0) + remainingPayment;
          order.remainingAmount = Math.max(0, currentUnpaid - remainingPayment);
          order.status = 'Ödeme Bekleniyor' as OrderStatus;
          remainingPayment = 0;
        }
      }

      const finalOrders = updatedOrders.map(originalOrder => {
        const updated = tableOrders.find(uo => uo.id === originalOrder.id);
        return updated ? updated : originalOrder;
      });

      saveFallbackOrders(finalOrders);

      const updatedTableOrders = finalOrders.filter(o => o.table === tableName && o.status !== 'Ödendi');
      const isTableFullyPaid = updatedTableOrders.length === 0 || updatedTableOrders.every(o => (o.remainingAmount || 0) <= 0);
      if (isTableFullyPaid) {
        if (tipAmount > 0) {
          toast.success(`Masa hesabı ve ₺${tipAmount.toFixed(2)} bahşiş başarıyla ödendi!`);
        } else {
          toast.success("Masanın tüm hesabı başarıyla ödendi!");
        }
      } else {
        if (tipAmount > 0) {
          toast.success(`₺${amount.toFixed(2)} ödeme ve ₺${tipAmount.toFixed(2)} bahşiş alındı.`);
        } else {
          toast.success(`₺${amount.toFixed(2)} ödeme alındı.`);
        }
      }
      return;
    }

    // Find all active table orders that are not paid
    const tableOrders = orders.filter(o => o.table === tableName && o.status !== 'Ödendi');
    // Sort oldest first
    tableOrders.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return aTime - bTime;
    });

    let remainingPayment = amount;
    let remainingTip = tipAmount;

    try {
      let isFirst = true;
      for (const order of tableOrders) {
        if (remainingPayment <= 0 && remainingTip <= 0) break;

        const currentUnpaid = order.remainingAmount !== undefined ? order.remainingAmount : order.total;
        
        // If the order is already fully paid, but we still have a tip to attach (e.g. they pay tip at the very end),
        // we can still attach the tip to this order's payments list!
        if (currentUnpaid <= 0 && remainingTip <= 0) continue;

        const recordAmount = Math.min(remainingPayment, Math.max(0, currentUnpaid));
        const orderTip = isFirst ? remainingTip : 0;
        if (isFirst) {
          remainingTip = 0;
          isFirst = false;
        }

        const orderPaidRecord = { method, amount: recordAmount, date: new Date(), tip: orderTip };
        const newPayments = [...(order.payments || []), orderPaidRecord];

        if (remainingPayment >= currentUnpaid) {
          const newPaidAmount = order.total;
          await updateDoc(doc(db, 'orders', order.id), {
            paidAmount: newPaidAmount,
            remainingAmount: 0,
            payments: newPayments,
            status: 'Ödendi' as OrderStatus
          });
          remainingPayment -= Math.max(0, currentUnpaid);
        } else {
          const newPaidAmount = (order.paidAmount || 0) + remainingPayment;
          const newRemainingAmount = Math.max(0, currentUnpaid - remainingPayment);
          await updateDoc(doc(db, 'orders', order.id), {
            paidAmount: newPaidAmount,
            remainingAmount: newRemainingAmount,
            payments: newPayments,
            status: 'Ödeme Bekleniyor' as OrderStatus
          });
          remainingPayment = 0;
        }
      }
      
      const updatedTableOrders = orders.filter(o => o.table === tableName && o.status !== 'Ödendi');
      const isTableFullyPaid = updatedTableOrders.length === 0 || updatedTableOrders.every(o => (o.remainingAmount || 0) <= 0);
      if (isTableFullyPaid) {
        if (tipAmount > 0) {
          toast.success(`Masa hesabı ve ₺${tipAmount.toFixed(2)} bahşiş başarıyla ödendi!`);
        } else {
          toast.success("Masanın tüm hesabı başarıyla ödendi!");
        }
      } else {
        if (tipAmount > 0) {
          toast.success(`₺${amount.toFixed(2)} ödeme ve ₺${tipAmount.toFixed(2)} bahşiş alındı.`);
        } else {
          toast.success(`₺${amount.toFixed(2)} ödeme alındı.`);
        }
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders_combined_${tableName}`);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (useLocalFallback) {
      saveFallbackOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
      if (status === 'Hazırlanıyor') {
        playSoundWithSync('preparing');
        toast.info("Sipariş hazırlanıyor");
      } else if (status === 'Hazır') {
        playSoundWithSync('ready');
        toast.success("Sipariş hazır!");
      } else if (status === 'Teslim Edildi') {
        playSoundWithSync('delivered');
        toast("Sipariş teslim edildi");
      }
      return;
    }
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      if (status === 'Hazırlanıyor') {
        playSoundWithSync('preparing');
        toast.info("Sipariş hazırlanıyor");
      } else if (status === 'Hazır') {
        playSoundWithSync('ready');
        toast.success("Sipariş hazır!");
      } else if (status === 'Teslim Edildi') {
        playSoundWithSync('delivered');
        toast("Sipariş teslim edildi");
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (useLocalFallback) {
      saveFallbackOrders(orders.filter(o => o.id !== orderId));
      toast.success("Sipariş silindi");
      return;
    }
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      toast.success("Sipariş silindi");
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `orders/${orderId}`);
    }
  };

  const callWaiter = async (table: string) => {
    const localId = 'call_' + Date.now();
    const newCall = {
      id: localId,
      table,
      time: new Date(),
      resolved: false
    };

    if (useLocalFallback) {
      saveFallbackWaiterCalls([newCall, ...waiterCalls]);
      playSoundWithSync('waiter');
      toast.success("Garsona bildirim gönderildi.");
      return;
    }

    try {
      await addDoc(collection(db, 'waiter_calls'), {
        ...newCall,
        time: serverTimestamp()
      });
      playSoundWithSync('waiter');
      toast.success("Garsona bildirim gönderildi.");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'waiter_calls');
    }
  };

  const resolveWaiterCall = async (id: string) => {
    if (useLocalFallback) {
      saveFallbackWaiterCalls(waiterCalls.map(c => c.id === id ? { ...c, resolved: true } : c));
      return;
    }
    try {
      await updateDoc(doc(db, 'waiter_calls', id), { resolved: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `waiter_calls/${id}`);
    }
  };

  const openTable = async (id: string) => {
    if (useLocalFallback) {
      saveFallbackTables(tables.map(t => t.id === id ? { ...t, isOpen: true, openedAt: new Date() } : t));
      toast.success(`Masa ${id} açıldı.`);
      return;
    }
    try {
      await updateDoc(doc(db, 'tables', id), {
        isOpen: true,
        openedAt: serverTimestamp()
      });
      toast.success(`Masa ${id} açıldı.`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `tables/${id}`);
    }
  };

  const closeTable = async (id: string) => {
    if (useLocalFallback) {
      saveFallbackTables(tables.map(t => t.id === id ? { ...t, isOpen: false, openedAt: null } : t));
      
      const updatedOrders = orders.map(o => o.table === `Masa ${id}` && o.status !== 'Ödendi' ? { ...o, status: 'Ödendi' as OrderStatus } : o);
      saveFallbackOrders(updatedOrders);

      const updatedCalls = waiterCalls.map(c => c.table === `Masa ${id}` && !c.resolved ? { ...c, resolved: true } : c);
      saveFallbackWaiterCalls(updatedCalls);

      toast.success(`Masa ${id} kapatıldı ve hesap kesildi.`);
      return;
    }
    try {
      await updateDoc(doc(db, 'tables', id), {
        isOpen: false,
        openedAt: null
      });
      
      // Mark all active orders for this table as 'Ödendi'
      const tableOrders = orders.filter(o => o.table === `Masa ${id}` && o.status !== 'Ödendi');
      for (const order of tableOrders) {
        await updateDoc(doc(db, 'orders', order.id), {
          status: 'Ödendi'
        });
      }
      
      // Resolve all active waiter calls for this table
      const tableCalls = waiterCalls.filter(c => c.table === `Masa ${id}` && !c.resolved);
      for (const call of tableCalls) {
        await updateDoc(doc(db, 'waiter_calls', call.id), {
          resolved: true
        });
      }
      
      toast.success(`Masa ${id} kapatıldı ve hesap kesildi.`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `tables/${id}`);
    }
  };

  const addStaff = async (staffMember: Omit<Staff, 'id'>) => {
    if (useLocalFallback) {
      const localId = 'staff_' + Date.now();
      saveFallbackStaff([...staff, { ...staffMember, id: localId }]);
      toast.success(`${staffMember.name} personeli başarıyla eklendi!`);
      return;
    }
    try {
      await addDoc(collection(db, 'staff'), staffMember);
      toast.success(`${staffMember.name} personeli başarıyla eklendi!`);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'staff');
    }
  };

  const removeStaff = async (id: string) => {
    if (useLocalFallback) {
      saveFallbackStaff(staff.filter(s => s.id !== id));
      toast.success('Personel başarıyla silindi.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'staff', id));
      toast.success('Personel başarıyla silindi.');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `staff/${id}`);
    }
  };

  const addStockItem = async (item: Omit<StockItem, 'id' | 'lastUpdated'>) => {
    if (useLocalFallback) {
      const localId = 'stock_' + Date.now();
      saveFallbackStock([...stock, { ...item, id: localId, lastUpdated: new Date() }]);
      toast.success(`${item.name} stok kalemi başarıyla eklendi!`);
      return;
    }
    try {
      await addDoc(collection(db, 'stock'), {
        ...item,
        lastUpdated: serverTimestamp()
      });
      toast.success(`${item.name} stok kalemi başarıyla eklendi!`);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'stock');
    }
  };

  const updateStockItem = async (id: string, item: Partial<StockItem>) => {
    if (useLocalFallback) {
      saveFallbackStock(stock.map(s => s.id === id ? { ...s, ...item, lastUpdated: new Date() } : s));
      toast.success('Stok kalemi başarıyla güncellendi.');
      return;
    }
    try {
      await updateDoc(doc(db, 'stock', id), {
        ...item,
        lastUpdated: serverTimestamp()
      });
      toast.success('Stok kalemi başarıyla güncellendi.');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `stock/${id}`);
    }
  };

  const removeStockItem = async (id: string) => {
    if (useLocalFallback) {
      saveFallbackStock(stock.filter(s => s.id !== id));
      toast.success('Stok kalemi başarıyla silindi.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'stock', id));
      toast.success('Stok kalemi başarıyla silindi.');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `stock/${id}`);
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'date'>) => {
    if (useLocalFallback) {
      const localId = 'expense_' + Date.now();
      saveFallbackExpenses([...expenses, { ...expense, id: localId, date: new Date() }]);
      toast.success('Gider kalemi başarıyla eklendi.');
      return;
    }
    try {
      await addDoc(collection(db, 'expenses'), {
        ...expense,
        date: serverTimestamp()
      });
      toast.success('Gider kalemi başarıyla eklendi.');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'expenses');
    }
  };

  const removeExpense = async (id: string) => {
    if (useLocalFallback) {
      saveFallbackExpenses(expenses.filter(e => e.id !== id));
      toast.success('Gider kalemi başarıyla silindi.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'expenses', id));
      toast.success('Gider kalemi başarıyla silindi.');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `expenses/${id}`);
    }
  };

  const addCoupon = async (coupon: Coupon) => {
    const cleanCoupon = {
      ...coupon,
      id: coupon.id.toUpperCase(),
      expiryDate: coupon.expiryDate ? coupon.expiryDate : null
    };
    if (useLocalFallback) {
      saveFallbackCoupons([...coupons.filter(c => c.id !== cleanCoupon.id), cleanCoupon]);
      toast.success(`${cleanCoupon.id} kuponu başarıyla eklendi!`);
      return;
    }
    try {
      await setDoc(doc(db, 'coupons', cleanCoupon.id), cleanCoupon);
      toast.success(`${cleanCoupon.id} kuponu başarıyla eklendi!`);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `coupons/${coupon.id}`);
    }
  };

  const toggleCouponStatus = async (id: string, isActive: boolean) => {
    if (useLocalFallback) {
      saveFallbackCoupons(coupons.map(c => c.id === id ? { ...c, isActive } : c));
      toast.success(`Kupon ${isActive ? 'aktif' : 'pasif'} hale getirildi.`);
      return;
    }
    try {
      await updateDoc(doc(db, 'coupons', id), { isActive });
      toast.success(`Kupon ${isActive ? 'aktif' : 'pasif'} hale getirildi.`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `coupons/${id}`);
    }
  };

  const removeCoupon = async (id: string) => {
    if (useLocalFallback) {
      saveFallbackCoupons(coupons.filter(c => c.id !== id));
      toast.success('Kupon başarıyla silindi.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'coupons', id));
      toast.success('Kupon başarıyla silindi.');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `coupons/${id}`);
    }
  };

  return (
    <CartContext.Provider
      value={{
        useLocalFallback,
        setUseLocalFallback,
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
        placeWaiterOrder,
        addPaymentToOrder,
        addPaymentToTableOrders,
        updateOrderStatus,
        deleteOrder,
        callWaiter,
        waiterCalls,
        resolveWaiterCall,
        tables,
        openTable,
        closeTable,
        staff,
        addStaff,
        removeStaff,
        stock,
        addStockItem,
        updateStockItem,
        removeStockItem,
        expenses,
        addExpense,
        removeExpense,
        coupons,
        addCoupon,
        toggleCouponStatus,
        removeCoupon
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
