# Double-booking is prevented by a unique index, not a read-then-write check

Two guests can race to take the same slot. The obvious fix — read to see whether the slot is free,
then insert — is wrong under concurrency, because both requests see it free. We decided instead to
put a unique index on `(date, startMinutes)` and treat the resulting constraint violation as the
answer: the insert is attempted, and the violation is mapped to a `409`.

## Consequences

The database, not the application, is the single arbiter of whether a slot is taken, so correctness
does not depend on the code path that checks it. The cost is that "is this slot booked?" must
sometimes be answered by catching an exception rather than by a query, and that constraint-violation
error codes have to be translated carefully — a violation from any other unique constraint must not
be reported as a slot conflict.
