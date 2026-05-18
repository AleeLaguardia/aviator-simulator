export interface Env {
  port: number;
  corsOrigin: string;
}

export function loadEnv(): Env {
  return {
    port: Number(process.env.PORT) || 4100,
    corsOrigin: process.env.CORS_ORIGIN || '*',
  };
}
