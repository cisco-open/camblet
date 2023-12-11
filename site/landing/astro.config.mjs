import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import alpinejs from "@astrojs/alpinejs";
import image from "@astrojs/image";
import mdx from "@astrojs/mdx";
import partytown from '@astrojs/partytown';

export default defineConfig({
  site: "http://localhost:8080/",
  base: "/",
  integrations: [
    alpinejs(),
    tailwind(),
    image({
      serviceEntryPoint: "@astrojs/image/sharp"
    }),
    mdx(),
    partytown({
      config: {
        forward: ["dataLayer.push"],
      },
    }),
  ]
});