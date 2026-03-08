/**
 * Demo Smoke Runner
 *
 * Hits local app routes and checks for required response shapes.
 * Run with: npm run demo:smoke
 */

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

type CheckResult = {
  name: string;
  ok: boolean;
  error?: string;
};

async function checkEndpoint(
  name: string,
  url: string,
  method: "GET" | "POST" = "GET",
  body?: unknown
): Promise<CheckResult> {
  try {
    const options: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${url}`, options);
    if (!res.ok) {
      return { name, ok: false, error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    if (!data || typeof data !== "object") {
      return { name, ok: false, error: "Response is not JSON object" };
    }
    return { name, ok: true };
  } catch (err) {
    return { name, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function main() {
  console.log(`\nDemo Smoke Check — ${BASE_URL}\n`);

  const results: CheckResult[] = [];

  // Landlord listings
  results.push(await checkEndpoint("Landlord Listings", "/api/landlord/listings"));

  // Landlord notifications
  results.push(await checkEndpoint("Landlord Notifications", "/api/landlord/notifications"));

  // AI Studio assets
  results.push(await checkEndpoint("AI Studio Assets", "/api/landlord/ai-studio"));

  // Auth profile
  results.push(await checkEndpoint("Auth Profile", "/api/auth/profile"));

  // Print results
  let failed = 0;
  for (const r of results) {
    const status = r.ok ? "PASS" : "FAIL";
    const detail = r.error ? ` — ${r.error}` : "";
    console.log(`  [${status}] ${r.name}${detail}`);
    if (!r.ok) failed++;
  }

  console.log(`\n${results.length - failed}/${results.length} checks passed.\n`);

  if (failed > 0) {
    console.log("Some checks failed. This is expected if services are not running locally.");
    console.log("Run 'npm run dev' and ensure MongoDB is connected before retrying.\n");
  }

  process.exit(failed > 0 ? 1 : 0);
}

void main();
