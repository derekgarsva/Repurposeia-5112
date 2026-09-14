# Repurpose security notes

The web app uses a 30-day HttpOnly browser session cookie to isolate persisted runs until account authentication is added.

Set `APP_ORIGIN` or `CORS_ORIGINS` to the exact production frontend origin(s). Do not use `*` with credentialed requests.

Set `REPURPOSE_MODEL` to route generation through a different AI Gateway model when cost/latency policy changes.

The URL extractor validates redirects, rejects local/private/reserved IP ranges, only accepts HTML/XHTML, and enforces a 1.5 MB response limit.
