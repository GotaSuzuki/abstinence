/** @type {import('next').NextConfig} */
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
const isUserPage = repo ? repo.endsWith('.github.io') : false;
const defaultBasePath = isGithubActions && repo && !isUserPage ? `/${repo}` : '';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || defaultBasePath;

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined
};

module.exports = nextConfig;
