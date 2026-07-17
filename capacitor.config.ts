import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.codex.purewater.mobile",
  appName: "PureWater Mobile",
  webDir: "dist",
  server: {
    cleartext: true,
  },
};

export default config;
