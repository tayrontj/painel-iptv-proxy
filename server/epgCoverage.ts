export function shouldRefreshEpg(input: { coverageEndsAt?: Date | null; refreshThresholdHours: number; lastSyncFailed?: boolean; now?: Date }) {
  if (input.lastSyncFailed || !input.coverageEndsAt) return true;
  const now = input.now ?? new Date();
  const remainingHours = (input.coverageEndsAt.getTime() - now.getTime()) / 3_600_000;
  return remainingHours <= input.refreshThresholdHours;
}
