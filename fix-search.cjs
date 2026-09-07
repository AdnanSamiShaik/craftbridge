const fs = require('fs');
let code = fs.readFileSync('src/components/CustomerMarketplace.tsx', 'utf-8');

code = code.replace(
  'const [search, setSearch] = useState("");',
  'const [search, setSearch] = useState("");\n  const [aiMatchedIds, setAiMatchedIds] = useState<string[] | null>(null);'
);

code = code.replace(
  'setSearch(data.matched_ids.join(","));',
  'setAiMatchedIds(data.matched_ids);'
);

const newFilterLogic = `
  const filteredProducts = products.filter(p => {
    if (aiMatchedIds) {
      return aiMatchedIds.includes(p.id);
    }
    const matchSearch = p.titleEn.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || (p.titleEn.toLowerCase().includes(category.toLowerCase()));
    return matchSearch && matchCat;
  });
`;
code = code.replace(/const filteredProducts = products\.filter[\s\S]*?return matchSearch && matchCat;\n  \}\);/g, newFilterLogic);

// also clear aiMatchedIds when user types in regular search or changes category
code = code.replace(
  'onChange={e => setSearch(e.target.value)}',
  'onChange={e => { setSearch(e.target.value); setAiMatchedIds(null); }}'
);
code = code.replace(
  /onClick=\{\(\) => setCategory\(cat\)\}/g,
  'onClick={() => { setCategory(cat); setAiMatchedIds(null); }}'
);

fs.writeFileSync('src/components/CustomerMarketplace.tsx', code);
