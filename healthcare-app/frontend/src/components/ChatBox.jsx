import { useEffect, useState } from "react";
import {
  connectSocket,
  offReceiveMessage,
  offSlotUpdated,
  onReceiveMessage,
  onSlotUpdated,
  socket
} from "../socket/socket";

export default function ChatBox({ appointmentId = "appointment-demo-101", senderId = "user-demo-1" }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [slotNotice, setSlotNotice] = useState("");

  useEffect(() => {
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
          sender: payload.senderId === senderId ? "You" : payload.senderId || "User",
          text: payload.text || payload.message || "",
          createdAt: payload.createdAt || payload.timestamp || new Date().toISOString()
        }
      ]);
    };

    const handleSlotUpdated = (payload) => {
      setSlotNotice(`Slots updated for ${payload?.date || "selected date"}`);
    };

    onReceiveMessage(handleReceiveMessage);
    onSlotUpdated(handleSlotUpdated);

    return () => {
      offReceiveMessage(handleReceiveMessage);
      offSlotUpdated(handleSlotUpdated);
    };
  }, [appointmentId, senderId]);

  const sendMessage = (e) => {
    e.preventDefault();

    const text = input.trim();
    if (!text) return;

    socket.emit("sendMessage", {
      appointmentId,
      message: text,
      senderId
    });

    setInput("");
  };

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
