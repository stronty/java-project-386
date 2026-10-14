# Slot times are a date plus minutes-from-midnight

Slot times are the one piece of state every part of the app touches, so we fixed their
representation deliberately: a slot stores a calendar date as `YYYY-MM-DD` plus `startMinutes` as an
integer offset from midnight in that day. All time reasoning happens in one timezone, taken from the
`TZ` environment variable, and the slot-grid constants (30-minute length, 09:00 earliest start,
17:30 latest start, 18:00 end) live in a single config module rather than being repeated at each
use site.

## Consequences

No timezone is ever persisted alongside a slot: a booking means the same wall-clock time in whatever
timezone `TZ` names when the app runs, so changing `TZ` silently shifts what a stored slot means.
In exchange, all arithmetic is plain integer maths with no offset arithmetic, and there is exactly
one place to change the working day if it ever moves.
