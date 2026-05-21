// USE_HEADSHOTS forces every PatientAvatar to the silhouette fallback when false (spec §8) —
// the safety valve if seeded headshots render poorly. Vite exposes only VITE_-prefixed env to
// the client; defaults to true when unset.
export const USE_HEADSHOTS = import.meta.env.VITE_USE_HEADSHOTS !== 'false';
