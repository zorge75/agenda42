const withImages = require("next-images");
const withInterceptStdout = require("next-intercept-stdout");

var hideWarn = [
  "Invalid next.config.js options detected:",
  "The value at .experimental has an unexpected property, images, which is not in the list of allowed properties",
  "https://nextjs.org/docs/messages/invalid-next-config",
  "You have enabled experimental feature (images) in next.config.js.",
  "Experimental features are not covered by semver, and may cause unexpected or broken application behavior. Use at your own risk.",
  "Fast Refresh had to perform a full reload.",
  "Cannot read properties of null (reading 'length')",
];

const nextConfig = withInterceptStdout(
  withImages({
    images: { disableStaticImages: true },
    reactStrictMode: true,
    swcMinify: true,
    webpack(config, options) {
      return config;
    },
    async rewrites() {
      return [
        {
          source: "/api/auth/callback",
          destination: "/api/auth/callback",
        },
        {
          source: "/api/all_events",
          destination: "/api/all_events",
        },
        {
          source: "/api/get_user",
          destination: "/api/get_user",
        },
        {
          source: "/api/make_stot",
          destination: "/api/make_slot",
        },
        {
          source: "/api/get_user",
          destination: "/api/get_user",
        },
        {
          source: "/api/proxy",
          destination: "/api/proxy",
        },
        {
          source: "/api/refresh_agenda",
          destination: "/api/refresh_agenda",
        },
        {
          source: "/api/preview",
          destination: "/api/preview",
        },
      ];
    },
    env: {
      API_URI: process.env.API_URI,
      CLIENT_ID: process.env.CLIENT_ID,
      API_TOKEN: process.env.API_TOKEN,
      PORT: process.env.PORT,
      STATUS: process.env.STATUS,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
  }),
  (log) => (hideWarn.some((warn) => log.includes(warn)) ? "" : log),
);

module.exports = nextConfig;
