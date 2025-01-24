import { InteractionsRepresentationProvider } from 'molstar/lib/mol-model-props/computed/representations/interactions';
import { InteractionTypeColorThemeProvider } from 'molstar/lib/mol-model-props/computed/themes/interaction-type';
import {
  StructureRepresentationPresetProvider,
  presetStaticComponent,
} from 'molstar/lib/mol-plugin-state/builder/structure/representation-preset';
import { StateObjectRef } from 'molstar/lib/mol-state';
import { Color } from 'molstar/lib/mol-util/color';

import { PresetParams, CustomMaterial, shinyStyle, ligandSurroundings } from './preset-common';

export const Interaction3Preset = StructureRepresentationPresetProvider({
  id: 'preset-interaction-3',
  display: { name: 'Interaction 3' },
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
      polymer: await presetStaticComponent(plugin, structureCell, 'polymer'),
      interactions: await presetStaticComponent(plugin, structureCell, 'ligand'),
    };

    const { update, builder, typeParams } = StructureRepresentationPresetProvider.reprBuilder(plugin, params);
    const representations = {
      ligand: builder.buildRepresentation(
        update,
        components.ligand,
        {
          type: 'ball-and-stick',
          typeParams: { ...typeParams, material: CustomMaterial, sizeFactor: 0.3 },
          color: 'element-symbol',
          colorParams: { carbonColor: { name: 'element-symbol', params: {} } },
        },
        { tag: 'ligand' }
      ),
      ballAndStick: builder.buildRepresentation(
        update,
        components.surroundings,
        {
          type: 'ball-and-stick',
          typeParams: { ...typeParams, material: CustomMaterial, sizeFactor: 0.1, sizeAspectRatio: 1 },
          color: 'element-symbol',
          colorParams: { carbonColor: { name: 'element-symbol', params: {} } },
        },
        { tag: 'ball-and-stick' }
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
      interactions: builder.buildRepresentation(
        update,
        components.interactions,
        {
          type: InteractionsRepresentationProvider,
          typeParams: { ...typeParams, material: CustomMaterial, includeParent: true, parentDisplay: 'between' },
          color: InteractionTypeColorThemeProvider,
        },
        { tag: 'interactions' }
      ),
      label: builder.buildRepresentation(
        update,
        components.surroundings,
        {
          type: 'label',
          typeParams: { ...typeParams, material: CustomMaterial, background: false, borderWidth: 0.1 },
          color: 'uniform',
          colorParams: { value: Color(0x000000) },
        },
        { tag: 'label' }
      ),
    };

    await update.commit({ revertOnError: true });
    await shinyStyle(plugin);
    plugin.managers.interactivity.setProps({ granularity: 'element' });

    return { components, representations };
  },
});
