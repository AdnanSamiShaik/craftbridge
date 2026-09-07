import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, handleFirestoreError, OperationType, auth } from "../lib/firebase";

export default function CustomerMarketplace() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [wishlist, setWishlist] = useState<string[]>([]);

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
    auth.signOut().then(() => navigate("/login"));
  };

  const filteredProducts = products.filter(p => {
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

  return (
    <div className="flex flex-col flex-1 bg-surface pt-safe pb-28">
      <header className="fixed top-0 w-full max-w-[480px] z-50 pt-safe bg-surface/90 backdrop-blur shadow-sm border-x border-outline-variant/20">
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
              onChange={e => setSearch(e.target.value)}
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
                onClick={() => setCategory(cat)}
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
                          <button 
                            className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center hover:bg-primary-fixed-dim transition-colors"
                            onClick={(e) => { e.stopPropagation(); alert("Added to cart"); }}
                          >
                            <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                          </button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      </main>

      <nav className="fixed bottom-0 w-full max-w-[480px] z-40 pb-safe bg-surface/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)] border-t border-outline-variant/20 border-x">
        <div className="flex justify-around items-center h-[72px] px-2">
          <button className="flex flex-col items-center justify-center text-primary p-2 w-16">
            <span className="material-symbols-outlined text-[28px] mb-1">home</span>
            <span className="font-label-sm text-[11px] font-bold">Home</span>
          </button>
          <button className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors p-2 w-16">
            <span className="material-symbols-outlined text-[28px] mb-1">category</span>
            <span className="font-label-sm text-[11px]">Explore</span>
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
    </div>
  );
}
