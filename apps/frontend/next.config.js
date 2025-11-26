/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@webscada/shared-types', '@webscada/utils'],
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  },
  async redirects() {
    return [
      // LoRaWAN device redirects
      {
        source: '/console/lorawan-devices',
        destination: '/console/lorawan/devices',
        permanent: true,
      },
      {
        source: '/console/lorawan-devices/:path*',
        destination: '/console/lorawan/devices/:path*',
        permanent: true,
      },
      {
        source: '/console/end-devices',
        destination: '/console/lorawan/devices',
        permanent: true,
      },
      {
        source: '/console/end-devices/:path*',
        destination: '/console/lorawan/devices/:path*',
        permanent: true,
      },
      // LoRaWAN gateway redirects
      {
        source: '/console/gateways',
        destination: '/console/lorawan/gateways',
        permanent: true,
      },
      {
        source: '/console/gateways/:path*',
        destination: '/console/lorawan/gateways/:path*',
        permanent: true,
      },
      // LoRaWAN application redirects
      {
        source: '/console/applications',
        destination: '/console/lorawan/applications',
        permanent: true,
      },
      {
        source: '/console/applications/:path*',
        destination: '/console/lorawan/applications/:path*',
        permanent: true,
      },
      // GSM device redirects
      {
        source: '/console/gsm-devices',
        destination: '/console/gsm/devices',
        permanent: true,
      },
      {
        source: '/console/gsm-devices/:path*',
        destination: '/console/gsm/devices/:path*',
        permanent: true,
      },
      // WiFi device redirects
      {
        source: '/console/wifi-devices',
        destination: '/console/wifi/devices',
        permanent: true,
      },
      {
        source: '/console/wifi-devices/:path*',
        destination: '/console/wifi/devices/:path*',
        permanent: true,
      },
      // Bluetooth device redirects
      {
        source: '/console/bluetooth-devices',
        destination: '/console/bluetooth/devices',
        permanent: true,
      },
      {
        source: '/console/bluetooth-devices/:path*',
        destination: '/console/bluetooth/devices/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
