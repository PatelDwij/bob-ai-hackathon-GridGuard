import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/browser',timeout:60000,workers:1,use:{baseURL:'http://127.0.0.1:5173',headless:true},webServer:{command:'npm start',env:{VITE_USE_EMULATORS:'true'},stdout:'pipe',url:'http://127.0.0.1:5173',reuseExistingServer:true}});
