import assert from "node:assert/strict";
const base = "http://127.0.0.1:3001";
async function login(email, password) {
    const response = await fetch(base + "/api/auth", { method: "POST", headers: { origin: base, "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
    assert.equal(response.status, 200);
    return response.headers.get("set-cookie").split(";")[0];
}
async function call(action, args = [], cookie = "") {
    const response = await fetch(base + "/api/workspace", { method: "POST", headers: { origin: base, "content-type": "application/json", cookie }, body: JSON.stringify({ action, args }) });
    return { status: response.status, body: await response.json() };
}
const wrong = await fetch(base + "/api/auth", { method: "POST", headers: { origin: base, "content-type": "application/json" }, body: JSON.stringify({ email: "owner@occasio.local", password: "WrongPassword123!" }) });
assert.equal(wrong.status, 401);
const csrf = await fetch(base + "/api/auth", { method: "POST", headers: { origin: "http://untrusted.invalid", "content-type": "application/json" }, body: "{}" });
assert.equal(csrf.status, 403);
assert.equal((await call("events")).status, 401);
const cookie = await login("owner@occasio.local", "OccasioOwner123!");
const events = await call("events", [], cookie);
assert.equal(events.status, 200);
const event = events.body.data.find(e => e.slug === "sheila-yoga");
assert.ok(event);
const original = (await call("content", [event.id], cookie)).body.data;
try {
    assert.equal((await call("updateContent", [event.id, { greeting: "Verifikasi backend lokal" }], cookie)).status, 200);
    assert.equal((await call("content", [event.id])).body.data.greeting, "Verifikasi backend lokal");
    const client = await login("client@occasio.local", "OccasioClient123!");
    assert.equal((await call("content", [event.id], client)).body.data.greeting, "Verifikasi backend lokal");
    assert.equal((await call("updateEvent", [event.id, { isPublished: true }], client)).status, 403);
    assert.deepEqual((await call("guests", [event.id])).body.data, []);
    assert.equal((await call("createClient", [{ email: "forged@test.local", fullName: "Forged", password: "Password12345!" }], client)).status, 403);
}
finally {
    assert.equal((await call("updateContent", [event.id, { greeting: original.greeting }], cookie)).status, 200);
}
const logout = await fetch(base + "/api/auth", { method: "DELETE", headers: { origin: base, cookie } });
assert.equal(logout.status, 200);
assert.equal((await call("events", [], cookie)).status, 401);
const protectedPage = await fetch(base + "/owner/dashboard", { redirect: "manual" });
assert.equal(protectedPage.status, 307);
console.log("PASS: owner/client login, wrong password, CSRF, private guest list, role restrictions, persisted content roundtrip, logout, protected route.");
