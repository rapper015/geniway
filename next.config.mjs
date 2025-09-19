/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase body size limit for image uploads
  experimental: {
    serverComponentsExternalPackages: ['mongoose']
  },
  // Configure API routes to handle larger payloads
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '10mb',
  },
  // Configure server to handle larger requests
  serverRuntimeConfig: {
    maxFileSize: '10mb',
  },
  // Configure public runtime config
  publicRuntimeConfig: {
    maxFileSize: '5mb',
  }
};

export default nextConfig;
