import {
  StructureRepresentationPresetProvider,
  presetStaticComponent,
} from 'molstar/lib/mol-plugin-state/builder/structure/representation-preset';
import { StateObjectRef } from 'molstar/lib/mol-state';

import { PresetParams, CustomMaterial, shinyStyle, ligandSurroundings } from './preset-common';

export const PocketPreset = StructureRepresentationPresetProvider({
  id: 'preset-pocket',
  display: { name: 'Pocket' },
  params: () => PresetParams,
  async apply(ref, params, plugin) {
    const structureCell = StateObjectRef.resolveAndCheck(plugin.state.data, ref);
    const structure = structureCell?.obj?.data;
    if (!structureCell || !structure) return {};

    const components = {
      ligand: await presetStaticComponent(plugin, structureCell, 'ligand'),
      surroundings: await plugin.builders.structure.tryCreateComponentFromSelection(
        structureCell,
        ligandSurroundings,
        `surroundings`
      ),
    };

    const { update, builder, typeParams } = StructureRepresentationPresetProvider.reprBuilder(plugin, params);
    const representations = {
      ligand: builder.buildRepresentation(
        update,
        components.ligand,
        {
          type: 'ball-and-stick',
          typeParams: { ...typeParams, material: CustomMaterial, sizeFactor: 0.26 },
          color: 'element-symbol',
          colorParams: { carbonColor: { name: 'element-symbol', params: {} } },
        },
        { tag: 'ligand' }
      ),
      surroundings: builder.buildRepresentation(
        update,
        components.surroundings,
        {
          type: 'molecular-surface',
          typeParams: {
            ...typeParams,
            material: CustomMaterial,
            includeParent: true,
            quality: 'custom',
            resolution: 0.2,
            doubleSided: true,
          },
          color: 'partial-charge',
        },
        { tag: 'surroundings' }
      ),
    };

    await update.commit({ revertOnError: true });
    await shinyStyle(plugin);
    plugin.managers.interactivity.setProps({ granularity: 'element' });

    return { components, representations };
  },
});
