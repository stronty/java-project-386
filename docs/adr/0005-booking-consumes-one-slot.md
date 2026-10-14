# One booking consumes one 30-minute slot regardless of event type duration

An event type carries a `durationMinutes` that can be any whole number from 1 to 480, and it would
have been reasonable for a long event type to reserve several consecutive slots. We decided against
that: a booking always takes exactly one 30-minute slot, and `durationMinutes` is stored and
displayed only.

## Consequences

Booking stays a single-row insert with no multi-slot allocation or rollback, and the occupancy model
stays exactly one boolean per slot. The trade-off is that a 480-minute meeting is advertised at 30
minutes of footprint, so the calendar understates how busy a day really is — the value describes the
meeting, not the space it reserves.
