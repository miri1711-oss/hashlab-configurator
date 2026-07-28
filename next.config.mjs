/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // three.js (a najmä jeho podmoduly z "three/examples/jsm/...") sa v
  // produkčnom builde niekedy spracujú inak než vo vývojovom serveri
  // (next dev), čo vedie k tomu, že model sa nezobrazí a checkout
  // ostane zablokovaný, hoci lokálne všetko funguje. Toto to opravuje.
  transpilePackages: ["three"],
};

export default nextConfig;
