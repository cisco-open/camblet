import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	base: "/docs",
	themes: ["aa"],
	darkMode: false,
	integrations: [
		starlight({
			title: 'Nasp documentation',
			logo: {
				dark: './src/assets/logo-white.svg',
				light: './src/assets/logo.svg',
			},
			social: {
				github: 'https://github.com/cisco-open/nasp',
			},
			sidebar: [
				{
					label: 'Overview',
					autogenerate: { directory: 'overview' },
				},
				{
					label: 'Getting started',
					autogenerate: { directory: 'start' },
				},
			],
			customCss: [
				'/src/styles/custom.css',
			],
			components: {
				ThemeSelect: './src/components/ThemeSelect.astro',
			},
		}),
	],
});
