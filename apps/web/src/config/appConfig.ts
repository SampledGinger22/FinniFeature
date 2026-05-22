// USE_HEADSHOTS forces every PatientAvatar to the silhouette fallback when false (spec §8) —
// the safety valve if seeded headshots render poorly. Vite exposes only VITE_-prefixed env to
// the client; defaults to true when unset.
export const USE_HEADSHOTS = import.meta.env.VITE_USE_HEADSHOTS !== 'false';

// Demo provider identity for the sidebar chip. No auth exists (D7); this is the fixed stand-in
// for "the signed-in clinician" so the workspace reads as a real product, not seeded PHI.
export const DEMO_PROVIDER = { name: 'Dr. Jamie Kim', credential: 'BCBA · Lead', initials: 'JK' } as const;
