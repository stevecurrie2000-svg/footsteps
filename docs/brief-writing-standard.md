# Brief-writing standard

A short reference for writing Claude Code briefs that ship cleanly
on the first deploy.

Use this when starting a slice or phase brief. Hotfixes and
one-liner commits don't need this ceremony.

---

## 1. When this template applies

| Scope | Apply this standard? |
|---|---|
| Phase brief (new phase from project brief) | Yes |
| Slice brief (named slice within a phase) | Yes |
| Multi-file refactor with shared state changes | Yes |
| Hotfix (single root cause, focused commit) | No |
| One-liner commit (config tweak, copy fix) | No |
| Doc-only change | No |

Rule of thumb: if the brief touches more than two files OR
introduces a new external dependency, use the template.

---

## 2. Standard brief sections

Every slice brief lands in eight sections, in this order. Treat
deviations as deliberate — if you're skipping one, name why.

1. **Context** — what's the problem this slice solves; what changed
   to make it the right time to solve it now
2. **Pre-flight verified** — checklist of curl / fetch / wrangler
   probes that have already been run, with results. Marked clearly
   as "Steve has already done these — don't re-verify"
3. **Files to change** — full enumeration, no surprises in the body
4. **Detailed specs** — per-file behaviour, ideally with copy-paste
   blocks where the exact code matters (queries, classNames, regex,
   API call shapes)
5. **Verification walkthrough** — numbered, observable checks to run
   on the live site after deploy. Include the verification
   wait-budget for each check (see section 5)
6. **Out of scope** — explicitly call out related work that's
   deliberately deferred, with where it'll live (carry, future
   slice, won't-do)
7. **Build-log discipline** — reminder of the date+time format and
   what to capture in the session entry
8. **Conventions** — anything new this brief introduces that future
   briefs should follow

---

## 3. Pre-flight checklist

**When the pre-flight step applies**:

> Any brief that uses a third-party API or external service, AND
> it's the first time we're hitting that specific endpoint OR
> feature surface.

A "new feature surface" includes a new query type on an endpoint
already in use. Slice 2's forward-geocode against Nominatim was
pre-flight-worthy even though Slice 4 had already used Nominatim
for reverse-geocode — different feature, different failure modes.

**What pre-flight looks like in practice**:

For each new endpoint or feature surface:

- [ ] Hit the endpoint with `curl` or `wrangler` from the laptop
      using the real key / token / payload the brief will use
- [ ] Confirm the response shape matches what the brief is
      assuming (status code, JSON keys, error format)
- [ ] Confirm the operation is on the free / current pricing tier
      (Static Maps API failed Slice 1 on this point)
- [ ] If the brief hard-codes any identifier returned by the
      service (style ID, region code, font name), confirm it's
      still valid
- [ ] Record the curl command and abbreviated response in the
      brief's "Pre-flight verified" section

If any check fails, the brief is wrong and needs revision before
Claude Code sees it. Don't try to ship the brief and fix it post-
hoc — that's the Slice 1 failure mode.

**Time budget**: 10 minutes for a one-API slice; 20 minutes for
something touching two or three external services. If the
pre-flight is taking longer than the brief itself, the slice is
probably too big and should be split.

---

## 4. Pre-commit verification

Two layers, both cheap, both catch a class of bug the pre-flight
doesn't.

### 4a. Local grep before commit

After any search-and-replace patch that substitutes a runtime
identifier (API key, AUD, account ID, token), run the grep audit
across the source tree before committing:

```bash
# Customise the pattern for the specific sentinel used in the brief
grep -rn "YOUR_MAPTILER_KEY_HERE" src/
grep -rn "YOUR_X_HERE" src/
```

Expect zero matches. If you get a match, the substitution missed
an occurrence — fix it before commit, not after deploy.

### 4b. CI guard in GitHub Actions

Add a placeholder check to `.github/workflows/deploy.yml` before
the build step:

```yaml
- name: Check for unsubstituted placeholders
  run: |
    if grep -rIn \
         --include='*.astro' \
         --include='*.ts' \
         --include='*.js' \
         --include='*.tsx' \
         --include='*.jsx' \
         --include='*.css' \
         --include='*.html' \
         -E 'YOUR_[A-Z_]+_HERE|TODO_RUNTIME_KEY|REPLACE_ME' src/; then
      echo "::error::Unsubstituted placeholder found in src/ — fix before deploying"
      exit 1
    fi
```

This is a preventive control that complements the detective
pre-flight pattern and the corrective revert-and-redeploy
workflow. Three layers for a failure mode that ships visibly
broken to end users is proportionate.

Grow the regex pattern over time as new sentinel strings emerge.

---

## 5. Verification wait-budget by rendering model

Time-based waits are a proxy for state-based readiness. Where
possible, verify against a state signal rather than guessing how
long is enough. Where a wait is unavoidable, calibrate to the
rendering model.

| Rendering model | Minimum wait | Preferred state probe |
|---|---|---|
| Pure Astro / static HTML | 3–4 seconds | First H1 visible in DOM |
| MapLibre / tile-loaded UIs | 6–8 seconds | Hover a known pin — if popup renders, the layer is alive |
| R2-backed image grids | wait for image render | At least one `<img>` has non-zero `naturalWidth` |
| Cloudflare Access redirect chain | 5–7 seconds | Final URL matches expected admin path |
| Astro page with client `<script>` hydration | 4–6 seconds | Inspect for the hydrated element's expected class / data attribute |

**The deeper rule**: if you see no content, wait once more before
calling it broken. The Slice 3 verification misread (read "still
loading" as "broken" until retested with more wait) cost ~5 minutes
of false-alarm investigation that a second wait+screenshot would
have avoided.

---

## 6. What goes in the brief vs. what goes elsewhere

To keep briefs scannable:

- **Brief itself**: spec, pre-flight evidence, verification steps,
  out-of-scope. Aim for ~2 screens of scrollable content
- **Build log**: outcomes, lessons, carries — written after the
  slice ships, not before
- **`docs/` folder** (this doc, future architecture docs):
  cross-slice reference material that future briefs will quote
- **Project brief**: the stable picture of the site's purpose,
  design, and tech stack — only updated at phase boundaries

If a brief is growing past ~3 screens, look for what should be
extracted to one of the other homes.
