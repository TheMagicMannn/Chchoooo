// Pre-computed threat map geometry — no runtime d3-geo dependency.
import data from "@/data/threat-map-data.json";

export type Pt = { id: string; name: string; x: number; y: number };
export type Origin = Pt & { intensity: number };
export type Target = Pt & { primary?: boolean };

export const MAP_W: number = data.width;
export const MAP_H: number = data.height;
export const dots: number[][] = data.dots as number[][];
export const origins = data.origins as Origin[];
export const targets = data.targets as Target[];
export const arcs = data.arcs as { id: number; d: string }[];
