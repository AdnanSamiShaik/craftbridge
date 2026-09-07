const fs = require('fs');
let code = fs.readFileSync('src/components/ProductDetail.tsx', 'utf-8');

code = code.replace(
  'const user = getMockUser();',
  'const user = getMockUser();\n  const isBuyer = user?.role === "buyer";\n  const isCustomer = user?.role === "customer";'
);

code = code.replace(
  'const [enquirySent, setEnquirySent] = useState(false);',
  'const [enquirySent, setEnquirySent] = useState(false);\n  const [showOrder, setShowOrder] = useState(false);\n  const [orderAddress, setOrderAddress] = useState("");'
);

const handleOrder = `
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
`;
code = code.replace('const handleEnquiry = async () => {', handleOrder + '\n  const handleEnquiry = async () => {');

// Replace the primary CTA button
const primaryCTA = `
          {enquirySent ? (
            <button disabled className="h-[60px] flex-1 bg-surface-container-highest text-on-surface rounded-2xl font-title-lg font-bold flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[24px]">check_circle</span> {isCustomer ? "Order Placed" : "Enquiry Sent"}
            </button>
          ) : (
            isCustomer ? (
              <button 
                onClick={() => setShowOrder(true)}
                className="h-[60px] flex-1 bg-primary text-on-primary rounded-2xl font-title-lg font-bold shadow-lg flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[24px]">shopping_cart_checkout</span> Buy Now
              </button>
            ) : (
              <button 
                onClick={() => setShowEnquiry(true)}
                className="h-[60px] flex-1 bg-primary text-on-primary rounded-2xl font-title-lg font-bold shadow-lg flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[24px]">chat</span> Send Direct Enquiry
              </button>
            )
          )}
`;
code = code.replace(/\{enquirySent \? \([\s\S]*?<\/button>\n          \)\}/g, primaryCTA);

// Add the order modal
const orderModal = `
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
`;
code = code.replace('{/* Enquiry Modal */}', orderModal + '\n      {/* Enquiry Modal */}');

fs.writeFileSync('src/components/ProductDetail.tsx', code);
