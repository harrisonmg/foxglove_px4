import { Input } from "./types";

export const inputs = ["distance_sensor"];

export const output = "rng_reject";

type Output = {
  rejecting: boolean;
  fusion_timed_out: boolean;
  filtered_distance: number;
};

const threshold = 90;
const rejection_window = BigInt(100_000);
const fusion_timeout = BigInt(5_000_000);

let last_rejection = BigInt(0);
let last_fusion = BigInt(0);

export default function script(e: Input<any>): Output {
  const msg = e.message;

  if (msg.signal_quality <= threshold) {
    last_rejection = msg.timestamp;
  }

  let rejecting = msg.timestamp - last_rejection < rejection_window;

  let filtered_distance = NaN;

  if (!rejecting) {
    last_fusion = msg.timestamp;
    filtered_distance = msg.current_distance;
  }

  let fusion_timed_out = msg.timestamp - last_fusion > fusion_timeout;

  return {
    rejecting,
    fusion_timed_out,
    filtered_distance,
  };
}
