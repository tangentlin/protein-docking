import {
  StructureRepresentationPresetProvider,
  presetStaticComponent,
} from 'molstar/lib/mol-plugin-state/builder/structure/representation-preset';
import { StateObjectRef } from 'molstar/lib/mol-state';

import { PresetParams, CustomMaterial, shinyStyle } from './preset-common';

export const SurfacePreset = StructureRepresentationPresetProvider({
  id: 'preset-surface',
  display: { name: 'Surface' },
  params: () => PresetParams,
  async apply(ref, params, plugin) {
    const structureCell = StateObjectRef.resolveAndCheck(plugin.state.data, ref);
    const structure = structureCell?.obj?.data;
    if (!structureCell || !structure) return {};

    const components = {
      ligand: await presetStaticComponent(plugin, structureCell, 'ligand'),
      polymer: await presetStaticComponent(plugin, structureCell, 'polymer'),
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
      polymer: builder.buildRepresentation(
        update,
        components.polymer,
        {
          type: 'molecular-surface',
          typeParams: {
            ...typeParams,
            material: CustomMaterial,
            quality: 'custom',
            resolution: 0.5,
            doubleSided: true,
          },
          color: 'partial-charge',
        },
        { tag: 'polymer' }
      ),
    };

    await update.commit({ revertOnError: true });
    await shinyStyle(plugin);
    plugin.managers.interactivity.setProps({ granularity: 'residue' });

    return { components, representations };
  },
});
