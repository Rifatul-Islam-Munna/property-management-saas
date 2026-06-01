// next.config.mjs
import withPWAInit from "@ducanh2912/next-pwa"

const withPWA = withPWAInit({
  dest: "public",
  disable: false,
})

/** @type {import('next').NextConfig} */
const nextConfig = {}

export default withPWA(nextConfig)
