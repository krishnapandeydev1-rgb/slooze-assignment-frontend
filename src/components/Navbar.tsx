"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BASE_URL } from "@/constants";

interface UserInfo {
  sub: string;
  email: string;
  role: string;
  country: string;
  name: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/me`, {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);

          // 🚫 Restrict access to /cart for ADMIN or MANAGER
          if (
            (data.role === "ADMIN" || data.role === "MANAGER") &&
            pathname === "/cart"
          ) {
            toast.error("Access denied for this role");
            router.push("/restaurants");
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/logout`, {
        method: "GET",
        credentials: "include",
      });

      if (res.ok) {
        toast.success("👋 Logged out successfully!");
        setUser(null);
        router.push("/login");
      } else {
        toast.error("⚠️ Failed to log out. Try again.");
      }
    } catch (error) {
      toast.error("⚠️ Network error while logging out.");
      console.error("Logout error:", error);
    }
  };

  if (loading || !user) return null;

  const isRestrictedRole = user.role === "ADMIN" || user.role === "MANAGER";

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link
          href="/restaurants"
          className="text-2xl font-bold text-blue-600 hover:text-blue-700"
        >
          Slooze
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6">
          <Link
            href="/restaurants"
            className="text-gray-700 hover:text-blue-600 font-medium"
          >
            Restaurants
          </Link>

          {/* ✅ Show Orders page link for all logged-in users */}
          <Link
            href="/orders"
            className="text-gray-700 hover:text-blue-600 font-medium"
          >
            Orders
          </Link>

          {/* Hide Cart for ADMIN or MANAGER */}
          {!isRestrictedRole && (
            <Link
              href="/cart"
              className="text-gray-700 hover:text-blue-600 font-medium"
            >
              Cart
            </Link>
          )}

          {/* User Info */}
          <div className="flex flex-col items-end text-sm text-gray-700">
            <span className="font-semibold">{user.name}</span>
            <span className="text-xs text-gray-500">
              {user.role} • {user.country}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
