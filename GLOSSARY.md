# Booking

A single shared call-booking calendar: a guest picks a slot, names an event type,
and is booked without an account.

## Language

**Event Type**:
A bookable kind of meeting, defined by a title, a description, and a duration in minutes (any whole
number from 1 to 480). Every booking is for exactly one event type. Event types are created and
listed by the owner; they are never edited or deleted.
_Avoid_: Event, Service, Offering, Appointment type

**Slot**:
An atomic bookable unit of time on the calendar, thirty minutes long, starting at any half hour
from 09:00 to 17:30 so that the working day ends at 18:00. A slot belongs to the calendar rather
than to any one event type — occupying a slot blocks it for every event type.
_Avoid_: Time, Time slot, Window, Opening

**Booking**:
A guest's reservation of exactly one slot for exactly one event type, captured with the guest's
name and email. A booking consumes one slot and one slot only, whatever the event type's duration:
duration describes the meeting, not the footprint it reserves. A booking has no lifecycle beyond
being made — it is never edited or cancelled. Russian UI copy calls this a «запись».
_Avoid_: Reservation, Appointment, Meeting, Event, Бронь, Событие

**Owner**:
The single preset profile that creates event types and browses all bookings. The owner is
decorative: nothing is authenticated and the profile grants no access anyone does not already have.
_Avoid_: Admin, User, Account, Operator

**Calendar**:
The one shared, bookable timeline that every slot belongs to. There is only ever one; it has no
identity of its own and is never created or listed.
_Avoid_: Schedule, Agenda, Diary

**Booking window**:
The stretch of days ahead of today in which slots may be booked: today and the following thirteen
days. The server never offers a slot whose start time has already passed, so the usable part of
today shrinks as the day goes on.
_Avoid_: Horizon, Booking period

## Limits

Every value below is a domain rule, enforced by the server and mirrored by the client for feedback.
They are recorded here so they have one home before the API contract carries them.

- **Guest name**: 1–100 characters, trimmed; empty after trimming is invalid.
- **Guest email**: required, at most 254 characters, one `@` with a non-empty local and domain part.
  Deliberately loose — the only real verification would be a confirmation mail, which we do not send.
- **Event type title**: 1–120 characters.
- **Event type description**: at most 1000 characters.
- **Event type duration**: a whole number of minutes from 1 to 480. It need not be a multiple of 30,
  because it does not determine how many slots a booking takes.
- **Event type id**: supplied by the owner rather than assigned by the server. A lowercase slug of
  letters, digits and hyphens, 1–50 characters. It is the primary key, it appears in the
  `/book/:eventTypeId` URL, and because the owner supplies it, a duplicate is a conflict rather than
  a silent overwrite.
- **Booking date**: a real calendar date inside the booking window.
- **Booking id**: assigned by the server at creation, never supplied by the guest. Read-only in the
  contract: present in responses, absent from anything the guest submits. It identifies a booking for
  the bookings table only; whether a slot is free is decided by the unique index on
  `(date, startMinutes)`, not by any id.
- **Booking creation time**: set by the server when the booking is made, and read-only. It records
  when a booking arrived, which is not the same question as when its slot is — an owner's list sorted
  by slot cannot otherwise show that a booking for next week was made three days ago.
- **Slot start**: a half hour from 09:00 to 17:30 whose time has not already passed.

## Not in this domain

There is no authentication. No one signs in, no guest can be identified as the same person twice,
and every endpoint — including the admin ones — is open to anyone who can reach the app.
