import {
  presetStaticComponent,
  StructureRepresentationPresetProvider,
} from 'molstar/lib/mol-plugin-state/builder/structure/representation-preset';
import { StateObjectRef } from 'molstar/lib/mol-state/object';

import { CustomMaterial, PresetParams, shinyStyle } from './preset-common';

export const StructurePreset = StructureRepresentationPresetProvider({
  id: 'preset-structure',
  display: { name: 'Structure' },
  params: () => PresetParams,
  async apply(ref, params, plugin) {
    const structureCell = StateObjectRef.resolveAndCheck(plugin.state.data, ref);
    if (!structureCell) return {};

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
          typeParams: { ...typeParams, material: CustomMaterial, sizeFactor: 0.35 },
          color: 'element-symbol',
          colorParams: { carbonColor: { name: 'element-symbol', params: {} } },
        },
        { tag: 'ligand' }
      ),
      polymer: builder.buildRepresentation(
        update,
        components.polymer,
        {
          type: 'cartoon',
          typeParams: { ...typeParams, material: CustomMaterial },
          color: 'chain-id',
          colorParams: { palette: (plugin.customState as any).colorPalette },
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
