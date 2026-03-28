import { env } from 'next-runtime-env';

export function getPublicEnv(name: `NEXT_PUBLIC_${string}`): string | undefined {
  const runtimeValue = env(name);
  if (runtimeValue !== undefined) {
    return runtimeValue;
  }

  return process.env[name];
}
