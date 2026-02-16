/* eslint-disable no-undef */
module.exports = {
  webpack: {
    configure: (config) => {
      // Fix for canvg / @babel/runtime ESM resolution (fullySpecified)
      config.module.rules.push({
        test: /\.m?js$/,
        include: /node_modules/,
        resolve: {
          fullySpecified: false,
        },
      });
      return config;
    },
  },
};
