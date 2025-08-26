/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['supabase.co', 'images.unsplash.com','lh3.googleusercontent.com'],
    formats: ['image/webp', 'image/avif'],
    // Optimisation des images locales
    minimumCacheTTL: 31536000, // 1 an
  },
  // ... autres configurations
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'leaflet': 'leaflet/dist/leaflet.js',
    };
    return config;
  },
}

module.exports = nextConfig;