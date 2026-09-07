import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { getMockUser } from "../lib/auth";

export default function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const user = getMockUser();
  const isBuyer = user?.role === "buyer";
  const isCustomer = user?.role === "customer";

  // Enquiry Form State
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [orderAddress, setOrderAddress] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const productRef = doc(db, "products", id);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          setProduct({ id: productSnap.id, ...productSnap.data() });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `products/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  
  const handleOrder = async () => {
    if (!product || !user || !orderAddress.trim()) return;
    setIsSubmitting(true);
    try {
      const orderId = crypto.randomUUID();
      await setDoc(doc(db, "orders", orderId), {
        productId: product.id,
        productName: product.titleEn,
        customerId: user.uid,
        customerName: user.displayName || "Customer",
        artisanId: product.artisanId,
        address: orderAddress,
        quantity: quantity,
        price: product.price,
        status: "placed",
        createdAt: Date.now()
      });
      setEnquirySent(true); // Re-use the success state
      setShowOrder(false);
    } catch (error) {
      console.error(error);
      alert("Failed to place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnquiry = async () => {
    if (!product || !user) return;
    setIsSubmitting(true);
    try {
      const enquiryId = crypto.randomUUID();
      await setDoc(doc(db, "enquiries", enquiryId), {
        productId: product.id,
        productName: product.titleEn,
        buyerId: user.uid,
        buyerName: user.displayName || "Customer",
        artisanId: product.artisanId,
        message: message || "I am interested in this product.",
        quantity: quantity,
        status: "pending",
        createdAt: Date.now()
      });
      setEnquirySent(true);
      setShowEnquiry(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `enquiries`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex-1 bg-surface flex items-center justify-center font-title-md min-h-screen">Loading...</div>;
  }

  if (!product) {
    return <div className="flex-1 bg-surface flex items-center justify-center font-title-md text-error min-h-screen">Product not found.</div>;
  }

  return (
    <div className="flex flex-col flex-1 bg-surface pb-safe relative">
      <header className="fixed top-0 w-full max-w-7xl mx-auto z-50 pt-safe bg-transparent pointer-events-none border-b border-outline-variant/0">
        <div className="h-16 px-gutter-mobile flex items-center justify-between pointer-events-auto">
          <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-full bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center text-on-surface shadow-sm">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex gap-3">
            <button className="w-11 h-11 rounded-full bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center text-on-surface shadow-sm">
              <span className="material-symbols-outlined text-[24px]">favorite</span>
            </button>
            <button className="w-11 h-11 rounded-full bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center text-on-surface shadow-sm">
              <span className="material-symbols-outlined text-[24px]">share</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full pb-28 flex flex-col">
        {/* Product Image */}
        <div className="w-full h-[50vh] relative">
          <img src={product.imageUrl || "https://placehold.co/800?text=No+Image"} alt={product.titleEn} className="w-full h-full object-cover" />
          <div className="absolute bottom-6 left-0 w-full h-24 bg-gradient-to-t from-surface to-transparent"></div>
        </div>

        {/* Details */}
        <div className="bg-surface -mt-8 rounded-t-3xl p-gutter-mobile relative z-10 flex flex-col gap-space-lg">
           
           <div>
             <span className="font-label-sm text-secondary tracking-wider uppercase font-bold bg-secondary-fixed text-on-secondary-fixed px-2 py-1 rounded-md">Handcrafted</span>
             <h1 className="font-headline-lg text-on-surface mt-3 font-bold leading-tight">{product.titleEn}</h1>
             <div className="mt-3 font-display-lg text-primary text-4xl font-bold">₹{product.price}</div>
           </div>

           <div className="p-4 bg-surface-container-low rounded-2xl flex items-center gap-4 border border-outline-variant/30 shadow-sm">
             <div className="w-14 h-14 rounded-full bg-surface-container overflow-hidden flex items-center justify-center text-on-surface-variant border-2 border-surface">
               <span className="material-symbols-outlined text-[32px]">person</span>
             </div>
             <div className="flex flex-col flex-1">
               <span className="font-title-lg font-bold">{product.artisanName || "Artisan"}</span>
               <span className="font-label-md text-on-surface-variant flex items-center gap-1 mt-0.5"><span className="material-symbols-outlined text-[16px]">location_on</span> Verified Maker</span>
             </div>
             <div className="flex flex-col items-end">
               <span className="bg-tertiary-fixed text-on-tertiary-fixed px-2.5 py-1 rounded-lg font-label-sm font-bold flex items-center gap-1 shadow-sm border border-tertiary/20">
                 <span className="material-symbols-outlined text-[16px]">verified</span> {product.score || 95} Score
               </span>
               <span className="font-body-sm text-[11px] text-on-surface-variant mt-1.5 font-medium">Responds in ~2 hrs</span>
             </div>
           </div>

           <div className="flex flex-col gap-3">
             <h2 className="font-title-lg font-bold text-on-surface">Craft Story</h2>
             <p className="font-body-lg text-on-surface-variant leading-relaxed">
               {product.desc}
             </p>
           </div>
        </div>
      </main>

      {/* Fixed bottom action */}
      <div className="fixed bottom-0 w-full max-w-7xl mx-auto bg-surface/95 backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.08)] p-gutter-mobile pb-safe z-40 border-t border-outline-variant/20">
        {enquirySent ? (
          <button 
            disabled
            className="w-full h-14 bg-surface-container-high text-primary rounded-xl font-title-md font-bold flex items-center justify-center gap-2 border border-primary/20"
          >
            <span className="material-symbols-outlined text-[24px]">check_circle</span> Enquiry Sent Successfully
          </button>
        ) : (
          <button 
            onClick={() => setShowEnquiry(true)}
            className="w-full h-14 bg-primary text-on-primary rounded-xl font-title-md font-bold flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 transition-colors active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[24px]">chat</span> Send Direct Enquiry
          </button>
        )}
      </div>

      
      {/* Order Modal */}
      {showOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-gutter-mobile w-full max-w-7xl mx-auto pointer-events-auto">
          <div className="bg-surface w-full max-w-md sm:rounded-3xl rounded-t-3xl p-gutter-mobile pb-safe shadow-2xl flex flex-col animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex items-center justify-between mb-4 border-b border-outline-variant/20 pb-4">
               <div>
                 <h3 className="font-headline-sm font-bold text-on-surface">Place Order</h3>
                 <p className="font-body-sm text-on-surface-variant">Deliver to your address</p>
               </div>
               <button onClick={() => setShowOrder(false)} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                 <span className="material-symbols-outlined">close</span>
               </button>
            </div>
            
            <div className="flex flex-col gap-4">
               <div>
                 <label className="font-label-md font-bold text-on-surface-variant block mb-1">Quantity</label>
                 <div className="flex items-center gap-3">
                   <button type="button" onClick={() => setQuantity(String(Math.max(1, parseInt(quantity||"1") - 1)))} className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center">-</button>
                   <div className="flex-1 h-12 flex items-center justify-center font-title-lg bg-surface-container-low rounded-xl border border-outline-variant/30">{quantity}</div>
                   <button type="button" onClick={() => setQuantity(String(parseInt(quantity||"1") + 1))} className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center">+</button>
                 </div>
               </div>
               <div>
                 <label className="font-label-md font-bold text-on-surface-variant block mb-1">Delivery Address</label>
                 <textarea 
                   value={orderAddress}
                   onChange={e => setOrderAddress(e.target.value)}
                   rows={3} 
                   className="w-full bg-surface-container-low p-3.5 rounded-xl font-body-lg border border-outline-variant/30 focus:border-primary outline-none resize-none" 
                   placeholder="Enter your full address..."
                 />
               </div>
               
               <button 
                 onClick={handleOrder}
                 disabled={isSubmitting}
                 className="w-full h-14 bg-primary text-on-primary rounded-xl font-title-md font-bold mt-2 shadow-md flex items-center justify-center gap-2"
               >
                 {isSubmitting ? <span className="material-symbols-outlined animate-spin">sync</span> : "Confirm Order"}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Enquiry Modal */}
      {showEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-gutter-mobile w-full max-w-7xl mx-auto pointer-events-auto">
          <div className="bg-surface w-full rounded-t-3xl sm:rounded-3xl p-gutter-mobile pb-safe shadow-2xl flex flex-col gap-space-md animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-headline-sm font-bold text-on-surface">Send Enquiry</h3>
              <button onClick={() => setShowEnquiry(false)} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md font-bold text-on-surface">Quantity Required</label>
                <select 
                  value={quantity} 
                  onChange={e => setQuantity(e.target.value)}
                  className="h-14 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-lg"
                >
                  <option value="1">1 piece (Retail)</option>
                  <option value="5">5 pieces</option>
                  <option value="10">10+ pieces (Wholesale)</option>
                  <option value="50">50+ pieces (Bulk)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md font-bold text-on-surface">Message to Artisan</label>
                <textarea 
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Ask about customization, delivery time, or bulk pricing..."
                  className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-lg min-h-[120px] resize-none"
                />
              </div>

              <button 
                onClick={handleEnquiry}
                disabled={isSubmitting}
                className="w-full h-14 bg-primary text-on-primary rounded-xl font-title-md font-bold flex items-center justify-center gap-2 mt-4 shadow-md"
              >
                {isSubmitting ? (
                  <span className="material-symbols-outlined animate-spin">sync</span>
                ) : (
                  "Submit Enquiry"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
