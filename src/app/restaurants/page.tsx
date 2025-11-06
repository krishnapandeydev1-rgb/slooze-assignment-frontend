"use client";

import { useEffect, useState } from "react";
import { BASE_URL } from "@/constants";
import { Plus, Minus, ShoppingCart, X } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

interface Restaurant {
  id: string;
  name: string;
  country: string;
  createdAt: string;
  menuItems: MenuItem[];
}

interface ApiResponse {
  data: Restaurant[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface CartItem extends MenuItem {
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

interface User {
  role: string;
  country: string;
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [meta, setMeta] = useState<ApiResponse["meta"] | null>(null);
  const [page, setPage] = useState(1);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [user, setUser] = useState<User | null>(null);

  const [showAddRestaurantModal, setShowAddRestaurantModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState<Restaurant | null>(
    null
  );
  const [newRestaurant, setNewRestaurant] = useState({
    name: "",
    country: "INDIA",
  });
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    restaurantId: "",
  });

  const getKey = (restaurantId: string, itemId: string) =>
    `${restaurantId}-${itemId}`;

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    fetchRestaurants(page);
  }, [page]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRestaurants = async (page = 1) => {
    try {
      const res = await fetch(`${BASE_URL}/restaurants?page=${page}&limit=3`, {
        credentials: "include",
      });
      const data: ApiResponse = await res.json();
      setRestaurants(data.data);
      setMeta(data.meta);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    }
  };

  const increaseQty = (restaurantId: string, itemId: string) => {
    const key = getKey(restaurantId, itemId);
    setQuantities((prev) => ({ ...prev, [key]: (prev[key] || 1) + 1 }));
  };

  const decreaseQty = (restaurantId: string, itemId: string) => {
    const key = getKey(restaurantId, itemId);
    setQuantities((prev) => ({
      ...prev,
      [key]: prev[key] > 1 ? prev[key] - 1 : 1,
    }));
  };

  const addToCart = (item: MenuItem, restaurant: Restaurant) => {
    if (user?.role === "ADMIN" || user?.role === "MANAGER") return;

    const key = getKey(restaurant.id, item.id);
    const qty = quantities[key] || 1;
    const existingCart: CartItem[] = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    const existingItemIndex = existingCart.findIndex(
      (c) => c.id === item.id && c.restaurantId === restaurant.id
    );

    if (existingItemIndex > -1) {
      existingCart[existingItemIndex] = {
        ...existingCart[existingItemIndex],
        quantity: existingCart[existingItemIndex].quantity + qty,
      };
    } else {
      existingCart.push({
        ...item,
        quantity: qty,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
      });
    }

    localStorage.setItem("cart", JSON.stringify(existingCart));
    setQuantities((prev) => ({ ...prev, [key]: 1 }));
    toast.success(`${qty} × ${item.name} added to cart`);
  };

  const handleAddRestaurant = async () => {
    try {
      const body =
        user?.role === "MANAGER"
          ? { name: newRestaurant.name, country: user.country }
          : newRestaurant;

      const res = await fetch(`${BASE_URL}/restaurants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("✅ Restaurant added!");
        setShowAddRestaurantModal(false);
        setNewRestaurant({ name: "", country: "INDIA" });
        fetchRestaurants();
      } else toast.error("❌ Failed to add restaurant");
    } catch (err) {
      console.error(err);
      toast.error("⚠️ Network error");
    }
  };

  const handleAddItem = async () => {
    try {
      const res = await fetch(`${BASE_URL}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newItem.name,
          price: Number(newItem.price),
          restaurantId: showAddItemModal?.id,
        }),
      });

