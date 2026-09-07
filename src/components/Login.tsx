import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { setMockUser } from "../lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const [view, setView] = useState<"lang" | "login" | "register">("lang");
  const [language, setLanguage] = useState("en");
  const [role, setRole] = useState<"artisan" | "customer" | "buyer">("artisan");
  const [loading, setLoading] = useState(false);

  // Form states
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleAuth = async (isRegister: boolean) => {
    if (!mobile || !password) return alert("Please fill in your mobile and password.");
    if (isRegister && password !== confirmPassword) return alert("Passwords do not match.");
    if (password.length < 6) return alert("Password must be at least 6 characters.");

    setLoading(true);

    try {
      if (isRegister) {
        // Check if user already exists
        const q = query(collection(db, "users"), where("phone", "==", mobile));
        const snap = await getDocs(q);
        if (!snap.empty) {
          alert("An account with this mobile number already exists. Please login instead.");
          setView("login");
          setLoading(false);
          return;
        }

        const uid = crypto.randomUUID();
        const userData = {
          phone: mobile,
          password: password, // Note: plain text password purely for this prototype bypass
          name: name || "User",
          role: role,
          language: language,
          createdAt: Date.now()
        };

        // Save directly to firestore
        await setDoc(doc(db, "users", uid), userData);
        
        // Save to local auth state
        setMockUser({ 
          uid, 
          email: `${mobile}@craftbridge.app`, 
          displayName: userData.name,
          role: userData.role
        });

        navigate(role === "artisan" ? "/artisan" : "/customer");
      } else {
        // Login by querying firestore
        const q = query(
          collection(db, "users"), 
          where("phone", "==", mobile), 
          where("password", "==", password)
        );
        const snap = await getDocs(q);
        
        if (snap.empty) {
          alert("Invalid mobile number or password.");
        } else {
          const userDoc = snap.docs[0];
          const userData = userDoc.data();
          
          setMockUser({ 
            uid: userDoc.id, 
            email: `${userData.phone}@craftbridge.app`, 
            displayName: userData.name,
            role: userData.role
          });
          
          navigate(userData.role === "artisan" ? "/artisan" : "/customer");
        }
      }
    } catch (error: any) {
      console.error("Auth failed:", error);
      alert(error.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  if (view === "lang") {
    return (
      <div className="min-h-screen flex flex-col bg-surface items-center justify-center p-gutter-mobile">
        <div className="w-full max-w-sm rounded-2xl p-space-xl bg-surface-container-lowest shadow-lg flex flex-col gap-space-lg border border-outline-variant/20 text-center">
          <h1 className="font-display-lg text-primary text-4xl">Craft Bridge</h1>
          <p className="font-title-md text-on-surface-variant">Select Your Language</p>
          <div className="flex flex-col gap-3 mt-4">
            <button onClick={() => { setLanguage("en"); setView("login"); }} className="h-14 rounded-xl bg-primary text-on-primary font-title-md shadow-sm active:scale-95 transition-transform">English</button>
            <button onClick={() => { setLanguage("hi"); setView("login"); }} className="h-14 rounded-xl bg-surface-container-high text-on-surface font-title-md shadow-sm active:scale-95 transition-transform">हिन्दी (Hindi)</button>
            <button onClick={() => { setLanguage("te"); setView("login"); }} className="h-14 rounded-xl bg-surface-container-high text-on-surface font-title-md shadow-sm active:scale-95 transition-transform">తెలుగు (Telugu)</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface items-center justify-center p-gutter-mobile">
      <div className="w-full max-w-sm rounded-2xl p-space-xl bg-surface-container-lowest shadow-lg flex flex-col gap-space-md border border-outline-variant/20">
        <div className="text-center mb-2">
          <h1 className="font-display-lg text-primary text-3xl">Craft Bridge</h1>
          <p className="font-title-sm text-on-surface-variant">{view === "login" ? "Welcome Back" : "Create Account"}</p>
        </div>

        <div className="flex flex-col gap-4">
          {view === "register" && (
            <>
              <div className="flex bg-surface-container-low rounded-lg p-1">
                <button onClick={() => setRole("artisan")} className={`flex-1 py-2 rounded-md font-label-md transition-colors ${role === "artisan" ? "bg-primary text-on-primary shadow" : "text-on-surface-variant"}`}>Artisan</button>
                <button onClick={() => setRole("customer")} className={`flex-1 py-2 rounded-md font-label-md transition-colors ${role === "customer" ? "bg-primary text-on-primary shadow" : "text-on-surface-variant"}`}>Customer</button>
                <button onClick={() => setRole("buyer")} className={`flex-1 py-2 rounded-md font-label-md transition-colors ${role === "buyer" ? "bg-primary text-on-primary shadow" : "text-on-surface-variant"}`}>Bulk Buyer</button>
              </div>
              <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="h-14 px-4 rounded-xl bg-surface-container-low border border-outline-variant/50 focus:border-primary outline-none" />
            </>
          )}

          <input type="tel" placeholder="Mobile Number" value={mobile} onChange={e => setMobile(e.target.value)} className="h-14 px-4 rounded-xl bg-surface-container-low border border-outline-variant/50 focus:border-primary outline-none" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="h-14 px-4 rounded-xl bg-surface-container-low border border-outline-variant/50 focus:border-primary outline-none" />
          
          {view === "register" && (
            <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="h-14 px-4 rounded-xl bg-surface-container-low border border-outline-variant/50 focus:border-primary outline-none" />
          )}

          <button 
            onClick={() => handleAuth(view === "register")}
            disabled={loading}
            className="h-14 rounded-xl bg-primary text-on-primary font-title-md shadow-md active:scale-95 transition-transform mt-2 flex items-center justify-center gap-2"
          >
            {loading ? <span className="material-symbols-outlined animate-spin">sync</span> : (view === "login" ? "Login" : "Register")}
          </button>
          
          <button onClick={() => setView(view === "login" ? "register" : "login")} className="text-primary font-label-md mt-2 hover:underline">
            {view === "login" ? "Create a new account" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
