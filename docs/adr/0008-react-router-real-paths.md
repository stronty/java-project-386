# Frontend routing uses react-router-dom with real paths

We decided to route the frontend with `react-router-dom` over real paths — `/`, `/book`,
`/book/:eventTypeId`, `/bookings`, and `/admin` — rather than managing view state inside a single
page component.

## Consequences

Each screen is linkable, reloadable, and back-button friendly, and the backend's existing SPA
fallback already serves `index.html` for these paths, so no extra server configuration is needed.
The trade-off is that client-side navigation has to be threaded through the router rather than local
component state.
