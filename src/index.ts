import {
  Experimental,
  MessageEvent,
  RegisterMessageConverterArgsTopic
} from "@foxglove/extension";

import alpha_filter_source from "./alpha_filter.ts?raw";

export function activate(extensionContext: Experimental.ExtensionContext): void {
  extensionContext.registerUserScriptUtility({ name: "alpha_filter.ts", source: alpha_filter_source });

  extensionContext.registerMessageConverter(euler("vehicle_attitude"));
  extensionContext.registerMessageConverter(euler("vehicle_attitude_setpoint", "q_d"));
  extensionContext.registerMessageConverter(euler("vehicle_attitude_groundtruth"));
  extensionContext.registerMessageConverter(degrees("vehicle_angular_velocity"));
  extensionContext.registerMessageConverter(degrees("vehicle_angular_velocity_groundtruth"));
  extensionContext.registerMessageConverter(vehicle_rates_setpoint_degrees);
  extensionContext.registerMessageConverter(mag_checks);
}

const euler = (inputTopic: string, quatName: string = "q"): RegisterMessageConverterArgsTopic => {
  return {
    type: "topic",
    inputTopics: [inputTopic],
    outputTopic: inputTopic + "_euler",
    outputSchemaName: inputTopic + "_euler",
    outputSchemaDescription: {
      roll: "number",
      pitch: "number",
      yaw: "number",
    },
    create: () => {
      return (msgEvent: MessageEvent<any>) => {
        const msg = msgEvent.message;
        const q = msg[quatName];

        const w = q[0];
        const x = q[1];
        const y = q[2];
        const z = q[3];

        const sinr_cosp = 2 * (w * x + y * z);
        const cosr_cosp = 1 - 2 * (x * x + y * y);
        const roll_rad = Math.atan2(sinr_cosp, cosr_cosp);

        const sinp = Math.sqrt(1 + 2 * (w * y - x * z));
        const cosp = Math.sqrt(1 - 2 * (w * y - x * z));
        const pitch_rad = 2 * Math.atan2(sinp, cosp) - Math.PI / 2;

        const siny_cosp = 2 * (w * z + x * y);
        const cosy_cosp = 1 - 2 * (y * y + z * z);
        const yaw_rad = Math.atan2(siny_cosp, cosy_cosp);

        const roll = roll_rad * 180 / Math.PI;
        const pitch = pitch_rad * 180 / Math.PI;
        const yaw = yaw_rad * 180 / Math.PI;

        return { roll, pitch, yaw };
      };
    },
  };
};

const degrees = (inputTopic: string): RegisterMessageConverterArgsTopic => {
  return {
    type: "topic",
    inputTopics: [inputTopic],
    outputTopic: inputTopic + "_degrees",
    outputSchemaName: inputTopic,
    create: () => {
      return (msgEvent: MessageEvent<any>) => {
        const msg = msgEvent.message;
        const xyz = msg["xyz"];
        const roll = xyz[0] * 180 / Math.PI;
        const pitch = xyz[1] * 180 / Math.PI;
        const yaw = xyz[2] * 180 / Math.PI;

        const xyz_d = msg["xyz_derivative"];
        const roll_d = xyz_d[0] * 180 / Math.PI;
        const pitch_d = xyz_d[1] * 180 / Math.PI;
        const yaw_d = xyz_d[2] * 180 / Math.PI;

        return {
          ...msg,
          xyz: [roll, pitch, yaw],
          xyz_d: [roll_d, pitch_d, yaw_d],
        };
      };
    },
  };
};

const vehicle_rates_setpoint_degrees: RegisterMessageConverterArgsTopic = {
  type: "topic",
  inputTopics: ["vehicle_rates_setpoint"],
  outputTopic: "vehicle_rates_setpoint_degrees",
  outputSchemaName: "vehicle_rates_setpoint",
  create: () => {
    return (msgEvent: MessageEvent<any>) => {
      const msg = msgEvent.message;
      const roll = msg["roll"] * 180 / Math.PI;
      const pitch = msg["pitch"] * 180 / Math.PI;
      const yaw = msg["yaw"] * 180 / Math.PI;

      return {
        ...msg,
        roll, pitch, yaw
      };
    };
  },
};

const mag_checks: RegisterMessageConverterArgsTopic = {
  type: "topic",
  inputTopics: ["estimator_status", "vehicle_status"],
  outputTopic: "mag_checks",
  outputSchemaName: "mag_checks",
  outputSchemaDescription: {
    strength_diff: "number",
    strength_threshold: "number",
    strength_check: "bool",
    inclination_diff: "number",
    inclination_threshold: "number",
    inclination_check: "bool",
    preflight_fail: "bool",
  },
  create: () => {
    let armed = false;
    return (msgEvent: MessageEvent<any>) => {
      if (msgEvent.topic == "vehicle_status") {
        armed = msgEvent.message.arming_state == 2;
        return;
      }

      const msg = msgEvent.message;
      const strength_diff = Math.abs(msg.mag_strength_gs - msg.mag_strength_ref_gs);
      const strength_threshold = 0.075;
      const strength_check = strength_diff <= strength_threshold;
      const inclination_diff = Math.abs(msg.mag_inclination_deg - msg.mag_inclination_ref_deg);
      const inclination_threshold = 8.0;
      const inclination_check = inclination_diff <= inclination_threshold;
      const preflight_fail = !armed && !(strength_check && inclination_check);
      return {
        strength_diff,
        strength_threshold,
        strength_check,
        inclination_diff,
        inclination_threshold,
        inclination_check,
        preflight_fail,
      };
    };
  },
};
