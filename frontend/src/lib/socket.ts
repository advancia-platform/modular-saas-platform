"use client";
import { io, Socket } from "socket.io-client";

export function connectSocket(apiUrl: string, token: string): Socket {
  const socket = io(apiUrl, {
    transports: ["websocket"],
    auth: { token: `Bearer ${token}` },
  });
  return socket;
}
