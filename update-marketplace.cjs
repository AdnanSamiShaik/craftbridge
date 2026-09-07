const fs = require('fs');
let code = fs.readFileSync('src/components/CustomerMarketplace.tsx', 'utf-8');

code = code.replace(
  'const user = getMockUser();',
  'const user = getMockUser();\n  const isBuyer = user?.role === "buyer";\n  const isCustomer = user?.role === "customer";'
);

code = code.replace(
  'const [showChat, setShowChat] = useState(false);',
  'const [showChat, setShowChat] = useState(false);\n  const [showOrderModal, setShowOrderModal] = useState(false);\n  const [selectedProductForOrder, setSelectedProductForOrder] = useState<any>(null);\n  const [orderAddress, setOrderAddress] = useState("");\n  const [orderLoading, setOrderLoading] = useState(false);\n  const [aiSearchLoading, setAiSearchLoading] = useState(false);'
);

const handlePlaceOrder = `
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
`;
code = code.replace('const categories = ["All", "Terracotta", "Handloom", "Brass", "Woodcraft", "Jute"];', handlePlaceOrder + '\n  const categories = ["All", "Terracotta", "Handloom", "Brass", "Woodcraft", "Jute"];');

const aiSearchLogic = `
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
          setSearch(data.matched_ids.join(","));
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
`;
code = code.replace('const handleSendChat = async () => {', aiSearchLogic + '\n  const handleSendChat = async () => {');

// Fix the filteredProducts logic to support AI search by IDs
const filteredProductsReplace = `
  const filteredProducts = products.filter(p => {
    if (search.includes(",") && search.split(",").includes(p.id)) return true; // AI matched ids
    if (search.includes(",") && !search.split(",").includes(p.id)) return false;
    
    const matchSearch = p.titleEn.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || (p.titleEn.toLowerCase().includes(category.toLowerCase()));
    return matchSearch && matchCat;
  });
`;
code = code.replace(/const filteredProducts = products\.filter[\s\S]*?return matchSearch && matchCat;\n  \}\);/g, filteredProductsReplace);


// Handle cart button visibility and action
code = code.replace(
  /onClick=\{\(e\) => \{ e\.stopPropagation\(\); alert\("Added to cart"\); \}\}/g,
  `onClick={(e) => { e.stopPropagation(); setSelectedProductForOrder(product); setShowOrderModal(true); }}`
);

// Conditionally render add to cart button based on !isBuyer
code = code.replace(
  '<button \n                            className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center hover:bg-primary-fixed-dim transition-colors"\n                            onClick={(e) => { e.stopPropagation(); setSelectedProductForOrder(product); setShowOrderModal(true); }}\n                          >',
  '{!isBuyer && <button \n                            className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center hover:bg-primary-fixed-dim transition-colors"\n                            onClick={(e) => { e.stopPropagation(); setSelectedProductForOrder(product); setShowOrderModal(true); }}\n                          >'
);
code = code.replace(
  /<span className="material-symbols-outlined text-\[20px\]">add_shopping_cart<\/span>\n                          <\/button>/g,
  '<span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>\n                          </button>}'
);


// Conditionally render chatbot modal contents based on isBuyer vs isCustomer
const chatModalReplace = `
            {isBuyer ? (
            extractedReqs ? (
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-primary-fixed/20 rounded-xl border border-primary/20">
                  <h4 className="font-title-md font-bold mb-2">Requirement Summary</h4>
                  <ul className="font-body-md flex flex-col gap-1">
                    <li><strong>Product:</strong> {extractedReqs.product || "Not specified"}</li>
                    <li><strong>Quantity:</strong> {extractedReqs.quantity || "Not specified"}</li>
                    <li><strong>Budget:</strong> {extractedReqs.budget ? \`₹\${extractedReqs.budget}\` : "Not specified"}</li>
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
`;

code = code.replace(/\{extractedReqs \? \([\s\S]*?<\/button>\n              <\/div>\n            \)\}/g, chatModalReplace);

const orderModal = `
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
`;

code = code.replace('    </div>\n  );\n}', orderModal + '    </div>\n  );\n}');

fs.writeFileSync('src/components/CustomerMarketplace.tsx', code);
