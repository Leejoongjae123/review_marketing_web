import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["wqdkajatljwxpiaknjja.supabase.co"],
  },
  // API 요청 크기 제한 증가
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default nextConfig;
