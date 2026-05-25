import { useMemo } from "react";
import { createSocket } from "../services/SocketService";

export function useSocket() {
  return useMemo(() => createSocket(), []);
}
