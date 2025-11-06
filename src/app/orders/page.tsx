"use client";

import { useEffect, useState } from "react";
import { BASE_URL } from "@/constants";
import toast from "react-hot-toast";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menuItem: {
    name: string;
    restaurant: { name: string; country: string };
  };
}

interface Order {
  id: string;
  user: { name: string; email: string; country: string };
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface UserInfo {
  sub: string;
  email: string;
  role: string;
  country: string;
  name: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ✅ Get logged-in user
        const userRes = await fetch(`${BASE_URL}/auth/me`, {
          credentials: "include",
        });
        if (!userRes.ok) {
          toast.error("Failed to load user info");
          return;
        }
        const userData = await userRes.json();
        setUser(userData);

        // ✅ Fetch all orders
        const res = await fetch(`${BASE_URL}/orders`, {
          credentials: "include",
        });
        if (!res.ok) {
          toast.error("Failed to fetch orders");
          return;
        }
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ Cancel order via PATCH /orders/:id/cancel
  const handleCancelOrder = async (orderId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/orders/${orderId}/cancel`, {
        method: "PATCH",
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Order cancelled successfully");
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: "CANCELLED" } : o
          )
        );
      } else {
        toast.error("Failed to cancel order");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error cancelling order");
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) newSet.delete(orderId);
      else newSet.add(orderId);
      return newSet;
    });
  };

  if (loading) return <p className="text-center mt-10">Loading orders...</p>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 text-gray-900">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Orders</h1>

        {orders.length === 0 ? (
          <p className="text-gray-600 text-center">No orders found.</p>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const isExpanded = expandedOrders.has(order.id);
              const isCancelled = order.status === "CANCELLED";
              const isPending = order.status === "PENDING";
              const isPaid = order.status === "PAID";

              return (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm p-5"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold text-gray-800">
                        Order ID: {order.id.slice(0, 8)}...
                      </p>
                      <p className="text-sm text-gray-500">
                        By: {order.user.name} ({order.user.email})
                      </p>
                      <p className="text-sm text-gray-500">
                        Country: {order.user.country}
                      </p>
                      <p className="text-sm text-gray-500">
                        Date: {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          isPaid
                            ? "text-green-600"
                            : isCancelled
                            ? "text-red-600"
                            : "text-yellow-600"
                        }`}
                      >
                        Status: {order.status}
                      </p>
                      <p className="font-bold text-lg text-gray-800">
                        ₹{order.totalAmount}
                      </p>
                    </div>
                  </div>

                  {/* Collapse toggle */}
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="flex items-center text-blue-600 font-medium hover:text-blue-700 mb-3"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-1" />
                        Hide Items
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-1" />
                        Show Items ({order.items.length})
                      </>
                    )}
                  </button>

                  {/* Collapsible Items */}
                  {isExpanded && (
                    <div
                      className="border-t border-gray-200 pt-3 mt-3 transition-all duration-300"
                      style={{ maxHeight: "400px", overflowY: "auto" }}
                    >
                      <ul className="space-y-2">
                        {order.items.map((item) => (
                          <li
                            key={item.id}
                            className="flex justify-between items-center text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-2"
                          >
                            <div>
                              <span className="font-medium">
                                {item.menuItem.name}
                              </span>{" "}
                              × {item.quantity}
                              <p className="text-xs text-gray-500">
                                {item.menuItem.restaurant.name} •{" "}
                                {item.menuItem.restaurant.country}
                              </p>
                            </div>
                            <span className="font-semibold">₹{item.price}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4 flex justify-end gap-3">
                    {/* Show Cancel Button for Admin/Manager — only if PENDING */}
                    {user &&
                      (user.role === "ADMIN" || user.role === "MANAGER") &&
                      isPending && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
                        >
                          Cancel Order
                        </button>
                      )}

                    {/* Show Pay Now only for MEMBER and if PENDING */}
                    {user && user.role === "MEMBER" && isPending && (
                      <button
                        onClick={() => router.push(`/orders/${order.id}/pay`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                      >
                        Pay Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
