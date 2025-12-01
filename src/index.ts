import { ExtensionContext, RegisterMessageConverterArgsTopic } from "@foxglove/extension";

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
      return (msgEvent: any) => {
        const q = msgEvent.message[quatName];

        const w = q[0];
        const x = q[1];
        const y = q[2];
        const z = q[3];

        const sinr_cosp = 2 * (w * x + y * z);
        const cosr_cosp = 1 - 2 * (x * x + y * y);
        const roll = Math.atan2(sinr_cosp, cosr_cosp);

        const sinp = Math.sqrt(1 + 2 * (w * y - x * z));
        const cosp = Math.sqrt(1 - 2 * (w * y - x * z));
        const pitch = 2 * Math.atan2(sinp, cosp) - Math.PI / 2;

        const siny_cosp = 2 * (w * z + x * y);
        const cosy_cosp = 1 - 2 * (y * y + z * z);
        const yaw = Math.atan2(siny_cosp, cosy_cosp);

        return { roll, pitch, yaw };
      };
    },
  };
};

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerMessageConverter(euler("vehicle_attitude"));
  extensionContext.registerMessageConverter(euler("vehicle_attitude_setpoint", "q_d"));
  extensionContext.registerMessageConverter(euler("vehicle_attitude_groundtruth"));
}
