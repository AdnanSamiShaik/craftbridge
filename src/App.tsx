/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ArtisanDashboard from "./components/ArtisanDashboard";
import ArtisanAddProduct from "./components/ArtisanAddProduct";
import CustomerMarketplace from "./components/CustomerMarketplace";
import ProductDetail from "./components/ProductDetail";
import Login from "./components/Login";
import { useEffect, useState } from "react";
import { auth, db } from "./lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"artisan" | "customer" | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role);
          }
        } catch (e) {
          console.error("Error fetching user role", e);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-surface">
        <div className="text-primary font-title-md animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? (role === "artisan" ? <Navigate to="/artisan" replace /> : <Navigate to="/customer" replace />) : <Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Artisan Routes */}
        <Route path="/artisan" element={user ? <ArtisanDashboard /> : <Navigate to="/login" />} />
        <Route path="/artisan/add" element={user ? <ArtisanAddProduct /> : <Navigate to="/login" />} />

        {/* Customer Routes */}
        <Route path="/customer" element={user ? <CustomerMarketplace /> : <Navigate to="/login" />} />
        <Route path="/customer/product/:id" element={user ? <ProductDetail /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
