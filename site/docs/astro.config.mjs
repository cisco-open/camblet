import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import partytown from '@astrojs/partytown';

// https://astro.build/config
export default defineConfig({
	base: "/docs",
	darkMode: false,
	integrations: [
		partytown({
			config: {
				forward: ["dataLayer.push"],
			},
		}),
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
					label: 'Concepts',
					autogenerate: { directory: 'concepts' },
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
			expressiveCode: {
				themes: ['dracula-soft'],
				useStarlightDarkModeSwitch: false,
			},
			head: [
				{
					tag: 'script',
					attrs: {
						type: 'text/partytown',
						async: true,
						src: 'https://www.googletagmanager.com/gtag/js?id=G-K315W0LM1X'
					},
				},
				{
					tag: 'script',
					attrs: {
						type: 'text/partytown'
					},
					content: 'window.dataLayer = window.dataLayer || []; function gtag() { dataLayer.push(arguments); } gtag("js", new Date()); gtag("config", "G-K315W0LM1X");'
				},
			],
		}),
	],
});
