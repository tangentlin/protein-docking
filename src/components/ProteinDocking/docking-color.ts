export type DockingDefaultColorType = 'protein' | 'ligand';

export const dockingDefaultColor: Readonly<Record<DockingDefaultColorType, number>> = {
  protein: 0x33dd22,
  ligand: 0x1133ee,
} as const;
