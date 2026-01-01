import type { Coordinates } from "$lib/types";

export const toPgCoordinates = (coordinates: Coordinates): string => {
  return `(${coordinates[0]}, ${coordinates[1]})`;
}

export const fromPgCoordinates = (pgCoordinates: string): Coordinates => {
  const coords = pgCoordinates
    .replace('(', '')
    .replace(')', '')
    .split(',')
    .map(coord => parseFloat(coord.trim()));
  return [coords[0], coords[1]];
}
