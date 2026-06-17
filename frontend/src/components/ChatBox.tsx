"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthProvider";
import { apiFetch } from "@/lib/api";
import { Send, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  batchId: string;
}

export function ChatBox({ batchId }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // Load existing messages
    apiFetch(`/api/chat/${batchId}`).then(setMessages);

    // Connect socket
    const s = io(process.env.NEXT_PUBLIC_SOCKET_URL!, { transports: ["websocket"] });
    s.on("connect", () => {
      setConnected(true);
      s.emit("join-batch", batchId);
    });
    s.on("disconnect", () => setConnected(false));
    s.on("new-message", (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    });
    setSocket(s);

    return () => { s.disconnect(); };
  }, [user, batchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket || !user) return;

    // Optimistic + socket emit
    socket.emit("send-message", { batchId, userId: user.id, content: input.trim() });
    setInput("");
  };

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary-600" />
          <span className="text-sm font-semibold">Batch Chat</span>
        </div>
        <span className={`w-2 h-2 rounded-full ${connected ? "bg-success" : "bg-gray-400"}`} />
      </div>

      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">No messages yet. Start the conversation!</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.userId === user?.id;
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              {msg.user?.image ? (
                <img src={msg.user.image} alt={msg.user.name} className="w-6 h-6 rounded-full flex-shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold flex-shrink-0">
                  {msg.user?.name?.charAt(0)}
                </div>
              )}
              <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                isMe ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-800"
              }`}>
                <p className="text-xs font-medium opacity-80 mb-0.5">{msg.user?.name}</p>
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMe ? "text-primary-200" : "text-gray-400"}`}>
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 border-t border-gray-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-500 outline-none"
        />
        <button type="submit" disabled={!input.trim()} className="btn-primary px-3 py-2 disabled:opacity-50">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
