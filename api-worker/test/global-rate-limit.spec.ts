import { describe, expect, it } from "vitest";
import {
	enforceGlobalRateLimit,
	GLOBAL_RATE_LIMIT_KEY,
} from "../src/global-rate-limit";

describe("enforceGlobalRateLimit", () => {
	it("allows when binding is missing", async () => {
		expect(await enforceGlobalRateLimit(undefined)).toBe(true);
	});

	it("allows when limit succeeds", async () => {
		const limiter = {
			limit: async () => ({ success: true }),
		};
		expect(await enforceGlobalRateLimit(limiter)).toBe(true);
	});

	it("denies when limit fails", async () => {
		const limiter = {
			limit: async () => ({ success: false }),
		};
		expect(await enforceGlobalRateLimit(limiter)).toBe(false);
	});

	it("uses the global key", async () => {
		let key = "";
		const limiter = {
			limit: async (options: { key: string }) => {
				key = options.key;
				return { success: true };
			},
		};
		await enforceGlobalRateLimit(limiter);
		expect(key).toBe(GLOBAL_RATE_LIMIT_KEY);
	});
});
