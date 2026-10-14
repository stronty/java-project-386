# Seeding creates two event types always, example bookings only outside production

We decided that boot always seeds two event types, so the booking flow is never empty, and that
example bookings are seeded only outside production and in test. Seeding is idempotent and runs on
every boot.

## Consequences

A fresh dev or test environment is immediately usable without manual setup, and a production boot
never fills the calendar with fake guest names and emails. Because seeding is idempotent it must
match on stable keys rather than counting rows, or each restart would add a second copy.
