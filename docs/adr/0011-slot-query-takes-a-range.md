# The slot query takes a range, not a single date

ADR 0006 decided that slot queries take an explicit date and never a range, so that slot queries stay
trivially bounded. The calendar, though, shows the whole booking window with a free count per day, so
one date per request would mean fourteen requests to render a single view — slow, and liable to show
counts that disagree with each other because each day was fetched at a different moment.

We decided to amend ADR 0006's query consequence: `GET /api/slots` takes a `from` and a `to`, with a
range of at most fourteen days, and returns per day that day's slots together with a free count. Every
slot in the grid is returned with a `booked` flag rather than only the free ones, so the client renders
a full working day and greys out what is taken. Today's slots that have already started are left out
rather than returned as unavailable. The free count is computed after that omission, so it equals the
number of unbooked slots actually returned.

## Consequences

One request renders the whole window, at the cost of a larger response and a range parameter the
server must validate — a range longer than fourteen days is a `400`. ADR 0006's window definition is
untouched: the range is still clamped by today plus 13 days, and the rule about never offering a passed
slot is what produces today's omission. The client formats `startMinutes` for display, so it is the
client that turns integers into `HH:MM`, not the server.
