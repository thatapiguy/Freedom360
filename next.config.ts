import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allows loading the dev server from another device on your local network
  // (e.g. viewing http://<your-computer's-LAN-IP>:3000 from a phone/tablet).
  // Add any other LAN IPs you use here.
  allowedDevOrigins: ["192.168.68.105"],
};

export default nextConfig;
