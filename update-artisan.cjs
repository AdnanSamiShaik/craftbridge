const fs = require('fs');
let code = fs.readFileSync('src/components/ArtisanAddProduct.tsx', 'utf-8');
code = code.replace(
  'const [price, setPrice] = useState(2199);',
  `const [price, setPrice] = useState(2199);
  const [suggestedRange, setSuggestedRange] = useState("₹1,950 — ₹2,350");
  const [recommendedPrice, setRecommendedPrice] = useState("₹2,199");
  const [pricingLoading, setPricingLoading] = useState(false);
  const generatePricing = async () => {
    setPricingLoading(true);
    try {
      const res = await fetch("/api/ai/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: catalog?.category || "Handicraft", material: catalog?.material || "Clay", raw_material_cost: 500, labour_cost: 300, packaging_cost: 100 })
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestedRange("₹" + data.suggested_minimum + " — ₹" + data.suggested_maximum);
        setRecommendedPrice("₹" + data.recommended_starting_price);
        setPrice(data.recommended_starting_price);
        setPayout(Math.round(data.recommended_starting_price * 0.795));
      }
    } catch(e) { console.error(e); }
    setPricingLoading(false);
  };`
);
code = code.replace(
  '<button onClick={() => setStep(5)} className="w-full h-14 bg-primary text-on-primary rounded-xl font-title-md font-bold mt-6 shadow-md flex items-center justify-center gap-2">',
  `<button onClick={() => { setStep(5); generatePricing(); }} className="w-full h-14 bg-primary text-on-primary rounded-xl font-title-md font-bold mt-6 shadow-md flex items-center justify-center gap-2">`
);
code = code.replace(
  '<p className="font-display-lg text-primary font-bold mt-1">₹1,950 — ₹2,350</p>',
  `<p className="font-display-lg text-primary font-bold mt-1">{pricingLoading ? "..." : suggestedRange}</p>`
);
code = code.replace(
  '<span className="font-headline-sm text-on-primary-fixed font-bold block leading-tight">₹2,199</span>',
  `<span className="font-headline-sm text-on-primary-fixed font-bold block leading-tight">{pricingLoading ? "..." : recommendedPrice}</span>`
);
fs.writeFileSync('src/components/ArtisanAddProduct.tsx', code);
