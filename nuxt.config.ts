import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const stylesUtils = resolve(__dirname, "app/assets/styles/utils").replace(
  /\\/g,
  "/",
);

export default defineNuxtConfig({
  compatibilityDate: "2025-04-01",
  devtools: { enabled: true },
  ssr: true,

  modules: ["@pinia/nuxt", "@vueuse/nuxt", "@nuxt/eslint"],

  components: [{ path: "~/components", pathPrefix: false }],

  css: ["~/assets/styles/base/base.scss"],

  runtimeConfig: {
    apiUrl: process.env.BACKEND_URL || "https://api.nether.pp.ua",
    apiToken: process.env.API_TOKEN || "",
    login: process.env.LOGIN || "admin",
    password: process.env.PASSWORD || "",
    sessionSecret: process.env.SESSION_SECRET || "",
    public: {
      pollInterval: Number(process.env.NUXT_PUBLIC_POLL_INTERVAL || 2000),
    },
  },

  app: {
    viewTransition: true,
    head: {
      title: "Monitoring",
      script: [
        {
          // Must run before first paint — reads localStorage and sets the
          // theme-dark class on <html> so CSS variables apply immediately.
          // Without this, every page load flashes the light theme for ~150ms
          // while waiting for the Vue bundle to hydrate.
          innerHTML: `
            (function(){
              try{
                var k='monitoring:v1:theme'
                var v=localStorage.getItem(k)
                try{v=JSON.parse(v)}catch(e){}
                // mirror useTheme() isDark logic:
                //   explicit 'dark' → dark
                //   'auto' → system preference
                //   null/undefined (cold start) → dark (matches useColorMode initialValue)
                if(v==='dark'||!v||(v==='auto'&&window.matchMedia('(prefers-color-scheme:dark)').matches)){
                  document.documentElement.classList.add('theme--dark')
                }
              }catch(e){}
            })()
          `,
        },
      ],
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "robots",
          content: "noindex, nofollow, noarchive, nosnippet, noimageindex",
        },
        { name: "googlebot", content: "noindex, nofollow" },
      ],
    },
  },

  nitro: {
    preset: process.env.NITRO_PRESET || "vercel",
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "${stylesUtils}/variables.scss" as *;
            @use "${stylesUtils}/mixins.scss" as *;
            @use "${stylesUtils}/breakpoints.scss" as *;
          `,
        },
      },
    },
    optimizeDeps: {
      include: [
        "@vue/devtools-core",
        "@vue/devtools-kit",
        "chart.js",
        "vue-chartjs",
        "vue-sonner",
        "pinia-plugin-persistedstate",
        "lucide-vue-next",
        "vee-validate",
        "@vee-validate/yup",
        "yup",
      ],
    },
  },
});
