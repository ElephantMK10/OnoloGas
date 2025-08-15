// polyfills.js  (FIRST thing that runs in index.tsx)
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { Buffer } from 'buffer';
import { decode as atob, encode as btoa } from 'base-64';
import { TextEncoder, TextDecoder } from 'fast-text-encoding';
import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';

/* ----- Web-crypto helpers ----- */
if (!global.crypto) global.crypto = {};
// getRandomValues already injected by react-native-get-random-values

/* ----- Encoding helpers ----- */
polyfillGlobal('TextEncoder', () => TextEncoder);
polyfillGlobal('TextDecoder', () => TextDecoder);

if (!global.atob)  global.atob  = atob;
if (!global.btoa)  global.btoa  = btoa;
if (!global.Buffer) global.Buffer = Buffer;

/* Debug – remove once you see the log in a release build */
console.log('[polyfills] All Web APIs polyfilled for Supabase');

export {};
