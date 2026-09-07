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
  const [extractedReqs, setExtractedReqs] = useState<any>(null);

  
  const handleCustomerAiSearch = async () => {
    if (!chatMessage.trim()) return;
    setAiSearchLoading(true);
    try {
      const res = await fetch("/api/ai/search-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatMessage, products: products })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.matched_ids && data.matched_ids.length > 0) {
          // just show those products
          setAiMatchedIds(data.matched_ids);
          setShowChat(false);
        } else {
          alert("No matching products found.");
        }
      }
    } catch(e) {
      console.error(e);
    }
    setAiSearchLoading(false);
  };

  const handleSendChat = async () => {
    if (!chatMessage.trim()) return;
    setChatLoading(true);
    try {
      const res = await fetch("/api/ai/extract-requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatMessage })
      });
      const data = await res.json();
      setExtractedReqs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setChatLoading(false);
    }
  };

  const confirmEnquiry = async () => {
    import("firebase/firestore").then(async ({ doc, setDoc }) => {
      if (!extractedReqs || !user) return;
      try {
        const enquiryId = crypto.randomUUID();
        await setDoc(doc(db, "enquiries", enquiryId), {
          buyerId: user.uid,
          buyerName: user.displayName || "Buyer",
          productName: extractedReqs.product || "Unknown Product",
          quantity: extractedReqs.quantity || 1,
          budget: extractedReqs.budget || null,
          location: extractedReqs.location || null,
          message: extractedReqs.custom_requirements || chatMessage,
          status: "pending",
          isBulk: extractedReqs.is_bulk || false,
          createdAt: Date.now()
        });
        alert("Enquiry broadcasted to relevant artisans!");
        setShowChat(false);
        setExtractedReqs(null);
        setChatMessage("");
      } catch (error) {
        console.error(error);
      }
    });
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
                  <div key={product.id} onClick={() => navigate(`/customer/product/${product.id}`)} className="w-full bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm flex flex-col cursor-pointer border border-outline-variant/30 hover:shadow-md transition-shadow">
                     <div className="relative h-44">
                       <img src={product.imageUrl || "https://placehold.co/400?text=No+Image"} alt={product.titleEn} className="w-full h-full object-cover" />
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

      <nav className="fixed bottom-0 w-full max-w-7xl mx-auto z-40 pb-safe bg-surface/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)] border-t border-outline-variant/20">
        <div className="flex justify-around items-center h-[72px] px-2 relative">
          
          <button className="flex flex-col items-center justify-center text-primary p-2 w-16">
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
            className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform border-4 border-surface"
          >
            <span className="material-symbols-outlined text-[28px]">smart_toy</span>
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
          <div className="bg-surface w-full max-w-md sm:rounded-3xl rounded-t-3xl p-gutter-mobile pb-safe shadow-2xl flex flex-col animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex items-center justify-between mb-4 border-b border-outline-variant/20 pb-4">
               <div>
                 <h3 className="font-headline-sm font-bold text-on-surface flex items-center gap-2">
                   <span className="material-symbols-outlined text-primary">smart_toy</span> AI Sourcing Assistant
                 </h3>
                 <p className="font-body-sm text-on-surface-variant">Describe your bulk requirements</p>
               </div>
               <button onClick={() => {setShowChat(false); setExtractedReqs(null);}} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                 <span className="material-symbols-outlined">close</span>
               </button>
            </div>

            
            {isBuyer ? (
            extractedReqs ? (
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-primary-fixed/20 rounded-xl border border-primary/20">
                  <h4 className="font-title-md font-bold mb-2">Requirement Summary</h4>
                  <ul className="font-body-md flex flex-col gap-1">
                    <li><strong>Product:</strong> {extractedReqs.product || "Not specified"}</li>
                    <li><strong>Quantity:</strong> {extractedReqs.quantity || "Not specified"}</li>
                    <li><strong>Budget:</strong> {extractedReqs.budget ? `₹${extractedReqs.budget}` : "Not specified"}</li>
                    <li><strong>Location:</strong> {extractedReqs.location || "Not specified"}</li>
                  </ul>
                  <p className="mt-2 text-sm italic border-t border-primary/20 pt-2">{extractedReqs.custom_requirements || "No custom details"}</p>
                </div>
                <button onClick={confirmEnquiry} className="h-14 bg-primary text-on-primary rounded-xl font-title-md font-bold shadow-md">
                  Broadcast to Artisans
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <textarea 
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  placeholder="e.g., I need 500 handmade baskets under ₹2 lakh for Hyderabad by next month."
                  className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-1 outline-none font-body-lg min-h-[120px] resize-none"
                />
                <button 
                  onClick={handleSendChat}
                  disabled={chatLoading}
                  className="h-14 bg-primary text-on-primary rounded-xl font-title-md font-bold shadow-md flex items-center justify-center gap-2"
                >
                  {chatLoading ? <span className="material-symbols-outlined animate-spin">sync</span> : <>Extract Requirements <span className="material-symbols-outlined">auto_awesome</span></>}
                </button>
              </div>
            )
            ) : (
              <div className="flex flex-col gap-4">
                <textarea 
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  placeholder="e.g., Find me a red terracotta vase under ₹2000"
                  className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-1 outline-none font-body-lg min-h-[120px] resize-none"
                />
                <button 
                  onClick={handleCustomerAiSearch}
                  disabled={aiSearchLoading}
                  className="h-14 bg-primary text-on-primary rounded-xl font-title-md font-bold shadow-md flex items-center justify-center gap-2"
                >
                  {aiSearchLoading ? <span className="material-symbols-outlined animate-spin">sync</span> : <>Search Product <span className="material-symbols-outlined">search</span></>}
                </button>
              </div>
            )}

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
                className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-1 outline-none font-body-lg min-h-[120px] resize-none"
              />
              <button 
                onClick={handlePlaceOrder}
                disabled={orderLoading}
                className="h-14 bg-primary text-on-primary rounded-xl font-title-md font-bold shadow-md flex items-center justify-center gap-2"
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
