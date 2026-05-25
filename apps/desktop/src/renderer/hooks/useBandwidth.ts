import { useEffect, useState } from "react";
import { bandwidthService, type BandwidthState } from "../services/BandwidthService";

export function useBandwidth() {
  const [state, setState] = useState<BandwidthState>("strong");

  useEffect(() => {
    let active = true;
    bandwidthService.readConnectionState().then((next) => {
      if (active) setState(next);
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
