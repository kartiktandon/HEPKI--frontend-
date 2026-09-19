import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

/** @type {import('next').NextConfig} */
const sharedConfig = {
  images: { formats: ['image/avif', 'image/webp'] }
};

export default function config(phase) {
  return {
    ...sharedConfig,
    // Keep production builds from overwriting the running dev server's assets.
    distDir: process.env.NEXT_DIST_DIR || (phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next')
  };
}
