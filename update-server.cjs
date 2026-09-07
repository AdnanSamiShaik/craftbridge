const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace(/gemini-2\.5-flash/g, 'gemini-3.6-flash');
const newEndpoint = `
app.post("/api/ai/search-products", express.json(), async (req, res) => {
  try {
    const { message, products } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: \`Given the user query: "\${message}", find the best matching products from this list: \${JSON.stringify(products)}. Return a JSON object with a key 'matched_ids' containing an array of string product IDs that best match.\` }]
        }
      ],
      config: { responseMimeType: "application/json" }
    });
    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to search products" });
  }
});
`;
code = code.replace('async function startServer', newEndpoint + '\nasync function startServer');
fs.writeFileSync('server.ts', code);
