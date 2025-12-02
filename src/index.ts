import { ExtensionContext, RegisterMessageConverterArgsTopic } from "@foxglove/extension";

const euler = (inputTopic: string, quatName: string = "q"): RegisterMessageConverterArgsTopic => {
  return {
    type: "topic",
    inputTopics: [inputTopic],
    outputTopic: inputTopic + "_euler",
    outputSchemaName: inputTopic,
    create: () => {
      return (msgEvent: any) => {
        const q = msgEvent.message[quatName];

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

        return {
          ...msgEvent.message,
          roll, pitch, yaw
        };
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
      return (msgEvent: any) => {
        const xyz = msgEvent.message["xyz"];
        const roll = xyz[0] * 180 / Math.PI;
        const pitch = xyz[1] * 180 / Math.PI;
        const yaw = xyz[2] * 180 / Math.PI;

        const xyz_d = msgEvent.message["xyz_derivative"];
        const roll_d = xyz_d[0] * 180 / Math.PI;
        const pitch_d = xyz_d[1] * 180 / Math.PI;
        const yaw_d = xyz_d[2] * 180 / Math.PI;

        return {
          ...msgEvent.message,
          xyz: [roll, pitch, yaw],
          xyz_d: [roll_d, pitch_d, yaw_d],
        };
      };
    },
  };
};

const vehicle_rates_setpoint_degrees = (): RegisterMessageConverterArgsTopic => {
  return {
    type: "topic",
    inputTopics: ["vehicle_rates_setpoint"],
    outputTopic: "vehicle_rates_setpoint_degrees",
    outputSchemaName: "vehicle_rates_setpoint",
    create: () => {
      return (msgEvent: any) => {
        const roll = msgEvent.message["roll"] * 180 / Math.PI;
        const pitch = msgEvent.message["pitch"] * 180 / Math.PI;
        const yaw = msgEvent.message["yaw"] * 180 / Math.PI;

        return {
          ...msgEvent.message,
          roll, pitch, yaw
        };
      };
    },
  };
};

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerMessageConverter(euler("vehicle_attitude"));
  extensionContext.registerMessageConverter(euler("vehicle_attitude_setpoint", "q_d"));
  extensionContext.registerMessageConverter(euler("vehicle_attitude_groundtruth"));
  extensionContext.registerMessageConverter(degrees("vehicle_angular_velocity"));
  extensionContext.registerMessageConverter(degrees("vehicle_angular_velocity_groundtruth"));
  extensionContext.registerMessageConverter(vehicle_rates_setpoint_degrees());
}
