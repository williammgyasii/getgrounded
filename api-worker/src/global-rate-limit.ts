/** Single counter per Cloudflare location — caps total traffic before the container. */
export const GLOBAL_RATE_LIMIT_KEY = "global";

export type RateLimitBinding = {
	limit(options: { key: string }): Promise<{ success: boolean }>;
};

export async function enforceGlobalRateLimit(
	limiter: RateLimitBinding | undefined,
): Promise<boolean> {
	if (!limiter) {
		return true;
	}

	const { success } = await limiter.limit({ key: GLOBAL_RATE_LIMIT_KEY });
	return success;
}
