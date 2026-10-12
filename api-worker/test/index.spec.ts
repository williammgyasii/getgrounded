import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../src/index";

const CONTAINER_NAME = "api-prod";

function createEnv(options?: { rateLimitSuccess?: boolean }) {
	const fetch = vi.fn(async () => new Response("upstream"));
	const getByName = vi.fn(() => ({ fetch }));
	const rateLimitSuccess = options?.rateLimitSuccess ?? true;
	const limit = vi.fn(async () => ({ success: rateLimitSuccess }));
	const env = {
		GLOBAL_RATE_LIMITER: { limit },
		GETGROUNDED_API: { getByName },
	} as unknown as Env;
	return { env, fetch, getByName, limit };
}

afterEach(() => vi.restoreAllMocks());

describe("API gateway", () => {
	it("proxies every path to the singleton container", async () => {
		const { env, getByName, fetch } = createEnv();
		const response = await app.request(
			"http://example.com/me",
			{ method: "GET" },
			env,
		);
		expect(getByName).toHaveBeenCalledWith(CONTAINER_NAME);
		expect(fetch).toHaveBeenCalledOnce();
		expect(response.status).toBe(200);
		expect(await response.text()).toBe("upstream");
	});

	it("returns 429 when the global rate limit is exceeded", async () => {
		const { env, fetch, getByName } = createEnv({ rateLimitSuccess: false });
		const response = await app.request("http://example.com/me", {}, env);
		expect(response.status).toBe(429);
		expect(await response.json()).toEqual({ error: "rate_limit" });
		expect(getByName).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
	});

	it("returns 502 when the container stub fails", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		const { env, fetch } = createEnv();
		fetch.mockRejectedValue(new Error("container down"));
		const response = await app.request("http://example.com/health", {}, env);
		expect(response.status).toBe(502);
		expect(await response.text()).toContain("API unavailable");
	});
});
