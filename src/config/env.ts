export interface AppEnv {
  apiUrl: string;
}

function requireUrl(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env and set it.`);
  }
  try {
    // Trailing slash stripped so callers can always join with a leading "/".
    return new URL(value).toString().replace(/\/$/, '');
  } catch {
    throw new Error(`${name} must be a full URL, got "${value}".`);
  }
}

let cached: AppEnv | undefined;

// Checked on first use rather than at build time, so CI can build without real values.
export function getEnv(): AppEnv {
  cached ??= { apiUrl: requireUrl('VITE_API_URL') };
  return cached;
}
