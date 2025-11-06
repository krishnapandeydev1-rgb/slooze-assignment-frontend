"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingBag, X } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { BASE_URL } from "@/constants";

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  restaurantId?: string;
  restaurantName?: string;
}

type PaymentType = "CASH" | "UPI" | "CARD" | "NETBANKING";

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType>("CASH");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [bankName, setBankName] = useState("");

  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const normalized = parsed.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          qty: Number(item.qty || 1),
          restaurantId: item.restaurantId,
          restaurantName: item.restaurantName,
        }));
        setCart(normalized);
      } catch {
        setCart([]);
      }
    }
  }, []);

  const updateCart = (updated: CartItem[]) => {
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const increaseQty = (id: string) => {
    const updated = cart.map((item) =>
      item.id === id ? { ...item, qty: item.qty + 1 } : item
    );
    updateCart(updated);
  };

  const decreaseQty = (id: string) => {
    const updated = cart.map((item) =>
      item.id === id && item.qty > 1 ? { ...item, qty: item.qty - 1 } : item
    );
    updateCart(updated);
  };

  const removeItem = (id: string) => {
    const updated = cart.filter((item) => item.id !== id);
    updateCart(updated);
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const validatePayment = () => {
    if (paymentType === "UPI" && !upiId.trim()) {
      toast.error("Please enter your UPI ID");
      return false;
    }
    if (paymentType === "CARD" && !cardNumber.trim()) {
      toast.error("Please enter your card number");
      return false;
    }
    if (paymentType === "NETBANKING" && !bankName.trim()) {
      toast.error("Please enter your bank name");
      return false;
    }
    return true;
  };

  const handleOpenPayment = () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }
    setShowPaymentModal(true);
  };

  const placeOrder = async () => {
    if (!validatePayment()) return;
    setLoading(true);

    try {
      const paymentDetails =
        paymentType === "CASH"
          ? {}
          : paymentType === "UPI"
          ? { upiId }
          : paymentType === "CARD"
          ? { cardNumber }
          : { bankName };

      const payload = {
        items: cart.map((item) => ({
          menuItemId: item.id,
          quantity: item.qty,
          restaurantId: item.restaurantId,
        })),
        payment: {
          type: paymentType,
          details: paymentDetails,
        },
      };

      // ✅ Create order
      const res = await axios.post(`${BASE_URL}/orders`, payload, {
        withCredentials: true,
      });

      const order = res.data;
      toast.success("✅ Order placed successfully!");

      // ✅ Clear cart
      localStorage.removeItem("cart");
      setCart([]);
      setShowPaymentModal(false);

      // ✅ Redirect to /orders/:id/pay
      if (order?.id) {
        router.push(`/orders/${order.id}/pay`);
      }
    } catch (err: any) {
      console.error(err);
      const message =
        err.response?.data?.message || "❌ Failed to place order.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="mb-8 text-center text-3xl font-extrabold text-gray-800">
          🛒 Your Cart
        </h1>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
            <ShoppingBag size={40} className="mb-4" />
            <p>Your cart is empty.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <h2 className="font-semibold text-gray-800">{item.name}</h2>
                  {item.restaurantName && (
                    <p className="text-xs text-gray-500">
                      {item.restaurantName}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">₹{item.price}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-gray-300">
                    <button
                      onClick={() => decreaseQty(item.id)}
                      className="px-2 text-gray-600 hover:text-gray-800"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-2 text-sm font-semibold">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => increaseQty(item.id)}
                      className="px-2 text-gray-600 hover:text-gray-800"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <p className="w-16 text-right font-semibold text-gray-700">
                    ₹{(item.price * item.qty).toFixed(2)}
                  </p>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}

            <div className="mt-8 flex items-center justify-between rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800">
                Total: ₹{total.toFixed(2)}
              </h3>
              <button
                onClick={handleOpenPayment}
                disabled={loading}
                className={`rounded-lg bg-green-600 px-6 py-2 font-semibold text-white transition ${
                  loading
                    ? "cursor-not-allowed opacity-70"
                    : "hover:bg-green-700"
                }`}
              >
                {loading ? "Processing..." : "Proceed to Pay"}
              </button>
            </div>
          </div>
        )}
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg relative">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>

            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              💳 Choose Payment Method
            </h2>

            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as PaymentType)}
              className="mb-4 w-full rounded border px-3 py-2 text-sm text-gray-700"
            >
              <option value="CASH">Cash on Delivery</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="NETBANKING">Net Banking</option>
            </select>

            {paymentType === "UPI" && (
              <input
                type="text"
                placeholder="Enter UPI ID"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="mb-4 w-full rounded border px-3 py-2 text-sm text-gray-700"
              />
            )}

            {paymentType === "CARD" && (
              <input
                type="text"
                placeholder="Enter Card Number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="mb-4 w-full rounded border px-3 py-2 text-sm text-gray-700"
              />
            )}

            {paymentType === "NETBANKING" && (
              <input
                type="text"
                placeholder="Enter Bank Name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="mb-4 w-full rounded border px-3 py-2 text-sm text-gray-700"
              />
            )}

            <button
              onClick={placeOrder}
              disabled={loading}
              className={`w-full rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition ${
                loading ? "cursor-not-allowed opacity-70" : "hover:bg-green-700"
              }`}
            >
              {loading ? "Placing Order..." : "Confirm & Place Order"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
