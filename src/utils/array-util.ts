export type ItemEqualityDelegate = (a: unknown, b: unknown) => boolean;
export interface AreArrayEqualOption {
  equalityDelegate: ItemEqualityDelegate;
}

export const strictEquality: ItemEqualityDelegate = (a: unknown, b: unknown) => a === b;
export const deepEquality: ItemEqualityDelegate = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function areArrayEqual(
  a: readonly unknown[] | undefined | null,
  b: readonly unknown[] | undefined | null,
  option: Partial<AreArrayEqualOption> = {}
): boolean {
  const { equalityDelegate = strictEquality } = option;

  if (a == null && b == null) {
    return true;
  }

  if (a == null || b == null) {
    return false;
  }

  if (a.length !== b.length) {
    return false;
  }

  return a.every((item, index) => {
    return equalityDelegate(item, b[index]);
  });
}
