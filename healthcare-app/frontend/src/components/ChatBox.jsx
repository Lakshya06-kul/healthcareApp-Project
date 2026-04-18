import { useEffect, useState } from "react";
import {
  connectSocket,
  offReceiveMessage,
  offSlotUpdated,
  onReceiveMessage,
  onSlotUpdated,
  socket
} from "../socket/socket";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ChatBox({ appointmentId, senderId }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [slotNotice, setSlotNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!appointmentId || !senderId) {
      return;
    }

    connectSocket();

    socket.emit("joinRoom", { appointmentId });

    const handleReceiveMessage = (payload) => {
      const targetRoom = payload.roomId || payload.appointmentId;
      if (targetRoom && String(targetRoom) !== String(appointmentId)) {
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: payload._id || `${Date.now()}-${Math.random()}`,
          sender: String(payload.senderId) === String(senderId) ? "You" : payload.senderId || "User",
          text: payload.text || payload.message || "",
          createdAt: payload.createdAt || payload.timestamp || new Date().toISOString()
        }
      ]);
    };

    const handleSlotUpdated = (payload) => {
      setSlotNotice(`Slots updated for ${payload?.date || "selected date"}`);
    };

    const handleErrorMessage = (payload) => {
      if (payload?.msg) {
        setError(payload.msg);
      }
    };

    onReceiveMessage(handleReceiveMessage);
    onSlotUpdated(handleSlotUpdated);
    socket.on("errorMessage", handleErrorMessage);

    return () => {
      offReceiveMessage(handleReceiveMessage);
      offSlotUpdated(handleSlotUpdated);
      socket.off("errorMessage", handleErrorMessage);
    };
  }, [appointmentId, senderId]);

  const sendMessage = async (e) => {
    e.preventDefault();

    const text = input.trim();
    if (!text) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Login required to send messages.");
      return;
    }

    try {
      setError("");
      const response = await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ appointmentId, text })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.msg || "Failed to send message");
        return;
      }

      setInput("");
    } catch (_error) {
      setError("Network error while sending message.");
    }
  };

  if (!appointmentId || !senderId) {
    return (
      <section className="rounded-2xl bg-white p-6 shadow">
        <h1 className="mb-2 text-2xl font-bold">Chat Page</h1>
        <p className="text-slate-600">A valid appointment and signed-in user are required.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow">
      <h1 className="mb-2 text-2xl font-bold">Chat Page</h1>
      <p className="mb-4 text-sm text-slate-600">Room: {appointmentId}</p>

      {slotNotice && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {slotNotice}
        </div>
      )}

      <div className="mb-4 h-80 space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
        {messages.length === 0 && <p className="text-slate-500">No messages yet.</p>}

        {messages.map((msg) => (
          <div key={msg.id} className="rounded-lg bg-white p-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{msg.sender}</p>
            <p className="text-slate-800">{msg.text}</p>
          </div>
        ))}
      </div>

      {error && <p className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-cyan-700"
        />
        <button className="rounded-lg bg-cyan-700 px-4 py-2 font-semibold text-white hover:bg-cyan-800">
          Send
        </button>
      </form>
    </section>
  );
}
