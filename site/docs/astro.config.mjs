import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	base: "/docs",
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
					label: 'Get Started',
					autogenerate: { directory: 'start' },
				},
				{
					label: 'Support',
					link: '/support/',
					attrs: { style: 'font-weight: normal' },
				},
				{
					label: 'Contributing guide',
					link: '/contributing/',
					attrs: { style: 'font-weight: normal' },
				},
				{
					label: 'Security procedures',
					link: '/security/',
					attrs: { style: 'font-weight: normal' },
				},
				{
					label: 'Code of Conduct',
					link: '/code-of-conduct/',
					attrs: { style: 'font-weight: normal' },
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
