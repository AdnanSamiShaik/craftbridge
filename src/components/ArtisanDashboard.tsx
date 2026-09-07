import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { getMockUser, setMockUser } from "../lib/auth";

export default function ArtisanDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"products" | "enquiries">("products");
  
  const user = getMockUser();

  useEffect(() => {
    if (!user) return;
    
    // Fetch Products
    const qProducts = query(collection(db, "products"), where("artisanId", "==", user.uid));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, "products"));

    // Fetch Enquiries
    const qEnquiries = query(collection(db, "enquiries"), where("artisanId", "==", user.uid));
    const unsubEnquiries = onSnapshot(qEnquiries, (snapshot) => {
      setEnquiries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => b.createdAt - a.createdAt));
    }, (error) => handleFirestoreError(error, OperationType.GET, "enquiries"));

    return () => {
      unsubProducts();
      unsubEnquiries();
    };
  }, [user]);

  const handleLogout = () => {
    setMockUser(null);
    navigate("/login");
  };

  const markEnquiryResponded = async (id: string) => {
    try {
      await updateDoc(doc(db, "enquiries", id), { status: "responded" });
    } catch (e) {
      console.error(e);
    }
  };

  const pendingEnquiries = enquiries.filter(e => e.status === "pending").length;
  const score = enquiries.length > 0 ? Math.max(50, 100 - (pendingEnquiries * 5)) : 98;

  return (
    <div className="flex flex-col flex-1 bg-surface pt-safe pb-28">
      <header className="fixed top-0 w-full max-w-7xl mx-auto z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-sm border-b border-outline-variant/20">
        <div className="h-16 px-gutter-mobile flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-headline-sm text-primary leading-tight tracking-tight">Craft Bridge</span>
            <span className="font-label-sm text-on-surface-variant">Artisan Dashboard</span>
          </div>
          <div className="flex items-center gap-space-xs">
             <button className="px-space-xs py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm">हिंदी / EN</button>
             <div className="w-8 h-8 rounded-full bg-surface-container overflow-hidden flex items-center justify-center text-on-surface-variant">
                 <span className="material-symbols-outlined">person</span>
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full pt-16 px-gutter-mobile flex flex-col gap-space-md pb-6">
        {/* Offline Status */}
        <div className="flex items-center justify-between px-space-md py-space-xs rounded-full bg-surface-container shadow-sm mt-4">
          <div className="flex items-center gap-space-xs">
             <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-tertiary"></span>
             </span>
             <span className="font-label-sm text-on-surface truncate">All drafts saved offline. Auto-sync active.</span>
          </div>
          <span className="material-symbols-outlined text-tertiary text-[20px]">cloud_done</span>
        </div>

        {/* Welcome */}
        <div className="rounded-xl p-space-md bg-surface-container-low shadow-sm flex flex-col gap-space-xs">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-md text-primary font-bold">Namaste, {user?.displayName?.split(" ")[0] || "Artisan"}</span>
                <span className="px-space-xs py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm">नमस्ते</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-on-surface-variant font-body-sm">
                <span className="material-symbols-outlined text-[18px] text-primary">verified</span>
                <span className="font-medium">Verified Artisan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Score */}
        <div className="rounded-xl p-space-md bg-surface-container-lowest shadow-md flex flex-col gap-space-sm border border-outline-variant/20">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-on-surface-variant uppercase tracking-wider">Seller Response Score</span>
          </div>
          <div className="flex items-center gap-space-md">
            <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
               <svg className="w-20 h-20 -rotate-90" viewBox="0 0 96 96">
                <circle cx="48" cy="48" fill="transparent" r="40" stroke="#f4ece8" strokeWidth="8"></circle>
                <circle cx="48" cy="48" fill="transparent" r="40" stroke="#2a674c" strokeDasharray="251.2" strokeDashoffset={`${251.2 - (251.2 * score) / 100}`} strokeLinecap="round" strokeWidth="8"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-headline-md text-tertiary font-bold leading-none">{score}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="inline-flex items-center gap-1.5 px-space-xs py-1 rounded-md bg-secondary-fixed text-on-secondary-fixed font-label-sm font-bold w-max">
                <span className="material-symbols-outlined text-[16px] text-secondary">bolt</span> 
                {score > 90 ? "Excellent Response" : score > 75 ? "Good Response" : "Needs Improvement"}
              </div>
              <p className="font-body-md text-on-surface font-semibold">
                {pendingEnquiries > 0 ? `${pendingEnquiries} pending enquiries to answer.` : "Usually responds in 1.5 hrs"}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-surface-container-high p-1 rounded-lg mt-2">
          <button 
            onClick={() => setActiveTab("products")}
            className={`flex-1 py-2 font-label-md rounded-md transition-colors ${activeTab === "products" ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant"}`}
          >
            My Products
          </button>
          <button 
            onClick={() => setActiveTab("enquiries")}
            className={`flex-1 py-2 font-label-md rounded-md transition-colors flex items-center justify-center gap-2 ${activeTab === "enquiries" ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant"}`}
          >
            Enquiries
            {pendingEnquiries > 0 && (
              <span className="bg-error text-on-error text-[10px] px-1.5 py-0.5 rounded-full">{pendingEnquiries}</span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "products" ? (
          <div className="flex flex-col gap-space-sm">
             {products.length === 0 ? (
               <div className="rounded-xl p-space-md bg-surface-container-lowest shadow-sm text-center font-body-sm text-on-surface-variant border border-outline-variant/30">
                 You haven't listed any products yet. Tap + Add Product below.
               </div>
             ) : (
               <div className="flex flex-col gap-2">
                 {products.map(product => (
                   <div key={product.id} className="rounded-xl p-2 bg-surface-container-lowest shadow-sm flex items-center gap-3 border border-outline-variant/30">
                     <img src={product.imageUrl || "https://placehold.co/100"} className="w-16 h-16 rounded-lg object-cover" />
                     <div className="flex flex-col flex-1">
                       <span className="font-title-md font-bold line-clamp-1">{product.titleEn}</span>
                       <span className="font-headline-sm text-primary">₹{product.price}</span>
                     </div>
                     <button className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                       <span className="material-symbols-outlined">edit</span>
                     </button>
                   </div>
                 ))}
               </div>
             )}
          </div>
        ) : (
          <div className="flex flex-col gap-space-sm">
             {enquiries.length === 0 ? (
               <div className="rounded-xl p-space-md bg-surface-container-lowest shadow-sm text-center font-body-sm text-on-surface-variant border border-outline-variant/30">
                 No buyer enquiries yet.
               </div>
             ) : (
               <div className="flex flex-col gap-3">
                 {enquiries.map(enquiry => (
                   <div key={enquiry.id} className="rounded-xl p-space-md bg-surface-container-lowest shadow-md flex flex-col gap-2 border border-outline-variant/30">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="font-title-md font-bold">{enquiry.buyerName || "Customer"}</span>
                          <span className="font-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[14px]">schedule</span> 
                            {new Date(enquiry.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {enquiry.status === "pending" ? (
                          <span className="px-2 py-0.5 bg-error-container text-on-error-container font-label-sm font-bold rounded">New</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed font-label-sm font-bold rounded">Responded</span>
                        )}
                      </div>
                      <div className="p-2 bg-surface-container rounded-lg mt-1">
                         <span className="font-label-sm font-bold text-on-surface block mb-1">Product: {enquiry.productName || "Product"}</span>
                         <span className="font-body-sm text-on-surface-variant block">Qty: {enquiry.quantity || 1}</span>
                         <span className="font-body-md text-on-surface mt-2 block border-t border-outline-variant/20 pt-2">{enquiry.message}</span>
                      </div>
                      {enquiry.status === "pending" && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                           <button onClick={() => markEnquiryResponded(enquiry.id)} className="h-12 bg-primary text-on-primary rounded-lg font-label-md flex items-center justify-center gap-1 shadow-sm">
                             <span className="material-symbols-outlined">call</span> Call Buyer
                           </button>
                           <button onClick={() => markEnquiryResponded(enquiry.id)} className="h-12 bg-surface-container-high text-on-surface rounded-lg font-label-md flex items-center justify-center gap-1">
                             <span className="material-symbols-outlined">check</span> Mark Done
                           </button>
                        </div>
                      )}
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}

      </main>

      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <button onClick={() => navigate("/artisan/add")} className="min-h-[52px] px-space-lg rounded-full bg-primary text-on-primary font-label-lg flex items-center gap-space-xs shadow-lg active:scale-95 transition-all">
          <span className="material-symbols-outlined">add_circle</span> + Add Product
        </button>
      </div>

      <nav className="fixed bottom-0 w-full max-w-7xl mx-auto z-40 pb-safe bg-surface/90 backdrop-blur shadow-[0_-2px_12px_rgba(0,0,0,0.04)] border-t border-outline-variant/20">
        <div className="flex justify-around items-center h-16 px-space-2xs">
          <button className="flex flex-col items-center justify-center text-primary p-2">
            <span className="material-symbols-outlined">cottage</span>
            <span className="font-label-sm text-[10px]">Home</span>
          </button>
          <button className="flex flex-col items-center justify-center text-on-surface-variant p-2">
            <span className="material-symbols-outlined">category</span>
            <span className="font-label-sm text-[10px]">Products</span>
          </button>
          <div className="w-12"></div>
          <button onClick={() => setActiveTab("enquiries")} className="flex flex-col items-center justify-center text-on-surface-variant p-2 relative">
            <span className="material-symbols-outlined">mark_chat_unread</span>
            <span className="font-label-sm text-[10px]">Enquiries</span>
            {pendingEnquiries > 0 && <div className="absolute top-1 right-2 w-2 h-2 rounded-full bg-error"></div>}
          </button>
          <button onClick={handleLogout} className="flex flex-col items-center justify-center text-on-surface-variant p-2">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-sm text-[10px]">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
