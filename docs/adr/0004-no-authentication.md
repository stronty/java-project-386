# No authentication; the owner is a decorative preset profile

The booking app has no sign-in, no accounts, and no sessions. We decided to keep it that way: there
is a single Owner profile, it is decorative, and it grants no capability that an anonymous caller
does not already have. The admin endpoints that create event types and list all bookings are open
to anyone who can reach the app.

## Consequences

This is a deliberate non-goal recorded so it is not later mistaken for an oversight and "fixed" by
adding auth. It makes the app trivially deployable and means guest bookings need no identity, at the
cost that anyone on the network can create event types and read every guest's name and email. If the
app is ever exposed publicly, that trade has to be revisited deliberately rather than assumed
safe.
