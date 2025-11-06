"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

type PaymentType = "CASH" | "UPI" | "CARD" | "NETBANKING";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menuItem: {
    name: string;
    restaurant: { name: string; country: string };
  };
}

interface PaymentMethod {
  id: string;
  type: PaymentType;
  details: Record<string, any>;
  createdAt: string;
}

interface Order {
  id: string;
  user: { name: string; email?: string; country: string };
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
  paymentMethod?: PaymentMethod;
}

interface UserInfo {
  sub: string;
  email: string;
  role: string;
  country: string;
  name: string;
}

export default function PayOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  // 🧾 Payment details
  const [paymentType, setPaymentType] = useState<PaymentType>("CASH");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [bankName, setBankName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ✅ Fetch user info
        const userRes = await fetch(`http://localhost:8080/auth/me`, {
          credentials: "include",
        });
        if (!userRes.ok) {
          router.push("/login");
          return;
        }
        const userData = await userRes.json();
        setUser(userData);

        // ❌ Only members can pay
        if (userData.role !== "MEMBER") {
          toast.error("Access denied for this role");
          router.push("/restaurants");
          return;
        }

        // ✅ Fetch order details
        const orderRes = await fetch(
          `http://localhost:8080/orders/${orderId}`,
          {
            credentials: "include",
          }
        );
        if (!orderRes.ok) {
          toast.error("Order not found");
          router.push("/orders");
          return;
        }
        const orderData = await orderRes.json();
        setOrder(orderData);

        if (orderData.paymentMethod) {
          setPaymentType(orderData.paymentMethod.type);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchData();
  }, [orderId, router]);

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

  const handlePayment = async () => {
    if (!order) return;
    if (!validatePayment()) return;

    setPaying(true);

    try {
      const paymentDetails =
        paymentType === "CASH"
          ? {}
          : paymentType === "UPI"
          ? { upiId }
          : paymentType === "CARD"
          ? { cardNumber }
          : { bankName };

      const res = await fetch(`http://localhost:8080/orders/${order.id}/pay`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: paymentType,
          details: paymentDetails,
        }),
      });

      if (res.ok) {
        const updatedOrder = await res.json();
        setOrder(updatedOrder);
        toast.success("✅ Payment successful!");
      } else {
        const msg = (await res.json()).message || "Payment failed";
        toast.error(msg);
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setPaying(false);
    }
  };

  if (loading)
    return <p className="text-center mt-10 text-gray-700">Loading order...</p>;
  if (!order)
    return <p className="text-center mt-10 text-gray-700">Order not found.</p>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 text-gray-900">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          💰 Payment for Order
        </h1>

        {/* Order Info */}
        <div className="mb-5">
          <p className="text-gray-700 font-medium">
            Order ID:{" "}
            <span className="text-gray-500 font-normal">
              {order.id.slice(0, 8)}...
            </span>
          </p>
          <p className="text-gray-700 font-medium">
            Status:{" "}
            <span
              className={`font-semibold ${
                order.status === "PAID"
                  ? "text-green-600"
                  : order.status === "CANCELLED"
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              {order.status}
            </span>
          </p>
          <p className="text-gray-700 font-medium">
            Total Amount:{" "}
            <span className="font-bold text-gray-900">
              ₹{order.totalAmount}
            </span>
          </p>
          <p className="text-gray-600 text-sm mt-1">
            Placed on: {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Payment Method Section */}
        {order.status === "PENDING" && (
          <div className="border-t border-gray-200 pt-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Choose Payment Method
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
              onClick={handlePayment}
              disabled={paying}
              className={`w-full py-3 bg-blue-600 text-white font-semibold rounded-lg transition ${
                paying ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700"
              }`}
            >
              {paying ? "Processing..." : "Confirm & Pay"}
            </button>
          </div>
        )}

        {/* Items List */}
        <div className="border-t border-gray-200 pt-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Order Items
          </h2>
          <ul className="space-y-2">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between items-center border border-gray-200 bg-gray-50 rounded-lg p-2 text-sm"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {item.menuItem.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.menuItem.restaurant.name} •{" "}
                    {item.menuItem.restaurant.country}
                  </p>
                  <p className="text-xs text-gray-500">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <span className="font-semibold text-gray-900">
                  ₹{item.price}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {order.status === "PAID" && (
          <p className="text-center text-green-600 font-medium mt-4">
            ✅ This order is already paid.
          </p>
        )}
      </div>
    </div>
  );
}
