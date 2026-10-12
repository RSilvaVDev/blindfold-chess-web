export interface AppEnv {
  apiUrl: string;
  supabaseUrl: string;
  supabasePublishableKey: string;
}

function requireValue(name: keyof ImportMetaEnv): string {
  // Vite types import.meta.env values loosely; narrow before use.
  const value: unknown = import.meta.env[name];
  if (typeof value !== 'string' || !value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env and set it.`);
  }
  return value;
}

function requireUrl(name: keyof ImportMetaEnv): string {
  const value = requireValue(name);
  try {
    // Trailing slash stripped so callers can always join with a leading "/".
    return new URL(value).toString().replace(/\/$/, '');
  } catch {
    throw new Error(`${name} must be a full URL, got "${value}".`);
  }
}

// VITE_ values ship to every browser, so a secret key here would be public.
function requirePublishableKey(name: keyof ImportMetaEnv): string {
  const value = requireValue(name);
  if (!value.startsWith('sb_publishable_')) {
    throw new Error(
      `${name} must be a Supabase publishable key (sb_publishable_...). Never put a secret key in a VITE_ variable.`,
    );
  }
  return value;
}

let cached: AppEnv | undefined;

// Checked on first use rather than at build time, so CI can build without real values.
export function getEnv(): AppEnv {
  cached ??= {
    apiUrl: requireUrl('VITE_API_URL'),
    supabaseUrl: requireUrl('VITE_SUPABASE_URL'),
    supabasePublishableKey: requirePublishableKey(
      'VITE_SUPABASE_PUBLISHABLE_KEY',
    ),
  };
  return cached;
}
