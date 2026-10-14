# The API is JSON REST under /api with one error body shape

We decided to expose the backend as JSON REST under `/api`, with every error returning a single
body shape — `{ message }` — and status codes limited to `400` for invalid input, `404` for a missing
resource, and `409` for a conflict such as an already-taken slot.

## Consequences

Clients can render any error without branching on error type, and the `{ message }` field is
presentable in Russian for the guest-facing UI without a translation layer per endpoint. The cost is
that machine-readable error codes do not exist, so the frontend cannot branch on _why_ a request
failed beyond the status code.
