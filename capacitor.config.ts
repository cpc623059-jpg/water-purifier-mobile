import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.codex.purewater.mobile",
  appName: "净水智控",
  webDir: "dist",
  server: {
    cleartext: true,
  },
};

export default config;
