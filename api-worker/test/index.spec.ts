import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../src/index";

const CONTAINER_NAME = "api-prod";

function createEnv() {
	const fetch = vi.fn(async () => new Response("upstream"));
	const getByName = vi.fn(() => ({ fetch }));
	const env = { GETGROUNDED_API: { getByName } } as unknown as Env;
	return { env, fetch, getByName };
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

	it("returns 502 when the container stub fails", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		const { env, fetch } = createEnv();
		fetch.mockRejectedValue(new Error("container down"));
		const response = await app.request("http://example.com/health", {}, env);
		expect(response.status).toBe(502);
		expect(await response.text()).toContain("API unavailable");
	});
});
