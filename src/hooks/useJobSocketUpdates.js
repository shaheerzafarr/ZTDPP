import { useEffect } from "react";
import { useSocket } from "@/context/SocketContext";

export function useJobSocketUpdates(onUpdate) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    socket.on("job:updated", onUpdate);
    socket.on("job:created", onUpdate);
    socket.on("job:deleted", onUpdate);
    return () => {
      socket.off("job:updated", onUpdate);
      socket.off("job:created", onUpdate);
      socket.off("job:deleted", onUpdate);
    };
  }, [socket, onUpdate]);
}
