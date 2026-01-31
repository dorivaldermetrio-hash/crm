import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Configuração do Turbopack para evitar conflito com next-pwa
  turbopack: {},
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  sw: "sw.js", // Nome do arquivo do service worker
  // Adiciona scripts customizados ao service worker
  importScripts: ['/sw-custom.js'],
  buildExcludes: [/middleware-manifest\.json$/],
});

export default pwaConfig(nextConfig);
