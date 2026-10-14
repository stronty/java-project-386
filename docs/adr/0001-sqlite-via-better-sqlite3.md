# SQLite via better-sqlite3 for persistence

The booking app needs durable storage for event types and bookings, but it has no other data
requirements and no operational budget. We decided to use SQLite through `better-sqlite3`, with the
database file located under `DATA_DIR` and the schema created idempotently on every boot.

## Consequences

Boot is self-initialising: there are no migrations to run before the server accepts traffic, which
suits a single-container deploy but means schema changes must be written as idempotent `CREATE
TABLE IF NOT EXISTS` statements. `better-sqlite3` is synchronous and native, so it must stay on the
main thread and behind a thin repository boundary — if the app ever grows real concurrency, that
boundary is the seam to replace.
