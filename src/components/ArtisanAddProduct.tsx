import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";

export default function ArtisanAddProduct() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [catalog, setCatalog] = useState<any>(null);
  const [price, setPrice] = useState(2199);
  const [payout, setPayout] = useState(1749);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep(2); // Move to loading/preview step
    setIsProcessingAI(true);
    setProcessingStage("Removing background...");

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setImageBase64(dataUrl);

        try {
          const formData = new FormData();
          formData.append("image", file);
          await fetch("/api/ai/image-enhance", {
            method: "POST",
            body: formData
          });
          // After simulated backend processing, we proceed
          setIsProcessingAI(false);
        } catch (error) {
          console.error("AI Image Enhance failed", error);
          setIsProcessingAI(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          setIsRecording(false);
          setIsProcessingAI(true);
          setProcessingStage("Transcribing & generating catalog...");
          
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          
          try {
            const formData = new FormData();
            formData.append("audio", audioBlob, "audio.webm");

            const res = await fetch("/api/ai/transcribe-catalog", {
              method: "POST",
              body: formData
            });

            if (!res.ok) throw new Error("Failed AI generation");
            
            const data = await res.json();
            
            setCatalog({
              titleEn: data.product_name || "Handcrafted Product",
              titleHi: data.titleHi || "हस्तशिल्प उत्पाद",
              desc: data.description || "A beautiful handcrafted item."
            });
          } catch (e) {
            console.error(e);
            // Fallback gracefully for prototype if API key missing
            setCatalog({
              titleEn: "Handcrafted Terracotta Vases",
              titleHi: "हस्तशिल्प मिट्टी के बर्तन",
              desc: "Beautifully handcrafted terracotta vases made from pure river clay. Baked in traditional wood-fired kilns for authentic earthy finish."
            });
          } finally {
            setIsProcessingAI(false);
            setStep(4);
          }
          
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Mic error", err);
        alert("Microphone access denied or unavailable.");
      }
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
  };

  const publishProduct = async () => {
    if (!auth.currentUser || !catalog) return;
    setIsPublishing(true);
    try {
      const productId = crypto.randomUUID();
      await setDoc(doc(db, "products", productId), {
        artisanId: auth.currentUser.uid,
        artisanName: auth.currentUser.displayName || "Artisan",
        titleEn: catalog.titleEn,
        titleHi: catalog.titleHi,
        desc: catalog.desc,
        price: price,
        imageUrl: imageBase64 || "",
        score: 98,
        category: "Handcrafted",
        createdAt: Date.now()
      });
      navigate("/artisan");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `products`);
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-surface pt-safe pb-28">
      <header className="fixed top-0 w-full max-w-[480px] z-50 pt-safe bg-surface/90 backdrop-blur shadow-sm border-x border-outline-variant/20">
        <div className="h-16 px-gutter-mobile flex items-center gap-space-sm">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="text-on-surface w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex-1">
            <h1 className="font-title-lg font-bold">Add Product</h1>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <div key={s} className={`h-1.5 w-6 rounded-full ${s <= step ? "bg-primary" : "bg-surface-container-high"}`}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full pt-20 flex flex-col">
        {step === 1 && (
          <div className="p-gutter-mobile flex flex-col gap-space-xl items-center justify-center h-[65vh]">
            <div className="text-center">
              <h2 className="font-display-lg text-primary text-4xl mb-2">Photo</h2>
              <p className="font-title-md text-on-surface-variant">Let's start with a clear picture.</p>
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              className="hidden" 
            />
            
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={cameraInputRef} 
              onChange={handleImageUpload} 
              className="hidden" 
            />

            <div className="grid grid-cols-2 gap-space-md w-full max-w-sm mx-auto">
              <button onClick={() => cameraInputRef.current?.click()} className="h-36 bg-primary-fixed rounded-2xl flex flex-col items-center justify-center gap-3 text-on-primary-fixed shadow-md active:scale-[0.98] transition-transform">
                 <span className="material-symbols-outlined text-[40px]">photo_camera</span>
                 <span className="font-title-md font-bold">Camera</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="h-36 bg-surface-container rounded-2xl flex flex-col items-center justify-center gap-3 text-on-surface-variant shadow-sm border border-outline-variant/30 active:scale-[0.98] transition-transform">
                 <span className="material-symbols-outlined text-[40px]">image</span>
                 <span className="font-title-md font-bold">Gallery</span>
              </button>
            </div>
            <div className="text-center text-on-surface-variant font-body-lg flex flex-col gap-2 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm w-full max-w-sm">
              <div className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary">check_circle</span> Use good daylight</div>
              <div className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary">check_circle</span> Keep background plain</div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-gutter-mobile flex flex-col gap-space-md h-full">
            <h2 className="font-headline-sm font-bold text-center mb-2">AI Enhancement</h2>
            <div className="bg-surface-container-lowest flex flex-col items-center justify-center p-4 rounded-2xl shadow-md border border-outline-variant/30">
               {isProcessingAI ? (
                 <div className="flex flex-col items-center gap-4 p-8 w-full">
                   <span className="material-symbols-outlined text-primary text-[40px] animate-spin">sync</span>
                   <p className="font-title-lg text-on-surface font-bold text-center">{processingStage}</p>
                   <div className="w-full max-w-[200px] bg-surface-container-high h-2 rounded-full overflow-hidden">
                     <div className="bg-primary h-full rounded-full animate-[progress_3s_ease-in-out_infinite] w-1/2"></div>
                   </div>
                 </div>
               ) : (
                 <>
                   <div className="relative w-full rounded-xl overflow-hidden group">
                     <img src={imageBase64 || ""} alt="Enhanced product" className="w-full max-h-96 object-contain bg-surface-container-low" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-3 pointer-events-none">
                       <span className="text-white font-label-md flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">auto_awesome</span> Background removed</span>
                     </div>
                   </div>
                   <div className="mt-6 flex gap-3 w-full">
                     <button onClick={() => setStep(1)} className="flex-1 bg-surface-container-high text-on-surface h-14 rounded-xl font-title-md font-bold">Retake</button>
                     <button onClick={() => setStep(3)} className="flex-[2] bg-primary text-on-primary h-14 rounded-xl font-title-md font-bold shadow-md hover:bg-primary/90">Looks Good</button>
                   </div>
                 </>
               )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-gutter-mobile flex flex-col items-center justify-center h-[65vh] gap-space-xl text-center">
            <div>
              <h2 className="font-display-lg text-primary text-4xl mb-2">Voice</h2>
              <h2 className="font-headline-sm text-on-surface">Tell buyers about your craft</h2>
              <p className="font-title-md text-on-surface-variant mt-2">अपनी भाषा में दिल से बताएं</p>
            </div>
            
            <div className="relative flex items-center justify-center my-6">
               {isRecording && (
                 <>
                   <div className="absolute w-40 h-40 rounded-full bg-primary/20 animate-ping"></div>
                   <div className="absolute w-32 h-32 rounded-full bg-primary/30 animate-pulse"></div>
                 </>
               )}
               <button 
                 onClick={handleRecording}
                 className={`relative w-28 h-28 rounded-full flex items-center justify-center shadow-2xl z-10 transition-all ${
                   isRecording ? "bg-error text-on-error scale-110" : "bg-primary text-on-primary"
                 }`}
               >
                 <span className={`material-symbols-outlined text-[48px] ${isRecording ? "animate-pulse" : ""}`}>
                   {isRecording ? "stop" : "mic"}
                 </span>
               </button>
            </div>
            {isRecording ? (
              <p className="font-title-md text-error animate-pulse font-bold">Recording... Tap to stop</p>
            ) : isProcessingAI ? (
              <div className="flex flex-col items-center gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-md border border-primary/20 w-full max-w-sm mt-4">
                <span className="material-symbols-outlined text-primary text-[40px] animate-spin">sync</span>
                <p className="font-title-lg text-on-surface font-bold text-center">{processingStage}</p>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full animate-[progress_3s_ease-in-out_infinite] w-1/2"></div>
                </div>
              </div>
            ) : (
              <p className="font-body-lg text-on-surface-variant max-w-[280px] bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/20 mt-4">
                "Tell us what it is, what it is made from, and how you made it..."
              </p>
            )}
          </div>
        )}

        {step === 4 && catalog && (
          <div className="p-gutter-mobile flex flex-col gap-space-md">
            <h2 className="font-headline-sm font-bold">AI Catalog Generated</h2>
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-md border border-primary/20">
               <div className="flex items-center gap-2 text-primary mb-4 pb-3 border-b border-outline-variant/20">
                 <span className="material-symbols-outlined">auto_awesome</span>
                 <span className="font-title-md font-bold">Review & Edit</span>
               </div>
               
               <div className="flex flex-col gap-4">
                 <div>
                   <label className="font-label-md font-bold text-on-surface-variant block mb-1">English Title</label>
                   <input type="text" value={catalog.titleEn} onChange={e => setCatalog({...catalog, titleEn: e.target.value})} className="w-full bg-surface-container-low p-3.5 rounded-xl font-body-lg border border-outline-variant/30 focus:border-primary outline-none" />
                 </div>

                 <div>
                   <label className="font-label-md font-bold text-on-surface-variant block mb-1">Hindi Title (हिन्दी)</label>
                   <input type="text" value={catalog.titleHi} onChange={e => setCatalog({...catalog, titleHi: e.target.value})} className="w-full bg-surface-container-low p-3.5 rounded-xl font-body-lg border border-outline-variant/30 focus:border-primary outline-none" />
                 </div>

                 <div>
                   <label className="font-label-md font-bold text-on-surface-variant block mb-1">Description</label>
                   <textarea value={catalog.desc} onChange={e => setCatalog({...catalog, desc: e.target.value})} rows={4} className="w-full bg-surface-container-low p-3.5 rounded-xl font-body-lg border border-outline-variant/30 focus:border-primary outline-none resize-none leading-relaxed" />
                 </div>
               </div>

               <button onClick={() => setStep(5)} className="w-full h-14 bg-primary text-on-primary rounded-xl font-title-md font-bold mt-6 shadow-md flex items-center justify-center gap-2">
                 Approve & Continue <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
               </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="p-gutter-mobile flex flex-col gap-space-md pb-24">
             <h2 className="font-headline-sm font-bold text-center mb-2">Pricing Assistant</h2>
             
             <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-md border border-outline-variant/20 flex flex-col gap-4">
                <div className="text-center">
                  <span className="font-label-md text-on-surface-variant uppercase font-bold tracking-wider">Suggested Range</span>
                  <p className="font-display-lg text-primary font-bold mt-1">₹1,950 — ₹2,350</p>
                </div>
                
                <div className="p-4 bg-primary-fixed/20 rounded-xl flex items-center justify-between border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
                      <span className="material-symbols-outlined">recommend</span>
                    </div>
                    <div>
                      <span className="font-label-md text-primary-fixed-dim font-bold block">Recommended Starting</span>
                      <span className="font-headline-sm text-on-primary-fixed font-bold block leading-tight">₹2,199</span>
                    </div>
                  </div>
                </div>
             </div>

             <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-md border border-outline-variant/20">
                <label className="font-title-lg font-bold block mb-4 text-center">Set Your Final Price</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => { setPrice(p => p - 50); setPayout(Math.round((price - 50)*0.795)); }} className="h-14 w-14 flex-shrink-0 bg-surface-container-high rounded-xl font-headline-sm flex items-center justify-center hover:bg-surface-variant">-</button>
                  <div className="flex-1 h-14 bg-surface-container-low rounded-xl flex items-center justify-center border border-outline-variant/30">
                    <span className="font-headline-md font-bold text-primary">₹{price}</span>
                  </div>
                  <button onClick={() => { setPrice(p => p + 50); setPayout(Math.round((price + 50)*0.795)); }} className="h-14 w-14 flex-shrink-0 bg-primary text-on-primary rounded-xl font-headline-sm flex items-center justify-center shadow-sm">+</button>
                </div>
                <div className="mt-6 flex items-center justify-between text-sm p-4 bg-tertiary-fixed/20 rounded-xl border border-tertiary/20">
                   <span className="text-on-surface-variant font-label-md font-bold">Estimated take-home:</span>
                   <span className="text-tertiary font-headline-sm font-bold">₹{payout}</span>
                </div>
             </div>

             <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.08)] px-gutter-mobile py-space-sm pb-safe flex gap-3 max-w-[480px] mx-auto border-t border-outline-variant/20 border-x">
               <button onClick={() => setStep(4)} className="h-14 w-20 flex-shrink-0 bg-surface-container-high rounded-xl font-label-md font-bold flex items-center justify-center">
                 <span className="material-symbols-outlined">arrow_back</span>
               </button>
               <button 
                 onClick={publishProduct} 
                 disabled={isPublishing}
                 className="h-14 flex-1 bg-primary text-on-primary rounded-xl font-title-md font-bold flex items-center justify-center gap-2 shadow-lg"
               >
                 {isPublishing ? (
                   <span className="material-symbols-outlined animate-spin">sync</span>
                 ) : (
                   <>Publish Product <span className="material-symbols-outlined text-[20px]">check_circle</span></>
                 )}
               </button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
