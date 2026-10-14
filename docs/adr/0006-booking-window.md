# The booking window is today plus 13 days, and past slots are never offered

_Partly amended by ADR 0011, which replaces the query consequence below. The window definition
itself — today plus 13 days, never offering a passed slot — still stands._

We decided that the bookable window is today and the following thirteen days — fourteen days in
total. Separately, the server never offers a slot whose start time has already passed, so the usable
part of today shrinks as the day goes on.

## Consequences

The window bounds how far ahead the client needs to fetch, so slot queries take an explicit date and
never a range. Because the two rules are separate, a mid-session guest can find that a slot they
were just looking at is no longer bookable; that is expected and surfaces as a `409`, not as the slot
being silently hidden.
