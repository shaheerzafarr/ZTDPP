"use client";

import { APP_CONFIG } from "@/config";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";

const SocketContext = createContext({
  socket: null,
  isConnected: false,
});

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, accessToken } = useSelector(
    (state) => state.authReducer,
  );

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      return;
    }

    const socket = io(APP_CONFIG.SOCKET_URL, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, accessToken]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
