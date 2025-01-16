import {
  presetStaticComponent,
  StructureRepresentationPresetProvider,
} from 'molstar/lib/mol-plugin-state/builder/structure/representation-preset';
import { StateObjectRef } from 'molstar/lib/mol-state/object';

import { occlusionStyle, PresetParams } from './preset-common';

export const IllustrativePreset = StructureRepresentationPresetProvider({
  id: 'preset-illustrative',
  display: { name: 'Illustrative' },
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
          type: 'spacefill',
          typeParams: { ...typeParams, ignoreLight: true },
          color: 'element-symbol',
          colorParams: { carbonColor: { name: 'element-symbol', params: {} } },
        },
        { tag: 'ligand' }
      ),
      polymer: builder.buildRepresentation(
        update,
        components.polymer,
        {
          type: 'spacefill',
          typeParams: { ...typeParams, ignoreLight: true },
          color: 'illustrative',
          colorParams: { palette: (plugin.customState as any).colorPalette },
        },
        { tag: 'polymer' }
      ),
    };

    await update.commit({ revertOnError: true });
    await occlusionStyle(plugin);
    plugin.managers.interactivity.setProps({ granularity: 'residue' });

    return { components, representations };
  },
});
