import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';
export default defineConfig({envPrefix:['VITE_FIREBASE_','VITE_USE_EMULATORS','VITE_FORCE_DEMO_DATA','VITE_WEATHER_PROVIDER'],build:{rollupOptions:{input:Object.fromEntries(readdirSync('.').filter(f=>f.endsWith('.html')).map(f=>[f.replace('.html',''),f]))}}});
