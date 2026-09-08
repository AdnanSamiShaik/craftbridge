import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, doc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { getMockUser, setMockUser } from "../lib/auth";

export default function CustomerMarketplace() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [aiMatchedIds, setAiMatchedIds] = useState<string[] | null>(null);
  const [category, setCategory] = useState("All");
  const [wishlist, setWishlist] = useState<string[]>([]);

  const user = getMockUser();
  const isBuyer = user?.role === "buyer";
  const isCustomer = user?.role === "customer";

  
  const handlePlaceOrder = async () => {
    if (!orderAddress.trim() || !user || !selectedProductForOrder) return;
    setOrderLoading(true);
    try {
      const orderId = crypto.randomUUID();
      await setDoc(doc(db, "orders", orderId), {
        productId: selectedProductForOrder.id,
        productName: selectedProductForOrder.titleEn,
        customerId: user.uid,
        customerName: user.displayName || "Customer",
        artisanId: selectedProductForOrder.artisanId,
        address: orderAddress,
        status: "placed",
        price: selectedProductForOrder.price,
        createdAt: Date.now()
      });
      alert("Order placed successfully!");
      setShowOrderModal(false);
      setSelectedProductForOrder(null);
      setOrderAddress("");
    } catch(e) {
      console.error(e);
      alert("Failed to place order.");
    }
    setOrderLoading(false);
  };

  const categories = ["All", "Terracotta", "Handloom", "Brass", "Woodcraft", "Jute"];

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prodData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(prodData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "products");
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    setMockUser(null);
    navigate("/login");
  };

  
  
  const filteredProducts = products.filter(p => {
    if (aiMatchedIds) {
      return aiMatchedIds.includes(p.id);
    }
    const matchSearch = p.titleEn.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || (p.titleEn.toLowerCase().includes(category.toLowerCase()));
    return matchSearch && matchCat;
  });



  const toggleWishlist = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    setWishlist(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const [showChat, setShowChat] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState<any>(null);
  const [orderAddress, setOrderAddress] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [chatHistory, setChatHistory] = useState<{role: string, message: string, products?: any[]}[]>([]);
  const [interactionId, setInteractionId] = useState<string | null>(null);
  
  const handleSendChat = async () => {
    if (!chatMessage.trim()) return;
    const msg = chatMessage;
    setChatMessage("");
    setChatHistory(prev => [...prev, { role: "user", message: msg }]);
    setChatLoading(true);
    
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: msg, 
          previousInteractionId: interactionId,
          user: user,
          products: products
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.details || data.error || "Failed to process chat");
      }
      
      setInteractionId(data.interactionId);
      setChatHistory(prev => [...prev, { role: "assistant", message: data.message, products: data.products }]);
      
      if (data.action && data.action.type === "create_enquiry_batch") {
        import("firebase/firestore").then(async ({ doc, setDoc, writeBatch }) => {
          try {
            const batch = writeBatch(db);
            const payloads = data.action.payloads || [];
            
            payloads.forEach((payload: any) => {
              const enquiryId = crypto.randomUUID();
              const ref = doc(db, "enquiries", enquiryId);
              batch.set(ref, {
                buyerId: user?.uid,
                buyerName: user?.displayName || "Buyer",
                ...payload,
                status: "pending",
                source: "ai_chat",
                createdAt: Date.now()
              });
            });
            
            await batch.commit();
            alert(`Enquiry sent successfully to ${payloads.length} artisan(s)!`);
          } catch (e) {
            console.error("Firestore error", e);
          }
        });
      }
      
    } catch (e) {
      console.error(e);
      if (String(e).includes('429') || String(e).toLowerCase().includes('quota')) {
        setChatHistory(prev => [...prev, { role: "assistant", message: "I am receiving too many requests. Please wait a moment before trying again." }]);
      } else {
        setChatHistory(prev => [...prev, { role: "assistant", message: "Sorry, I encountered an error connecting to the server." }]);
      }
    } finally {
      setChatLoading(false);
    }
  };


  


  return (
    <div className="flex flex-col flex-1 bg-surface pt-safe pb-28">
      <header className="fixed top-0 w-full max-w-7xl mx-auto z-50 pt-safe bg-surface/90 backdrop-blur shadow-sm border-b border-outline-variant/20">
        <div className="h-16 px-gutter-mobile flex items-center justify-between">
          <h1 className="font-title-lg text-primary font-bold">Craft Bridge</h1>
          <div className="flex gap-4 text-on-surface">
            <span className="material-symbols-outlined text-[24px]">favorite</span>
            <span className="material-symbols-outlined text-[24px]">local_mall</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full pt-20 flex flex-col gap-space-lg pb-4">
        {/* Search */}
        <div className="px-gutter-mobile">
          <div className="flex-1 flex items-center bg-surface-container-low rounded-xl px-space-sm h-14 shadow-sm border border-outline-variant/30 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            <span className="material-symbols-outlined text-outline text-[24px]">search</span>
            <input 
              type="text" 
              placeholder="Search pottery, sarees, brass..." 
              value={search}
              onChange={e => { setSearch(e.target.value); setAiMatchedIds(null); }}
              className="w-full bg-transparent px-space-sm font-body-lg focus:outline-none placeholder:text-on-surface-variant/70" 
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-col space-y-space-sm">
          <div className="px-gutter-mobile flex items-center justify-between">
            <span className="font-headline-sm text-on-surface font-bold">Explore Traditions</span>
          </div>
          <div className="flex gap-space-sm overflow-x-auto px-gutter-mobile pb-2 no-scrollbar scroll-smooth">
            {categories.map((cat) => (
              <button 
                key={cat} 
                onClick={() => { setCategory(cat); setAiMatchedIds(null); }}
                className={`flex items-center gap-1 px-5 py-2.5 rounded-full shrink-0 shadow-sm transition-colors border ${category === cat ? "bg-primary text-on-primary border-primary" : "bg-surface-container-lowest text-on-surface border-outline-variant/30 hover:bg-surface-container-low"}`}
              >
                 <span className="font-label-md font-semibold">{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="px-gutter-mobile flex flex-col gap-space-sm">
           <h2 className="font-headline-sm text-on-surface font-bold">Verified Creations</h2>
           
           {filteredProducts.length === 0 ? (
             <div className="text-center py-12 text-on-surface-variant font-body-md bg-surface-container-lowest rounded-xl border border-outline-variant/30">
               No products found in this category.
             </div>
           ) : (
             <div className="grid grid-cols-2 gap-space-sm">
                {filteredProducts.map(product => (
                  <div key={product.id} onClick={() => navigate(`/customer/product/${product.id}`)} className="w-full bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm flex flex-col cursor-pointer border border-outline-variant/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                     <div className="relative h-44">
                       <img src={product.imageUrl || "https://placehold.co/400?text=No+Image"} alt={product.titleEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                       <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-surface-container-lowest/95 backdrop-blur text-tertiary font-label-sm text-[10px] font-bold shadow-sm flex items-center gap-1">
                         <span className="material-symbols-outlined text-[12px]">verified</span> {product.score || 95} Score
                       </div>
                       <button onClick={(e) => toggleWishlist(e, product.id)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-surface-container-lowest/80 backdrop-blur flex items-center justify-center text-on-surface shadow-sm hover:bg-surface-container-lowest transition-colors">
                         <span className={`material-symbols-outlined text-[18px] ${wishlist.includes(product.id) ? "fill-current text-primary" : ""}`} style={wishlist.includes(product.id) ? {fontVariationSettings: "'FILL' 1"} : {}}>favorite</span>
                       </button>
                     </div>
                     <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                        <div>
                          <span className="font-label-sm text-on-surface-variant text-[11px] uppercase tracking-wide font-semibold">{product.artisanName || "Artisan"}</span>
                          <p className="font-title-md text-on-surface mt-1 line-clamp-2 leading-snug">{product.titleEn}</p>
                        </div>
                        <div className="mt-auto flex items-center justify-between">
                          <span className="font-headline-sm text-primary font-bold">₹{product.price}</span>
                          {!isBuyer && <button 
                            className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center hover:bg-primary-fixed-dim transition-colors"
                            onClick={(e) => { e.stopPropagation(); setSelectedProductForOrder(product); setShowOrderModal(true); }}
                          >
                            <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                          </button>}
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      </main>

      <nav className="fixed bottom-0 w-full max-w-7xl mx-auto z-40 pb-safe bg-surface/80 backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.04)] border-t border-outline-variant/30">
        <div className="flex justify-around items-center h-[72px] px-2 relative">
          
          <button className="flex flex-col items-center justify-center text-primary p-2 w-16 hover:scale-105 transition-transform duration-200">
            <span className="material-symbols-outlined text-[28px] mb-1">home</span>
            <span className="font-label-sm text-[11px] font-bold">Home</span>
          </button>
          
          <button className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors p-2 w-16">
            <span className="material-symbols-outlined text-[28px] mb-1">category</span>
            <span className="font-label-sm text-[11px]">Explore</span>
          </button>
          
          {/* Floating Chat Button for Buyers */}
          <button 
            onClick={() => setShowChat(true)}
            className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-tr from-primary to-[#7b4dff] text-white rounded-full shadow-[0_8px_20px_rgba(123,77,255,0.3)] flex items-center justify-center active:scale-95 hover:scale-105 hover:shadow-[0_12px_24px_rgba(123,77,255,0.4)] transition-all duration-300 border-4 border-surface"
          >
            <span className="material-symbols-outlined text-[28px] animate-pulse">auto_awesome</span>
          </button>

          <button className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors p-2 w-16">
            <span className="material-symbols-outlined text-[28px] mb-1">favorite</span>
            <span className="font-label-sm text-[11px]">Wishlist</span>
          </button>
          <button onClick={handleLogout} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors p-2 w-16">
            <span className="material-symbols-outlined text-[28px] mb-1">person</span>
            <span className="font-label-sm text-[11px]">Profile</span>
          </button>
        </div>
      </nav>

      {/* AI Chatbot Modal for Buyers */}
      {showChat && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-gutter-mobile w-full max-w-7xl mx-auto pointer-events-auto">
          <div className="bg-surface w-full max-w-md sm:rounded-3xl rounded-t-3xl p-gutter-mobile pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-bottom-8 duration-300 border border-outline-variant/10">
            <div className="flex items-center justify-between mb-4 border-b border-outline-variant/20 pb-4">
               <div>
                 <h3 className="font-headline-sm font-bold text-on-surface flex items-center gap-2">
                   <span className="material-symbols-outlined text-primary">smart_toy</span> AI Sourcing Assistant
                 </h3>
                 <p className="font-body-sm text-on-surface-variant">Describe your bulk requirements</p>
               </div>
               <button onClick={() => {setShowChat(false); setChatHistory([]); setInteractionId(null);}} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                 <span className="material-symbols-outlined">close</span>
               </button>
            </div>

            
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 max-h-[60vh]">
              {chatHistory.length === 0 && (
                <div className="text-center text-on-surface-variant my-8">
                  <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">smart_toy</span>
                  <p>Hi! I'm your Sourcing Assistant.</p>
                  <p className="text-sm">I can help you find products or request quotes.</p>
                </div>
              )}
              {chatHistory.map((chat, idx) => (
                <div key={idx} className={`flex flex-col gap-2 ${chat.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-2xl max-w-[85%] ${chat.role === 'user' ? 'bg-primary text-on-primary rounded-tr-sm' : 'bg-surface-container text-on-surface rounded-tl-sm'}`}>
                    {chat.message}
                  </div>
                  {chat.products && chat.products.length > 0 && (
                    <div className="w-full flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                      {chat.products.map(p => (
                        <div key={p.id} onClick={() => { setShowChat(false); navigate(`/customer/product/${p.id}`); }} className="min-w-[140px] max-w-[140px] bg-surface rounded-xl overflow-hidden shadow-sm border border-outline-variant/30 shrink-0 cursor-pointer snap-start">
                          <img src={p.imageUrl || "https://placehold.co/400?text=No+Image"} className="w-full h-24 object-cover" />
                          <div className="p-2">
                            <p className="text-xs font-bold truncate">{p.titleEn}</p>
                            <p className="text-[10px] text-on-surface-variant truncate">{p.artisanName}</p>
                            <p className="text-xs font-bold text-primary mt-1">₹{p.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-start gap-2">
                  <div className="p-4 bg-surface-container rounded-2xl rounded-tl-sm flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{animationDelay: '0ms'}}></span>
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{animationDelay: '150ms'}}></span>
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{animationDelay: '300ms'}}></span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-outline-variant/20 bg-surface">
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                  placeholder={isBuyer ? "I need 500 baskets..." : "Find me a terracotta vase..."}
                  className="flex-1 p-4 rounded-full bg-surface-container-lowest border border-outline-variant/30 focus:border-[#7b4dff] focus:ring-1 outline-none font-body-lg shadow-inner"
                />
                <button 
                  onClick={handleSendChat}
                  disabled={chatLoading}
                  className="w-14 h-14 shrink-0 rounded-full bg-gradient-to-tr from-primary to-[#7b4dff] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>


          </div>
        </div>
      )}

      {/* Order Modal for Customer */}
      {showOrderModal && selectedProductForOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-gutter-mobile w-full max-w-7xl mx-auto pointer-events-auto">
          <div className="bg-surface w-full max-w-md sm:rounded-3xl rounded-t-3xl p-gutter-mobile pb-safe shadow-2xl flex flex-col animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex items-center justify-between mb-4 border-b border-outline-variant/20 pb-4">
               <div>
                 <h3 className="font-headline-sm font-bold text-on-surface">Place Order</h3>
                 <p className="font-body-sm text-on-surface-variant">For {selectedProductForOrder.titleEn}</p>
               </div>
               <button onClick={() => {setShowOrderModal(false); setSelectedProductForOrder(null);}} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                 <span className="material-symbols-outlined">close</span>
               </button>
            </div>
            <div className="flex flex-col gap-4">
              <textarea 
                value={orderAddress}
                onChange={e => setOrderAddress(e.target.value)}
                placeholder="Enter your full delivery address..."
                className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 focus:border-[#7b4dff] focus:ring-2 focus:ring-[#7b4dff]/20 outline-none font-body-lg min-h-[140px] resize-none shadow-inner transition-all"
              />
              <button 
                onClick={handlePlaceOrder}
                disabled={orderLoading}
                className="h-14 bg-gradient-to-r from-primary to-[#7b4dff] text-white rounded-2xl font-title-md font-bold shadow-[0_4px_14px_rgba(123,77,255,0.3)] hover:shadow-[0_6px_20px_rgba(123,77,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {orderLoading ? <span className="material-symbols-outlined animate-spin">sync</span> : <>Confirm Order (₹{selectedProductForOrder.price})</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
