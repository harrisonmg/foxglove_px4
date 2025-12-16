import { Input } from "./types";
import { AlphaFilter } from "./alpha_filter.ts";

export const inputs = [
  "battery_status/0",
  "battery_status_uavcan/0",
  "battery_status_uavcan/1",
];

export const output = "v_filter";

type Output = {
  v: number;
  v_diff_0: number;
  v_diff_1: number;
};

let filter = new AlphaFilter();
filter.set_cutoff_freq(20, 0.5);

let res: Output = {
  v: 0,
  v_diff_0: 0,
  v_diff_1: 0,
};

export default function script(e: Input<any>): Output {
  const msg = e.message;

  switch (e.topic) {
    case "battery_status/0":
      if (filter.state == 0) {
        filter.reset(msg.voltage_v);
      }
      res.v = filter.update(msg.voltage_v);
      break;
    case "battery_status_uavcan/0":
      res.v_diff_0 = Math.abs(msg.voltage_v - res.v);
      break;
    case "battery_status_uavcan/1":
      res.v_diff_1 = Math.abs(msg.voltage_v - res.v);
      break;
  }
  return res;
}
