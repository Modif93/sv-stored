import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	webServer: {
		command: 'pnpm exec vite --host 127.0.0.1 --port 5174',
		port: 5174,
		reuseExistingServer: false
	},
	use: {
		baseURL: 'http://127.0.0.1:5174'
	},
	testMatch: /(.+\.)?(spec)\.[jt]s/
};

export default config;
