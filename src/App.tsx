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
import { db } from "./lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "./lib/auth";

export default function App() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"artisan" | "customer" | "buyer" | null>(null);

  useEffect(() => {
    async function fetchRole() {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role as any);
          }
        } catch (e) {
          console.error("Error fetching user role", e);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    }
    fetchRole();
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-surface">
        <div className="text-primary font-title-md animate-pulse">Loading...</div>
      </div>
    );
  }

  const getDashboardRoute = () => {
    if (!role) return "/login";
    if (role === "artisan") return "/artisan";
    return "/customer"; // Buyer and customer share marketplace
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to={getDashboardRoute()} replace /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Artisan Routes */}
        <Route path="/artisan" element={user ? <ArtisanDashboard /> : <Navigate to="/login" />} />
        <Route path="/artisan/add" element={user ? <ArtisanAddProduct /> : <Navigate to="/login" />} />

        {/* Customer & Buyer Routes */}
        <Route path="/customer" element={user ? <CustomerMarketplace /> : <Navigate to="/login" />} />
        <Route path="/customer/product/:id" element={user ? <ProductDetail /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
