// Cloudflare Access API client
// Pre-flight verified 27 May 2026. Do not change endpoint URLs
// without re-verifying — the per-app endpoint returns 400 for
// reusable policies (error code 12130).

const CF_ACCOUNT_ID = "873b7aeacb430d54a2754ed115518e7e";
const PRIVATE_POLICY_ID = "76191195-0f7d-41d3-bc18-4e9e30c222a5";
const PRIVATE_APP_UID = "5e4b7765-0fdf-41c4-ba72-59eb8b2ff989";
const API_BASE = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}`;

type IncludeEntry = { email: { email: string } };

type Policy = {
  id: string;
  name: string;
  decision: string;
  include: IncludeEntry[];
  exclude: unknown[];
  require: unknown[];
  precedence: number;
  reusable: boolean;
};

type AuditEvent = {
  user_email: string;
  app_uid: string;
  app_name: string;
  action: string;
  allowed: boolean;
  created_at: string;
};

async function cfFetch(path: string, token: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const body: any = await res.json();
  if (!res.ok || !body.success) {
    const errMsg = body.errors?.[0]?.message ?? `HTTP ${res.status}`;
    throw new Error(`Cloudflare API: ${errMsg}`);
  }
  return body.result;
}

export async function getPolicy(token: string): Promise<Policy> {
  return cfFetch(`/access/policies/${PRIVATE_POLICY_ID}`, token);
}

export async function listAllowlistEmails(token: string): Promise<string[]> {
  const policy = await getPolicy(token);
  return policy.include
    .map((e) => e.email?.email)
    .filter((x): x is string => typeof x === "string")
    .map((e) => e.toLowerCase());
}

export async function addEmail(token: string, email: string): Promise<void> {
  const normalised = email.trim().toLowerCase();
  const policy = await getPolicy(token);
  const existing = new Set(
    policy.include.map((e) => e.email?.email?.toLowerCase()).filter(Boolean)
  );
  if (existing.has(normalised)) return;
  const newInclude = [...policy.include, { email: { email: normalised } }];
  await putPolicy(token, policy, newInclude);
}

export async function removeEmail(token: string, email: string): Promise<void> {
  const normalised = email.trim().toLowerCase();
  const policy = await getPolicy(token);
  const newInclude = policy.include.filter(
    (e) => e.email?.email?.toLowerCase() !== normalised
  );
  if (newInclude.length === policy.include.length) return;
  await putPolicy(token, policy, newInclude);
}

async function putPolicy(
  token: string,
  current: Policy,
  newInclude: IncludeEntry[]
): Promise<void> {
  // Full-body replacement — must preserve all original fields.
  // Do not send connection_rules, id, uid, created_at, updated_at, reusable.
  const body = {
    decision: current.decision,
    name: current.name,
    include: newInclude,
    exclude: current.exclude,
    require: current.require,
    precedence: current.precedence,
  };
  await cfFetch(`/access/policies/${PRIVATE_POLICY_ID}`, token, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function getLastSignInByEmail(token: string): Promise<Map<string, string>> {
  // Returns email -> ISO timestamp of most recent successful login to Footsteps Private.
  // Emails not seen in the log are absent from the map (UI renders "Never").
  const events: AuditEvent[] = await cfFetch(
    `/access/logs/access_requests?limit=200`,
    token
  );
  const lastByEmail = new Map<string, string>();
  for (const event of events) {
    if (
      event.app_uid !== PRIVATE_APP_UID ||
      event.action !== "login" ||
      !event.allowed
    ) continue;
    const email = event.user_email.toLowerCase();
    const existing = lastByEmail.get(email);
    if (!existing || event.created_at > existing) {
      lastByEmail.set(email, event.created_at);
    }
  }
  return lastByEmail;
}
