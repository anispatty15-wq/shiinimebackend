const numberEnv = (key: string, fallback: number): number => {
  const value = Number(process.env[key]);
  return Number.isFinite(value) ? value : fallback;
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mockAuth: process.env.MOCK_AUTH === 'true' && process.env.NODE_ENV !== 'production',
  corsOrigins: (process.env.CORS_ORIGINS ?? '*').split(',').map((value) => value.trim()),
  sankaBaseUrl: (process.env.SANKA_BASE_URL ?? 'https://www.sankavollerei.web.id').replace(/\/$/, ''),
  sankaTimeoutMs: numberEnv('SANKA_TIMEOUT_MS', 10000),
  heartbeatMinSeconds: numberEnv('WATCH_HEARTBEAT_MIN_SECONDS', 15),
  heartbeatExpSeconds: numberEnv('WATCH_HEARTBEAT_EXP_SECONDS', 60),
  heartbeatExpAmount: numberEnv('WATCH_HEARTBEAT_EXP_AMOUNT', 5),
  completionThreshold: numberEnv('WATCH_COMPLETION_THRESHOLD', 0.8),
  completionExpAmount: numberEnv('WATCH_COMPLETION_EXP_AMOUNT', 20)
};
