# Frontend routing uses react-router-dom with real paths

We decided to route the frontend with `react-router-dom` over real paths — `/`, `/book`,
`/book/:eventTypeId`, `/book/:eventTypeId/confirmed`, `/bookings`, and `/admin` — rather than
managing view state inside a single page component.

The confirmation path was added later: a booking ends on a dedicated screen rather than an in-place
success state, because an in-place state dies on reload. It carries the date and the slot start as
query parameters so a reload survives, and missing or invalid parameters redirect back to
`/book/:eventTypeId`.

## Consequences

Each screen is linkable, reloadable, and back-button friendly, and the backend's existing SPA
fallback already serves `index.html` for these paths, so no extra server configuration is needed.
The trade-off is that client-side navigation has to be threaded through the router rather than local
component state. Carrying the confirmed booking's details in the URL makes them visible and
bookmarkable, which is acceptable only because they are the guest's own just-made booking and carry
nothing secret.
