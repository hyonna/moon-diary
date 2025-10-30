/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  images: {
    domains: ['picsum.photos']
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react']
  }
}
