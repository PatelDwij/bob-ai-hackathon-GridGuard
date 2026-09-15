import {readFileSync, existsSync} from 'node:fs';
import {parseEnv} from 'node:util';
export function loadTestCredentials() {
  if(!existsSync('.env.test.local')) throw Object.assign(new Error('Missing .env.test.local'),{code:'test/credentials-missing'});
  const values=parseEnv(readFileSync('.env.test.local','utf8'));
  if(!values.VITE_TEST_EMAIL || !values.VITE_TEST_PASSWORD) throw Object.assign(new Error('Incomplete test credential file'),{code:'test/credentials-incomplete'});
  return {email:values.VITE_TEST_EMAIL,password:values.VITE_TEST_PASSWORD};
}
