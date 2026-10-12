interface Env {
  GLOBAL_RATE_LIMITER: RateLimit;
  GETGROUNDED_API: DurableObjectNamespace<
    import("./src/index").GetGroundedApiContainer
  >;
  DATABASE_URL: string;
  FIREBASE_PROJECT_ID: string;
  ELEVENLABS_API_KEY?: string;
  ELEVENLABS_VOICE_ID?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  R2_ACCOUNT_ID?: string;
  R2_BUCKET?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
}
