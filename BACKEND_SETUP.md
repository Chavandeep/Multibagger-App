# Phase 2 Backend Setup — Sharekhan Integration

This is what's actually live vs. what's a stopgap, and exactly what you need
to do to get real data flowing. Read the whole thing before deploying —
there are two spots that will need a small adjustment once you can see real
API responses (flagged clearly below).

## What's built

| Endpoint | What it does | Status |
|---|---|---|
| `GET /api/login` | Redirects to Sharekhan's login page | Ready |
| `GET /api/callback` | Exchanges the login token for a session, sets a secure cookie | Ready |
| `GET /api/status` | Tells the frontend if you're logged in | Ready |
| `GET /api/logout` | Clears your session | Ready |
| `GET /api/master` | Fetches + caches the full NSE symbol list | Ready, but see note below |
| `GET /api/history?symbol=X` | Historical price candles for one stock | Ready, but see note below |
| `GET /api/quote?symbols=A,B,C` | Live-ish prices via a short WebSocket round-trip | Works, but is a stopgap — see "About live quotes" below |

**None of this is wired into the app's UI yet.** The screens still show mock
data. Once you've deployed this and confirmed the endpoints actually return
real data (steps below), tell me and I'll do the final step: swapping
`src/lib/marketData.ts` over to call these instead of generating fake
numbers.

## Two things that WILL need adjusting

I built this against Sharekhan's official Node SDK and documentation, but
two pieces of their API aren't publicly documented in enough detail to get
exactly right without live credentials:

1. **`sharekhan-master.js`** — the scrip master is a CSV file, and I don't
   know the exact column names their API returns. The parser guesses common
   variants (`tradingsymbol`, `scripcode`, etc.). If `/api/master` comes back
   empty once you're logged in, the fix is quick: check Netlify's function
   logs for the CSV header row and adjust `CSV_COLUMNS` at the top of that
   file.
2. **`sharekhan-quote.js`** — live prices come through a WebSocket, and the
   exact shape of each price update isn't documented. `parseTick()` in that
   file is a placeholder. Once you can see a real message, that function
   needs updating to actually extract price/volume from it.

I couldn't test either of these without your real credentials — flagging
now so it's not a surprise.

## About live quotes (read this before expecting real-time)

Sharekhan has no "give me one quote" REST endpoint — prices only stream over
a WebSocket connection that has to stay open. A Netlify Function can't hold
a connection open like that (it runs, responds, and shuts down every time).

So `/api/quote` does a workaround: connects, listens for ~2.5 seconds,
grabs whatever price ticks came through, and disconnects. Good enough for
refreshing prices every 10-15 seconds. It is **not** true real-time
streaming — if you want sub-second live ticks later, that needs a small
always-on server (not serverless) that keeps one connection open
permanently. That's a bigger step and not necessary yet.

## Setup steps

### 1. Get your Sharekhan API credentials
Go to **sharekhan.com/trading-api**, sign up for API access from your
existing account. You'll get an **API Key** and **Secret Key**. Takes effect
immediately once approved.

### 2. Deploy this to Netlify (if not already)
If you're updating an existing Netlify site, just drag in the new
`yieldr-deploy-ready.zip` like before — but this time the backend functions
need a proper Netlify **build**, not just a static file drop. See step 4.

### 3. Set environment variables
In Netlify: **Site configuration → Environment variables**, add:

- `SHAREKHAN_API_KEY` — from step 1
- `SHAREKHAN_SECRET_KEY` — from step 1
- `APP_URL` — your live site URL, e.g. `https://your-site.netlify.app`
- `SHAREKHAN_VENDOR_KEY` — leave blank unless Sharekhan gave you one

**Never paste these values in chat with me or commit them to git.**

### 4. Connect Netlify to build from source (not drag-and-drop this time)
Functions need Netlify to actually run `npm install` and build server-side,
which a static drag-and-drop can't do. Easiest path:
1. Push the `multibagger-source` folder to a GitHub repo
2. In Netlify: **Add new site → Import an existing project → GitHub**, pick
   the repo
3. Build command: `npm run build` — Publish directory: `dist` (already set
   in `netlify.toml`, Netlify should detect it automatically)

### 5. Test it
1. Visit `https://your-site.netlify.app/api/login` directly in your browser
   — it should redirect to Sharekhan's login page
2. Log in with your Sharekhan account
3. You should get redirected back to your app
4. Visit `/api/status` — should show `{"loggedIn": true}`
5. Visit `/api/master` — should return a big JSON list of symbols (if it's
   empty, see the CSV column note above)
6. Visit `/api/quote?symbols=RELIANCE,TCS` — should return price data (if
   the `ticks` array looks garbled, see the parseTick note above)

Once steps 5-6 give you real data, come back and tell me what the responses
actually look like — I'll finish wiring the frontend to use them instead of
mock data.
