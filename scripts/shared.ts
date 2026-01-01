import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = import.meta.url.startsWith('file:')
  ? dirname(fileURLToPath(import.meta.url))
  : process.cwd();
