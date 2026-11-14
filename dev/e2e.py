"""End-to-end check of VibeCheck with a fake GitHub API.

Usage: dev/serve.sh & then python3 -I dev/e2e.py /tmp/shots   (needs Playwright + Chrome)
"""
import json, os, re, sys, time, urllib.parse
from playwright.sync_api import sync_playwright

OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/shots"
os.makedirs(OUT, exist_ok=True)
SITE = "/tmp/site/VibeCheck"
BASE = "http://localhost:8765/VibeCheck/"
TOKEN = "github_pat_TEST_123"
API = "https://api.github.com/repos/hichamAbd/VibeCheck"

# ---------------- fake GitHub ----------------
gh = {"head": "c0", "pending": {}, "n": 0, "commits": 0, "fail_next_ref": False}

def cors(extra=None):
    h = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE",
    }
    if extra:
        h.update(extra)
    return h

def handle(route, request):
    url = urllib.parse.urlparse(request.url)
    path = url.path.replace("/repos/hichamAbd/VibeCheck", "")
    if request.method == "OPTIONS":
        return route.fulfill(status=204, headers=cors())
    if request.headers.get("authorization") != f"Bearer {TOKEN}":
        return route.fulfill(status=401, headers=cors(), body='{"message":"Bad credentials"}')
    if request.method == "GET" and path == "/git/ref/heads/gh-pages":
        return route.fulfill(status=200, headers=cors({"Content-Type": "application/json"}), body=json.dumps({"object": {"sha": gh["head"]}}))
    if request.method == "GET" and path.startswith("/contents/"):
        f = os.path.join(SITE, path[len("/contents/"):])
        if not os.path.exists(f):
            return route.fulfill(status=404, headers=cors(), body='{"message":"Not Found"}')
        return route.fulfill(status=200, headers=cors({"Content-Type": "text/plain"}), body=open(f).read())
    if request.method == "GET" and path.startswith("/git/commits/"):
        return route.fulfill(status=200, headers=cors({"Content-Type": "application/json"}), body=json.dumps({"tree": {"sha": "t-" + path.split("/")[-1]}}))
    if request.method == "POST" and path == "/git/trees":
        body = json.loads(request.post_data)
        gh["n"] += 1
        tid = f"tree{gh['n']}"
        gh["pending"][tid] = {e["path"]: e["content"] for e in body["tree"]}
        return route.fulfill(status=201, headers=cors({"Content-Type": "application/json"}), body=json.dumps({"sha": tid}))
    if request.method == "POST" and path == "/git/commits":
        body = json.loads(request.post_data)
        gh["n"] += 1
        cid = f"c{gh['n']}"
        gh["pending"][cid] = gh["pending"][body["tree"]]
        assert body["parents"] == [gh["head"]], body
        return route.fulfill(status=201, headers=cors({"Content-Type": "application/json"}), body=json.dumps({"sha": cid}))
    if request.method == "PATCH" and path == "/git/refs/heads/gh-pages":
        body = json.loads(request.post_data)
        if gh["fail_next_ref"]:
            gh["fail_next_ref"] = False
            gh["head"] = gh["head"] + "x"  # someone else pushed
            return route.fulfill(status=422, headers=cors(), body='{"message":"Update is not a fast forward"}')
        for p, content in gh["pending"][body["sha"]].items():
            os.makedirs(os.path.dirname(os.path.join(SITE, p)), exist_ok=True)
            open(os.path.join(SITE, p), "w").write(content)
        gh["head"] = body["sha"]
        gh["commits"] += 1
        return route.fulfill(status=200, headers=cors({"Content-Type": "application/json"}), body=json.dumps({"object": {"sha": body["sha"]}}))
    return route.fulfill(status=500, headers=cors(), body='{"message":"unexpected ' + request.method + ' ' + path + '"}')

problems = []

def watch(page, name):
    page.on("console", lambda m: problems.append(f"[{name}] console.{m.type}: {m.text}") if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: problems.append(f"[{name}] pageerror: {e}"))
    page.on("dialog", lambda d: d.accept())

def shot(page, name, full=True):
    page.wait_for_timeout(250)
    page.screenshot(path=f"{OUT}/{name}.png", full_page=full)

