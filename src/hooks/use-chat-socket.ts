"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useChatStore, type ChatMessage, type BetFeedItem, type RainEvent } from "@/store/chat";
import { useAuthStore } from "@/store/auth";

/**
 * Connects to the chat Socket.io mini-service (port 3003) via the gateway.
 * Browser URL: io("/?XTransformPort=3003") with path "/".
 */
export function useChatSocket() {
  const user = useAuthStore((s) => s.user);
  const socketRef = useRef<Socket | null>(null);
  const joinedRef = useRef(false);

  const addMessage = useChatStore((s) => s.addMessage);
  const prependMessages = useChatStore((s) => s.prependMessages);
  const addBetFeed = useChatStore((s) => s.addBetFeed);
  const setOnline = useChatStore((s) => s.setOnline);
  const setConnected = useChatStore((s) => s.setConnected);
  const setActiveRain = useChatStore((s) => s.setActiveRain);

  useEffect(() => {
    if (socketRef.current) return;
    const socket = io("/", {
      path: "/",
      query: { XTransformPort: "3003" },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1500,
      reconnectionAttempts: 20,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      // Join chat immediately — logged-in users use their name, guests get a guest handle.
      if (!joinedRef.current) {
        const u = useAuthStore.getState().user;
        socket.emit("chat:join", {
          username: u?.username || `Guest_${Math.random().toString(36).slice(2, 7)}`,
          avatar: u?.avatar || "",
          isVip: (u?.vipTier?.level || 1) >= 4,
          role: u?.role || "user",
        });
        joinedRef.current = true;
      }
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("chat:message", (m: ChatMessage) => addMessage(m));
    socket.on("chat:system", (m: { id: string; text: string; timestamp: string }) =>
      addMessage({
        id: m.id,
        username: "System",
        avatar: null,
        role: "system",
        text: m.text,
        channel: "chat:en",
        type: "system",
        timestamp: m.timestamp,
      })
    );
    socket.on("chat:history", (data: { channel: string; messages: ChatMessage[] }) => {
      if (data.channel === "chat:en") prependMessages(data.messages);
    });
    socket.on("chat:online", (data: { count: number }) => setOnline(data.count));
    socket.on("bets:new", (b: BetFeedItem) => addBetFeed(b));
    socket.on("rain:start", (r: RainEvent) => setActiveRain(r));
    socket.on("rain:end", () => setActiveRain(null));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      joinedRef.current = false;
      setConnected(false);
    };
  }, []);

  // Re-join with real identity when user logs in
  useEffect(() => {
    if (user && socketRef.current?.connected) {
      socketRef.current.emit("chat:join", {
        username: user.username,
        avatar: user.avatar,
        isVip: (user.vipTier?.level || 1) >= 4,
        role: user.role,
      });
    }
  }, [user?.id]);

  return socketRef;
}

export function sendChatMessage(socket: Socket | null, text: string, channel = "chat:en") {
  if (!socket || !text.trim()) return;
  socket.emit("chat:message", { channel, text: text.trim().slice(0, 280) });
}

export function sendChatTyping(socket: Socket | null, channel = "chat:en") {
  if (!socket) return;
  socket.emit("chat:typing", { channel });
}
