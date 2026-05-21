# Finni Patient CRM — Product Brief

> Audience: non-technical reviewers and product stakeholders. This document explains
> what the product is, who it serves, and why it is built the way it is. No engineering
> knowledge required.

## The one-sentence version

A patient management dashboard for ABA care providers that makes finding the right
patients effortless — built around care for the _provider_, not just administration.

## Who this is for

Applied Behavior Analysis (ABA) providers managing a caseload of patients across the
full care lifecycle — from first inquiry, through onboarding, into active care, and
sometimes a pause or a discharge. This is a **provider-facing** tool. Patients and
families never see it.

## The problem we are solving

Providers have told us their existing dashboards make patient management painful. The
specific pain is not _storing_ patient data — every system does that. The pain is
_finding_ the right patients quickly. A provider needs to answer questions like:

> "Who are all my patients in intake who live in New York and are under 30?"

In most tools, answering that means exporting a spreadsheet, or clicking through pages,
or giving up. Our entire product is organized around making that question take two
clicks.

## The design thesis: care for the provider

Most practice software treats the provider as a data-entry clerk. We treat them as a
person doing emotionally demanding work. That belief shows up in concrete choices:

- **Patients are people, not rows.** The default view shows patient cards with a
  photo, so a caseload feels human at a glance — not like a database table.
- **The day opens on people, not metrics.** A "Your day" view leads with who needs
  attention today, framed warmly, rather than a wall of numbers.
- **The interface is calm.** Warm, rounded, low-strain visuals adapted from Finni's
  own brand — plus an eye-strain palette and dyslexia-friendly font option for the
  long hours providers actually work.

This is the thing a reviewer should _feel_, not just read.

## What a provider can do (v1)

### Find patients fast — the hero feature

Filter the caseload by status, location, and age simultaneously, with live result
counts as filters are applied. The "intake patients in New York under 30" question is
answerable in seconds. Three ways to look at the same caseload:

- **Card view** (default) — warm, human, photo-forward. Best for browsing.
- **Table view** — dense and sortable. Best for the precise multi-filter question.
- **Board view** — patients arranged in columns by status, draggable between them.
  Best for seeing the shape of a caseload and moving someone forward a stage.

All three read from the same data and the same filters — switching views never loses
your place or your filters.

### Manage patient records

- **Add a patient** via a full-height panel that slides up from the bottom.
- **Edit a patient** via a panel that slides in from the right, so the list stays
  visible behind it.
- Each patient carries: name (first, optional middle, last), date of birth, status,
  one or more addresses, one or more contact methods (email/phone), and an
  insurance-on-file indicator.

### See the lifecycle clearly

Every patient sits in one of six stages, shown as a colored tag everywhere they appear:

| Stage      | Meaning                                 |
| ---------- | --------------------------------------- |
| Inquiry    | First contact; not yet qualified        |
| Waitlisted | Qualified, awaiting capacity            |
| Onboarding | Actively being set up for care          |
| Active     | Receiving care                          |
| Paused     | Temporarily not being seen (reversible) |
| Churned    | No longer with the practice             |

> _Note on the lifecycle:_ the original brief named four stages (Inquiry, Onboarding,
> Active, Churned). We added **Waitlisted** and **Paused** because real ABA practices
> live in those states — long waitlists are endemic to the field, and patients
> routinely pause for travel, insurance lapses, or medical reasons. This is recorded
> as a deliberate decision, not an accident. See the decision log.

### Archive and remove, safely

- **Archive** hides an inactive patient from the default view without deleting
  anything — fully reversible.
- **Delete** is a _soft_ delete: the patient disappears from the app but is recoverable
  for 30 days before being permanently purged. This protects against accidental loss of
  medical records.

### Personalize the workspace

A settings area lets the provider choose font size, font family (including a
dyslexia-friendly option), a standard or reduced-eye-strain color palette, layout
density, and timezone. Preferences persist on their device between sessions.

### Demo controls

Because this is a demonstration build, a clearly-separated "Demo controls" area lets a
reviewer reset the data: **purge** expired deletions (the real lifecycle behavior made
visible), **reseed** fresh sample data, or go to a **blank slate** to see how the app
handles an empty caseload gracefully. These controls would not exist in a production
build.

## What is intentionally _not_ in v1

We scoped wide, then deliberately narrowed based on the founder's clarifications. The
following are documented as planned next-iteration work, not built now:

- Billing, claims, and revenue views (explicitly out of scope per clarification)
- Sales-pipeline-as-revenue tooling
- Appointment scheduling with a real calendar (the "Your day" view leans on patient
  status today; calendar-backed scheduling is the natural next step)
- Guardian/caregiver records distinct from the patient
- Multi-user accounts and authentication

Showing this list is itself part of the product thinking: it demonstrates that scope
was a choice, with reasoning, rather than an oversight.