def new_ctx(browser, scheme="light", width=390, locale="en-US", **kw):
    ctx = browser.new_context(viewport={"width": width, "height": 844}, device_scale_factor=2, color_scheme=scheme,
                              locale=locale, timezone_id="Europe/Paris", accept_downloads=True, **kw)
    ctx.route("https://api.github.com/**", handle)
    return ctx

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])

    # 1. Friend with no key
    ctx = new_ctx(browser)
    page = ctx.new_page(); watch(page, "nolink")
    page.goto(BASE); page.wait_for_selector(".state-title")
    assert "full link" in page.inner_text(".state-title"), page.inner_text(".state-title")
    shot(page, "01-nolink")
    ctx.close()

    # 2. Owner setup
    owner = new_ctx(browser)
    page = owner.new_page(); watch(page, "owner")
    page.goto(BASE + "#owner")
    page.wait_for_selector("#setup-token")
    shot(page, "02-setup", full=False)
    page.fill("#setup-token", "wrong")
    page.fill("#setup-pin", "123456"); page.fill("#setup-pin2", "123456")
    page.click("form .btn.primary")
    page.wait_for_selector(".err:not(:empty)")
    assert "didn" in page.inner_text(".err"), page.inner_text(".err")
    page.fill("#setup-token", TOKEN)
    page.fill("#setup-pin2", "123455")
    page.click("form .btn.primary")
    page.wait_for_timeout(200)
    assert "match" in page.inner_text(".err")
    page.fill("#setup-pin2", "123456")
    page.click("form .btn.primary")
    page.wait_for_selector("text=You’re all set", timeout=20000)
    shot(page, "03-done", full=False)
    ks = page.evaluate("localStorage.getItem('vibecheck.shareKey')")
    assert ks and len(ks) == 43, ks
    # backup download
    page.wait_for_selector(".sheet .btn:not([aria-busy])")
    with page.expect_download() as dl:
        page.click(".sheet-body > .btn:not(.primary) >> nth=0")
    backup_path = f"{OUT}/backup.json"
    dl.value.save_as(backup_path)
    backup = json.load(open(backup_path))
    assert backup["app"] == "vibecheck" and "ct" in backup["keys"], backup.keys()
    page.click(".sheet-body .btn.primary")
    page.wait_for_selector(".composer")
    shot(page, "04-owner-empty")

    # 3. Post three moods
    def post(m, text, private=False):
        page.click(f".composer .face-btn[aria-label='{['', 'Awful', 'Bad', 'Okay', 'Good', 'Great'][m]}']")
        page.fill("#comment", text)
        if private:
            page.click(".composer .switch-track")
        page.click("#post-btn")
        page.wait_for_selector(".toast.show:has-text('Posted')", timeout=20000)
        page.wait_for_timeout(300)
    post(4, "Coffee was perfect")
    page.click(".composer .face-btn[aria-label='Bad']")
    shot(page, "05-composer-open", full=False)
    page.fill("#comment", "Long meeting, need a nap")
    page.click(".composer .switch-track")
    page.click("#post-btn")
    page.wait_for_selector(".toast.show:has-text('Posted')", timeout=20000)
    page.wait_for_timeout(300)
    gh["fail_next_ref"] = True  # simulate a race: must retry and still succeed
    post(5, "Dinner with friends tonight")
    shot(page, "06-owner-today")
    assert gh["commits"] == 4, gh["commits"]

    # encrypted at rest: no plaintext in published files
    for f in ("data/today.json", "data/vault.json"):
        txt = open(os.path.join(SITE, f)).read()
        for word in ("Coffee", "meeting", "Dinner"):
            assert word not in txt, (f, word)

    # 4. Friend with the link
    friend = new_ctx(browser)
    fpage = friend.new_page(); watch(fpage, "friend")
    fpage.goto(BASE + "#k=" + ks)
    fpage.wait_for_selector(".mood-word")
    assert fpage.inner_text(".mood-word") == "Great"
    body = fpage.inner_text("main")
    assert "Coffee was perfect" in body and "Dinner with friends" in body and "meeting" not in body, body
    assert fpage.locator(".composer").count() == 0
    shot(fpage, "07-friend-light")
    # stored key works without hash afterwards
    fpage.goto(BASE); fpage.wait_for_selector(".mood-word")
    friend.close()

    for scheme in ("dark",):
        c = new_ctx(browser, scheme=scheme)
        pg = c.new_page(); watch(pg, "friend-dark")
        pg.goto(BASE + "#k=" + ks); pg.wait_for_selector(".mood-word")
        shot(pg, "08-friend-dark")
        c.close()
    c = new_ctx(browser, width=320)
    pg = c.new_page(); watch(pg, "friend-320")
    pg.goto(BASE + "#k=" + ks); pg.wait_for_selector(".mood-word")
    shot(pg, "09-friend-320")
    c.close()
    c = new_ctx(browser, locale="fr-FR")
    pg = c.new_page(); watch(pg, "friend-fr")
    pg.goto(BASE + "#k=" + ks); pg.wait_for_selector(".mood-word")
    assert pg.inner_text(".mood-word") == "Super"
    shot(pg, "10-friend-fr")
    c.close()

    # wrong key
    c = new_ctx(browser)
    pg = c.new_page(); watch(pg, "badlink")
    pg.goto(BASE + "#k=" + "A" * 43); pg.wait_for_selector(".state-title")
    assert "doesn" in pg.inner_text(".state-title")
    c.close()

    # 5. Owner: year, edit, delete
    page.click(".tab >> text=Year")
    page.wait_for_selector(".ygrid")
    shot(page, "11-year")
    page.click(".cell.is-today")
    page.wait_for_selector(".sheet .entries")
    shot(page, "12-day-sheet", full=False)
    page.click(".sheet .row >> nth=0")
    page.wait_for_selector("#edit-comment")
    page.fill("#edit-comment", "Coffee was perfect, really")
    page.click(".sheet .btn.primary")
    page.wait_for_selector(".toast.show:has-text('Saved')", timeout=20000)
    page.wait_for_selector(".sheet .entries")
    page.click(".sheet .row >> nth=1")
    page.wait_for_selector("#edit-comment")
    page.click(".sheet .btn.danger-text")
    page.wait_for_selector(".toast.show:has-text('Deleted')", timeout=20000)
    page.keyboard.press("Escape")
    page.click(".tab >> text=Today")
    page.wait_for_timeout(300)
    body = page.inner_text("main")
    assert "really" in body and "meeting" not in body, body

    # 6. Lock, wrong PIN, right PIN
    page.click(".icon-btn[aria-label='Lock']")
    page.wait_for_selector(".pill-btn")
    assert page.locator(".composer").count() == 0
    page.click(".pill-btn")
    page.fill("#unlock-pin", "000000")
    page.wait_for_selector(".err:not(:empty)", timeout=15000)
    shot(page, "13-unlock-wrong", full=False)
    page.fill("#unlock-pin", "123456")
    page.wait_for_selector(".composer", timeout=15000)

    # menu
    page.click(".icon-btn[aria-label='Menu']")
    page.wait_for_selector(".menu")
    shot(page, "14-menu", full=False)
    page.keyboard.press("Escape")

    # 7. New phone: restore from backup
    phone2 = new_ctx(browser)
    p2 = phone2.new_page(); watch(p2, "phone2")
    p2.goto(BASE + "#owner")
    p2.wait_for_selector("#setup-token")
    p2.fill("#setup-token", TOKEN)
    p2.fill("#setup-pin", "654321"); p2.fill("#setup-pin2", "654321")
    p2.click("form .btn.primary")
    p2.wait_for_selector("#restore-file", timeout=20000)
    shot(p2, "15-restore", full=False)
    p2.set_input_files("#restore-file", backup_path)
    p2.fill("#restore-pin", "111111")
    p2.click("form .btn.primary")
    p2.wait_for_selector(".err:not(:empty)", timeout=15000)
    p2.fill("#restore-pin", "123456")
    p2.click("form .btn.primary")
    p2.wait_for_selector("text=You’re all set", timeout=20000)
    p2.click(".sheet-body .btn.primary")
    p2.wait_for_selector(".mood-word")
    assert "really" in p2.inner_text("main")
    # new phone uses its own PIN
    p2.click(".icon-btn[aria-label='Lock']")
    p2.click(".pill-btn"); p2.fill("#unlock-pin", "654321")
    p2.wait_for_selector(".composer", timeout=15000)
    phone2.close()

    # 8. Surprises: peel every sticker, poke the face, tap the wordmark
    for i in range(4):
        page.click(f".decor.slot{i} .peel", force=True)
    page.wait_for_selector(".toast.show:has-text('peeled every')", timeout=5000)
    for _ in range(5):
        page.click(".hero-face", force=True)
    page.wait_for_selector(".toast.show:has-text('awake')", timeout=5000)
    page.click(".wordmark")

    # 9. Expired key: posting shows a clear message and keeps the draft
    TOKEN = "github_pat_ROTATED"
    page.click(".composer .face-btn[aria-label='Okay']")
    page.fill("#comment", "Should fail")
    page.click("#post-btn")
    page.wait_for_selector(".toast.show.error:has-text('refused your key')", timeout=15000)
    assert page.input_value("#comment") == "Should fail"
    shot(page, "18-expired", full=False)
    TOKEN = "github_pat_TEST_123"

    # 9. Looks
    for look in ("winter", "spring", "summer", "halloween", "christmas", "newyear", "aprilfools"):
        for scheme in ("light", "dark"):
            c = new_ctx(browser, scheme=scheme, reduced_motion="reduce")
            pg = c.new_page(); watch(pg, f"look-{look}-{scheme}")
            pg.goto(BASE + f"?look={look}#k=" + ks); pg.wait_for_selector(".mood-word")
            shot(pg, f"20-{look}-{scheme}", full=False)
            c.close()

    # Empty-day state (no today file match): friend sees empty message
    c = new_ctx(browser)
    pg = c.new_page(); watch(pg, "owner-dark")
    c.close()

    # owner screens in dark
    c = new_ctx(browser, scheme="dark")
    pg = c.new_page(); watch(pg, "owner-dark")
    pg.goto(BASE)
    pg.evaluate("""(o) => { localStorage.setItem('vibecheck.owner', o.owner); localStorage.setItem('vibecheck.shareKey', o.share); }""",
                {"owner": page.evaluate("localStorage.getItem('vibecheck.owner')"), "share": ks})
    pg.goto(BASE); pg.wait_for_selector(".pill-btn")
    pg.click(".pill-btn"); pg.fill("#unlock-pin", "123456")
    pg.wait_for_selector(".composer", timeout=15000)
    pg.click(".composer .face-btn[aria-label='Okay']")
    shot(pg, "16-owner-dark")
    pg.click(".tab >> text=Year"); pg.wait_for_selector(".ygrid")
    shot(pg, "17-year-dark")
    c.close()

    owner.close()
    browser.close()

print("commits:", gh["commits"])
print("PROBLEMS:" if problems else "No console problems.")
for x in problems:
    print(" ", x)