      if (res.ok) {
        toast.success("✅ Menu item added!");
        setShowAddItemModal(null);
        setNewItem({ name: "", price: "", restaurantId: "" });
        fetchRestaurants();
      } else toast.error("❌ Failed to add menu item");
    } catch (err) {
      console.error(err);
      toast.error("⚠️ Network error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800">
            🍽️ Explore Restaurants
          </h1>

          {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
            <button
              onClick={() => setShowAddRestaurantModal(true)}
              className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
            >
              + Add Restaurant
            </button>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-md transition hover:shadow-lg"
            >
              <h2 className="text-xl font-semibold text-gray-800">{r.name}</h2>
              <p className="text-sm text-gray-500 mb-3">
                {r.country} • {new Date(r.createdAt).toLocaleDateString()}
              </p>

              <button
                onClick={() => setSelectedRestaurant(r)}
                className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                View Menu
              </button>

              {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
                <button
                  onClick={() => setShowAddItemModal(r)}
                  className="mt-2 w-full rounded-lg bg-amber-500 py-2 text-sm font-medium text-white hover:bg-amber-600"
                >
                  + Add Menu Item
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Menu Modal */}
      <AnimatePresence>
        {selectedRestaurant && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                {selectedRestaurant.name}
              </h2>
              <p className="text-gray-500 mb-4">
                {selectedRestaurant.country} •{" "}
                {new Date(selectedRestaurant.createdAt).toLocaleDateString()}
              </p>

              <div className="max-h-80 overflow-y-auto pr-2 space-y-3">
                {selectedRestaurant.menuItems.map((m) => {
                  const key = getKey(selectedRestaurant.id, m.id);
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{m.name}</p>
                        <p className="text-sm text-gray-500">₹{m.price}</p>
                      </div>

                      {/* Hide Add to Cart for admin/manager */}
                      {user?.role !== "ADMIN" && user?.role !== "MANAGER" && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center rounded-lg border border-gray-300">
                            <button
                              onClick={() =>
                                decreaseQty(selectedRestaurant.id, m.id)
                              }
                              className="px-2 text-gray-600 hover:text-gray-800"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="px-2 text-sm font-semibold text-gray-800">
                              {quantities[key] || 1}
                            </span>
                            <button
                              onClick={() =>
                                increaseQty(selectedRestaurant.id, m.id)
                              }
                              className="px-2 text-gray-600 hover:text-gray-800"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <button
                            onClick={() => addToCart(m, selectedRestaurant)}
                            className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700"
                          >
                            <ShoppingCart size={14} />
                            Add
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Restaurant Modal */}
      <AnimatePresence>
        {showAddRestaurantModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Add Restaurant
              </h2>

              <input
                type="text"
                placeholder="Restaurant Name"
                value={newRestaurant.name}
                onChange={(e) =>
                  setNewRestaurant({ ...newRestaurant, name: e.target.value })
                }
                className="w-full mb-3 rounded-lg border border-gray-300 p-2 text-gray-800 placeholder-gray-500"
              />

              {user?.role === "ADMIN" && (
                <select
                  value={newRestaurant.country}
                  onChange={(e) =>
                    setNewRestaurant({
                      ...newRestaurant,
                      country: e.target.value,
                    })
                  }
                  className="w-full mb-3 rounded-lg border border-gray-300 p-2 text-gray-800 bg-white"
                >
                  <option value="INDIA">INDIA</option>
                  <option value="AMERICA">AMERICA</option>
                </select>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddRestaurantModal(false)}
                  className="rounded-lg bg-gray-300 px-4 py-2 font-medium text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRestaurant}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Menu Item Modal */}
      <AnimatePresence>
        {showAddItemModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Add Menu Item
              </h2>

              <input
                type="text"
                placeholder="Item Name"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
                className="w-full mb-3 rounded-lg border border-gray-300 p-2 text-gray-800 placeholder-gray-500"
              />

              <input
                type="number"
                placeholder="Price"
                value={newItem.price}
                onChange={(e) =>
                  setNewItem({ ...newItem, price: e.target.value })
                }
                className="w-full mb-3 rounded-lg border border-gray-300 p-2 text-gray-800 placeholder-gray-500"
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddItemModal(null)}
                  className="rounded-lg bg-gray-300 px-4 py-2 font-medium text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
