import { StructureRepresentationPresetProvider } from 'molstar/lib/mol-plugin-state/builder/structure/representation-preset';
import {
  StructureSelectionQueries,
  StructureSelectionQuery,
} from 'molstar/lib/mol-plugin-state/helpers/structure-selection-query';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { MolScriptBuilder } from 'molstar/lib/mol-script/language/builder';
import { Color } from 'molstar/lib/mol-util/color/color';
import { Material } from 'molstar/lib/mol-util/material';

export const ligandPlusSurroundings = StructureSelectionQuery(
  'Surrounding Residues (5 \u212B) of Ligand plus Ligand itself',
  MolScriptBuilder.struct.modifier.union([
    MolScriptBuilder.struct.modifier.includeSurroundings({
      0: StructureSelectionQueries.ligand.expression,
      radius: 5,
      'as-whole-residues': true,
    }),
  ])
);

export const ligandSurroundings = StructureSelectionQuery(
  'Surrounding Residues (5 \u212B) of Ligand',
  MolScriptBuilder.struct.modifier.union([
    MolScriptBuilder.struct.modifier.exceptBy({
      0: ligandPlusSurroundings.expression,
      by: StructureSelectionQueries.ligand.expression,
    }),
  ])
);

export function shinyStyle(plugin: PluginContext) {
  return PluginCommands.Canvas3D.SetSettings(plugin, {
    settings: {
      renderer: {
        ...plugin.canvas3d!.props.renderer,
      },
      postprocessing: {
        ...plugin.canvas3d!.props.postprocessing,
        occlusion: { name: 'off', params: {} },
        shadow: { name: 'off', params: {} },
        outline: { name: 'off', params: {} },
      },
    },
  });
}

export function occlusionStyle(plugin: PluginContext) {
  return PluginCommands.Canvas3D.SetSettings(plugin, {
    settings: {
      renderer: {
        ...plugin.canvas3d!.props.renderer,
      },
      postprocessing: {
        ...plugin.canvas3d!.props.postprocessing,
        outline: {
          name: 'on',
          params: {
            scale: 1.0,
            threshold: 0.33,
            color: Color(0x0000),
            includeTransparent: true,
          },
        },
        shadow: { name: 'off', params: {} },
      },
    },
  });
}

export const PresetParams = {
  ...StructureRepresentationPresetProvider.CommonParams,
};

export const CustomMaterial = Material({ roughness: 0.2, metalness: 0 });
