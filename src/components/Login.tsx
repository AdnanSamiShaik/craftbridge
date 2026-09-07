import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"artisan" | "customer">("artisan");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        try {
          await setDoc(userRef, {
            email: user.email || "",
            name: user.displayName || "User",
            role: role,
            createdAt: Date.now()
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}`);
        }
      } else {
        // If they already exist, we might want to respect their existing role
        // For this MVP, we just proceed.
      }

      if (role === "artisan") {
        navigate("/artisan");
      } else {
        navigate("/customer");
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert("Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface items-center justify-center p-gutter-mobile">
      <div className="w-full max-w-sm rounded-xl p-space-lg bg-surface-container-lowest shadow-md flex flex-col gap-space-lg">
        <div className="text-center">
          <h1 className="font-display-lg text-primary text-4xl mb-2">Craft Bridge</h1>
          <p className="font-body-md text-on-surface-variant">AI-Driven Market Linkage</p>
        </div>

        <div className="flex flex-col gap-space-md">
          <div className="flex bg-surface-container-low rounded-lg p-1">
            <button
              onClick={() => setRole("artisan")}
              className={`flex-1 py-2 rounded-md font-label-md transition-colors ${
                role === "artisan" ? "bg-primary text-on-primary shadow" : "text-on-surface-variant"
              }`}
            >
              Artisan / Seller
            </button>
            <button
              onClick={() => setRole("customer")}
              className={`flex-1 py-2 rounded-md font-label-md transition-colors ${
                role === "customer" ? "bg-primary text-on-primary shadow" : "text-on-surface-variant"
              }`}
            >
              Buyer
            </button>
          </div>

          <button 
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-touch-min rounded-xl bg-primary text-on-primary font-label-lg shadow-sm active:scale-95 transition-transform mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin">sync</span>
            ) : (
              <>Sign in with Google as {role === "artisan" ? "Artisan" : "Buyer"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
