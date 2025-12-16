import { Input } from "./types";

export const inputs = ["battery_status/0"];

export const output = "soc";

type Output = {
  remaining: number;
};

const v_max = 4.15;
const v_min = 3.65;
const r_int = 0.0015;

const n_cells = 12;

export default function script(e: Input<any>): Output {
  const msg = e.message;

  let v_cell = msg.voltage_v / n_cells;
  v_cell += msg.current_a * r_int;

  return { remaining: (v_cell - v_min) / (v_max - v_min) }
}
