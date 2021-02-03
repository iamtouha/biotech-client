module.exports = function(ctx) {
  return {
    supportTS: false,
    boot: ["i18n", "moment", "globals", "axios"],
    css: ["app.scss"],
    extras: ["roboto-font", "material-icons"],

    build: {
      vueRouterMode: "hash",
      chainWebpack(chain, { isServer, isClient }) {
        chain.module
          .rule("gql")
          .test(/\.(graphql|gql)$/)
          .use("graphql-tag/loader")
          .loader("graphql-tag/loader");

        chain.module
          .rule("vue")
          .use("vue-loader")
          .loader("vue-loader")
          .tap(options => {
            options.transpileOptions = {
              transforms: {
                dangerousTaggedTemplateString: true
              }
            };
            return options;
          });
      }
    },

    devServer: {
      https: false,
      port: 3300,
      open: true
    },

    framework: {
      iconSet: "material-icons",
      lang: "en-us",
      config: {},
      plugins: ["Notify", "Cookies", "Dialog"],

      importStrategy: "auto"
    },
    animations: [],
    ssr: {
      pwa: false
    },
    pwa: {
      workboxPluginMode: "GenerateSW",
      workboxOptions: {},
      manifest: {
        name: `Biotech Agrovat`,
        short_name: `Biotech Agrovat`,
        description: `sales & employee management app for Biotech Agrovat Ltd. `,
        display: "standalone",
        orientation: "portrait",
        background_color: "#ffffff",
        theme_color: "#027be3",
        icons: [
          {
            src: "icons/icon-128x128.png",
            sizes: "128x128",
            type: "image/png"
          },
          {
            src: "icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "icons/icon-256x256.png",
            sizes: "256x256",
            type: "image/png"
          },
          {
            src: "icons/icon-384x384.png",
            sizes: "384x384",
            type: "image/png"
          },
          {
            src: "icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    },
    cordova: {},
    capacitor: {
      hideSplashscreen: true
    },
    electron: {
      bundler: "packager",
      packager: {},
      builder: {
        appId: "biotech_agrovat"
      },
      nodeIntegration: true,
      extendWebpack(/* cfg */) {}
    }
  };
};
