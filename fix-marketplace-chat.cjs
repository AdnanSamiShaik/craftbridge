const fs = require('fs');
let code = fs.readFileSync('src/components/CustomerMarketplace.tsx', 'utf-8');

// Replace state
const newStates = `
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
      
      setInteractionId(data.interactionId);
      setChatHistory(prev => [...prev, { role: "assistant", message: data.message, products: data.products }]);
      
      if (data.action && data.action.type === "create_enquiry") {
        import("firebase/firestore").then(async ({ doc, setDoc }) => {
          try {
            const enquiryId = crypto.randomUUID();
            await setDoc(doc(db, "enquiries", enquiryId), {
              buyerId: user?.uid,
              buyerName: user?.displayName || "Buyer",
              ...data.action.payload,
              status: "pending",
              source: "ai_chat",
              createdAt: Date.now()
            });
            alert("Enquiry sent successfully to " + data.action.payload.artisanName + "!");
          } catch (e) {
            console.error("Firestore error", e);
          }
        });
      }
      
    } catch (e) {
      console.error(e);
      setChatHistory(prev => [...prev, { role: "assistant", message: "Sorry, I encountered an error connecting to the server." }]);
    } finally {
      setChatLoading(false);
    }
  };
`;
code = code.replace(/const \[chatMessage, setChatMessage\] = useState\(""\);\n  const \[chatLoading, setChatLoading\] = useState\(false\);\n  const \[extractedReqs, setExtractedReqs\] = useState<any>\(null\);/, 
  'const [chatMessage, setChatMessage] = useState("");\n  const [chatLoading, setChatLoading] = useState(false);\n' + newStates);

// Remove old functions
code = code.replace(/const handleCustomerAiSearch = async \(\) => \{[\s\S]*?setAiSearchLoading\(false\);\n  \};\n\n/, '');
code = code.replace(/const handleSendChat = async \(\) => \{[\s\S]*?\}\n      \}\n    \}\);\n  \};/g, '');

const chatUI = `
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 max-h-[60vh]">
              {chatHistory.length === 0 && (
                <div className="text-center text-on-surface-variant my-8">
                  <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">smart_toy</span>
                  <p>Hi! I'm your Sourcing Assistant.</p>
                  <p className="text-sm">I can help you find products or request quotes.</p>
                </div>
              )}
              {chatHistory.map((chat, idx) => (
                <div key={idx} className={\`flex flex-col gap-2 \${chat.role === 'user' ? 'items-end' : 'items-start'}\`}>
                  <div className={\`p-3 rounded-2xl max-w-[85%] \${chat.role === 'user' ? 'bg-primary text-on-primary rounded-tr-sm' : 'bg-surface-container text-on-surface rounded-tl-sm'}\`}>
                    {chat.message}
                  </div>
                  {chat.products && chat.products.length > 0 && (
                    <div className="w-full flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                      {chat.products.map(p => (
                        <div key={p.id} onClick={() => { setShowChat(false); navigate(\`/customer/product/\${p.id}\`); }} className="min-w-[140px] max-w-[140px] bg-surface rounded-xl overflow-hidden shadow-sm border border-outline-variant/30 shrink-0 cursor-pointer snap-start">
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
`;
code = code.replace(/\{isBuyer \? \([\s\S]*?<\/button>\n              <\/div>\n            \)\}/, chatUI);

// Remove the setExtractedReqs import/clear
code = code.replace(/setExtractedReqs\(null\);/g, "setChatHistory([]); setInteractionId(null);");

fs.writeFileSync('src/components/CustomerMarketplace.tsx', code);
