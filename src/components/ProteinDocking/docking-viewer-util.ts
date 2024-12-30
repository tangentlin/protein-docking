import { SortedArray, OrderedSet } from 'molstar/lib/mol-data/int';
import { Structure, StructureElement, StructureProperties, Unit } from 'molstar/lib/mol-model/structure';
import { Loci } from 'molstar/lib/mol-model/structure/structure/element/loci';
import { UnitIndex } from 'molstar/lib/mol-model/structure/structure/element/util';
import { FocusEntry } from 'molstar/lib/mol-plugin-state/manager/structure/focus';
import { StructureRef } from 'molstar/lib/mol-plugin-state/manager/structure/hierarchy-state';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { ActionMenu } from 'molstar/lib/mol-plugin-ui/controls/action-menu';
import { lociLabel } from 'molstar/lib/mol-theme/label';

export function zoomToLigand(plugin: PluginUIContext) {
  const items = getSelectionItems(plugin.managers.structure.hierarchy.selection.structures);
  const ligandLoci = getLigandItemLoci(items);

  if (ligandLoci != null) {
    plugin.managers.camera.focusLoci(ligandLoci, {
      durationMs: 250,
    });
    plugin.managers.interactivity.lociSelects.select({ loci: ligandLoci });
  }
}

function getLigandItemLoci(items: readonly ActionMenu.Items[]): Loci | null {
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    if (Array.isArray(item)) {
      const suspect = getLigandItemLoci(item);
      if (suspect != null) {
        return suspect;
      }
    }
    if ((item as ActionMenu.Item).kind === 'item') {
      const menuItem = item as ActionMenu.Item;
      if ((menuItem.value as any).loci != null) {
        return menuItem.value as any as Loci;
      }
    }
  }

  return null;
}

// This function is lifted from mol-plugin-ui/structure/focus.tsx
export function getSelectionItems(structures: ReadonlyArray<StructureRef>): ActionMenu.Items[] {
  const presetItems: ActionMenu.Items[] = [];
  for (const s of structures) {
    const d = s.cell.obj?.data;
    if (d) {
      const entries = getFocusEntries(d);
      if (entries.length > 0) {
        presetItems.push([
          ActionMenu.Header(d.label, { description: d.label }),
          ...ActionMenu.createItems(entries, {
            label: f => f.label,
            category: f => f.category,
            description: f => f.label,
          }),
        ]);
      }
    }
  }
  return presetItems;
}

function getFocusEntries(structure: Structure) {
  const entityEntries = new Map<string, FocusEntry[]>();
  const l = StructureElement.Location.create(structure);

  for (const ug of structure.unitSymmetryGroups) {
    if (!Unit.isAtomic(ug.units[0])) continue;

    l.unit = ug.units[0];
    l.element = ug.elements[0];
    const isMultiChain = Unit.Traits.is(l.unit.traits, Unit.Trait.MultiChain);
    const entityType = StructureProperties.entity.type(l);
    const isNonPolymer = entityType === 'non-polymer';
    const isBranched = entityType === 'branched';
    const isBirdMolecule = !!StructureProperties.entity.prd_id(l);

    if (isBirdMolecule) {
      addSymmetryGroupEntries(entityEntries, l, ug, 'chain');
    } else if (isNonPolymer && !isMultiChain) {
      addSymmetryGroupEntries(entityEntries, l, ug, 'residue');
    } else if (isBranched || (isNonPolymer && isMultiChain)) {
      const u = l.unit;
      const { index: residueIndex } = u.model.atomicHierarchy.residueAtomSegments;
      let prev = -1;
      for (let i = 0, il = u.elements.length; i < il; ++i) {
        const eI = u.elements[i];
        const rI = residueIndex[eI];
        if (rI !== prev) {
          l.element = eI;
          addSymmetryGroupEntries(entityEntries, l, ug, 'residue');
          prev = rI;
        }
      }
    }
  }

  const entries: FocusEntry[] = [];
  entityEntries.forEach((e, name) => {
    if (e.length === 1) {
      entries.push({ label: `${name}: ${e[0].label}`, loci: e[0].loci });
    } else if (e.length < 2000) {
      entries.push(...e);
    }
  });

  return entries;
}

function addSymmetryGroupEntries(
  entries: Map<string, FocusEntry[]>,
  location: StructureElement.Location,
  unitSymmetryGroup: Unit.SymmetryGroup,
  granularity: 'residue' | 'chain'
) {
  const idx = SortedArray.indexOf(location.unit.elements, location.element) as UnitIndex;
  const base = StructureElement.Loci(location.structure, [
    { unit: location.unit, indices: OrderedSet.ofSingleton(idx) },
  ]);
  const extended =
    granularity === 'residue'
      ? StructureElement.Loci.extendToWholeResidues(base)
      : StructureElement.Loci.extendToWholeChains(base);
  const name = StructureProperties.entity.pdbx_description(location).join(', ');

  for (const u of unitSymmetryGroup.units) {
    const loci = StructureElement.Loci(extended.structure, [{ unit: u, indices: extended.elements[0].indices }]);

    let label = lociLabel(loci, { reverse: true, hidePrefix: true, htmlStyling: false, granularity });
    if (!label) label = lociLabel(loci, { hidePrefix: false, htmlStyling: false });
    if (unitSymmetryGroup.units.length > 1) {
      label += ` | ${loci.elements[0].unit.conformation.operator.name}`;
    }
    const item: FocusEntry = { label, category: name, loci };

    if (entries.has(name)) entries.get(name)!.push(item);
    else entries.set(name, [item]);
  }
}
