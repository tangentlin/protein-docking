import 'molstar/lib/mol-plugin-ui/skin/dark.scss';
import 'molstar/lib/mol-plugin-ui/skin/light.scss';

import { Structure } from 'molstar/lib/mol-model/structure';
import { BuiltInTrajectoryFormat } from 'molstar/lib/mol-plugin-state/formats/trajectory';
import { PluginStateTransform, PluginStateObject } from 'molstar/lib/mol-plugin-state/objects';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { renderReact18 } from 'molstar/lib/mol-plugin-ui/react18';
import { DefaultPluginUISpec, PluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginBehaviors } from 'molstar/lib/mol-plugin/behavior';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { PluginConfig } from 'molstar/lib/mol-plugin/config';
import { PluginLayoutControlsDisplay } from 'molstar/lib/mol-plugin/layout';
import { PluginSpec } from 'molstar/lib/mol-plugin/spec';
import { StateObject } from 'molstar/lib/mol-state';
import { Task } from 'molstar/lib/mol-task';
import { Color } from 'molstar/lib/mol-util/color';
import { ColorNames } from 'molstar/lib/mol-util/color/names';
import { ParamDefinition } from 'molstar/lib/mol-util/param-definition';
import { ObjectKeys } from 'molstar/lib/mol-util/type-helpers';

import { StructurePreset } from './presets/structure-preset';
import { ShowButtons, ViewportComponent } from './viewport';

export { PLUGIN_VERSION as version } from 'molstar/lib/mol-plugin/version';
export { setDebugMode, setProductionMode } from 'molstar/lib/mol-util/debug';
export { Viewer as DockingRenderer };

// This component is adopted from molstar/src/apps/docking-viewer/index.ts
// With modification made to .create method, which takes structureData instead of url

const DefaultViewerOptions = {
  extensions: ObjectKeys({}),
  layoutIsExpanded: true,
  layoutShowControls: true,
  layoutShowRemoteState: true,
  layoutControlsDisplay: 'reactive' as PluginLayoutControlsDisplay,
  layoutShowSequence: true,
  layoutShowLog: true,
  layoutShowLeftPanel: true,

  viewportShowExpand: PluginConfig.Viewport.ShowExpand.defaultValue,
  viewportShowControls: PluginConfig.Viewport.ShowControls.defaultValue,
  viewportShowSettings: PluginConfig.Viewport.ShowSettings.defaultValue,
  viewportShowSelectionMode: PluginConfig.Viewport.ShowSelectionMode.defaultValue,
  viewportShowAnimation: PluginConfig.Viewport.ShowAnimation.defaultValue,
  pluginStateServer: PluginConfig.State.DefaultServer.defaultValue,
  volumeStreamingServer: PluginConfig.VolumeStreaming.DefaultServer.defaultValue,
  pdbProvider: PluginConfig.Download.DefaultPdbProvider.defaultValue,
  emdbProvider: PluginConfig.Download.DefaultEmdbProvider.defaultValue,
};

class Viewer {
  constructor(public plugin: PluginUIContext) {}

  static async create(
    elementOrId: string | HTMLElement,
    colors: readonly number[] = [Color(0x992211), Color(0xdddddd)],
    showButtons = true
  ) {
    const o = {
      ...DefaultViewerOptions,
      ...{
        layoutIsExpanded: false,
        layoutShowControls: false,
        layoutShowRemoteState: false,
        layoutShowSequence: true,
        layoutShowLog: false,
        layoutShowLeftPanel: true,

        viewportShowExpand: true,
        viewportShowControls: false,
        viewportShowSettings: false,
        viewportShowSelectionMode: false,
        viewportShowAnimation: false,
      },
    };
    const defaultSpec = DefaultPluginUISpec();

    const spec: PluginUISpec = {
      actions: defaultSpec.actions,
      behaviors: [
        PluginSpec.Behavior(PluginBehaviors.Representation.HighlightLoci, { mark: false }),
        PluginSpec.Behavior(PluginBehaviors.Representation.DefaultLociLabelProvider),
        PluginSpec.Behavior(PluginBehaviors.Camera.FocusLoci),

        PluginSpec.Behavior(PluginBehaviors.CustomProps.StructureInfo),
        PluginSpec.Behavior(PluginBehaviors.CustomProps.Interactions),
        PluginSpec.Behavior(PluginBehaviors.CustomProps.SecondaryStructure),
      ],
      animations: defaultSpec.animations,
      customParamEditors: defaultSpec.customParamEditors,
      layout: {
        initial: {
          isExpanded: o.layoutIsExpanded,
          showControls: o.layoutShowControls,
          controlsDisplay: o.layoutControlsDisplay,
        },
      },
      components: {
        ...defaultSpec.components,
        controls: {
          ...defaultSpec.components?.controls,
          top: o.layoutShowSequence ? undefined : 'none',
          bottom: o.layoutShowLog ? undefined : 'none',
          left: o.layoutShowLeftPanel ? undefined : 'none',
        },
        remoteState: o.layoutShowRemoteState ? 'default' : 'none',
        viewport: {
          view: ViewportComponent,
        },
      },
      config: [
        [PluginConfig.Viewport.ShowExpand, o.viewportShowExpand],
        [PluginConfig.Viewport.ShowControls, o.viewportShowControls],
        [PluginConfig.Viewport.ShowSettings, o.viewportShowSettings],
        [PluginConfig.Viewport.ShowSelectionMode, o.viewportShowSelectionMode],
        [PluginConfig.Viewport.ShowAnimation, o.viewportShowAnimation],
        [PluginConfig.State.DefaultServer, o.pluginStateServer],
        [PluginConfig.State.CurrentServer, o.pluginStateServer],
        [PluginConfig.VolumeStreaming.DefaultServer, o.volumeStreamingServer],
        [PluginConfig.Download.DefaultPdbProvider, o.pdbProvider],
        [PluginConfig.Download.DefaultEmdbProvider, o.emdbProvider],
        [ShowButtons, showButtons],
      ],
    };

    const element = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (!element) throw new Error(`Could not get element with id '${elementOrId}'`);
    const plugin = await createPluginUI({ target: element, spec, render: renderReact18 });

    (plugin.customState as any) = {
      colorPalette: {
        name: 'colors',
        params: { list: { colors } },
      },
    };

    PluginCommands.Canvas3D.SetSettings(plugin, {
      settings: {
        renderer: {
          ...plugin.canvas3d!.props.renderer,
          backgroundColor: ColorNames.white,
        },
        camera: {
          ...plugin.canvas3d!.props.camera,
          helper: { axes: { name: 'off', params: {} } },
        },
      },
    });

    return new Viewer(plugin);
  }

  async loadStructuresFromUrlsAndMerge(sources: readonly { structureData: string; format: BuiltInTrajectoryFormat }[]) {
    const structures: { ref: string }[] = [];
    for (const { structureData, format } of sources) {
      const data = await this.plugin.builders.data.rawData({ data: structureData });
      const trajectory = await this.plugin.builders.structure.parseTrajectory(data, format);
      const model = await this.plugin.builders.structure.createModel(trajectory);
      const modelProperties = await this.plugin.builders.structure.insertModelProperties(model);
      const structure = await this.plugin.builders.structure.createStructure(modelProperties || model);
      const structureProperties = await this.plugin.builders.structure.insertStructureProperties(structure);

      structures.push({ ref: structureProperties?.ref || structure.ref });
    }

    // remove current structures from hierarchy as they will be merged
    // TODO only works with using loadStructuresFromUrlsAndMerge once
    //      need some more API method to work with the hierarchy
    this.plugin.managers.structure.hierarchy.updateCurrent(
      this.plugin.managers.structure.hierarchy.current.structures,
      'remove'
    );

    const dependsOn = structures.map(({ ref }) => ref);
    const data = this.plugin.state.data.build().toRoot().apply(MergeStructures, { structures }, { dependsOn });
    const structure = await data.commit();
    const structureProperties = await this.plugin.builders.structure.insertStructureProperties(structure);
    this.plugin.behaviors.canvas3d.initialized.subscribe(async v => {
      await this.plugin.builders.structure.representation.applyPreset(
        structureProperties || structure,
        StructurePreset
      );
    });
  }
}

type MergeStructures = typeof MergeStructures;
const MergeStructures = PluginStateTransform.BuiltIn({
  name: 'merge-structures',
  display: { name: 'Merge Structures', description: 'Merge Structure' },
  from: PluginStateObject.Root,
  to: PluginStateObject.Molecule.Structure,
  params: {
    structures: ParamDefinition.ObjectList(
      {
        ref: ParamDefinition.Text(''),
      },
      ({ ref }) => ref,
      { isHidden: true }
    ),
  },
})({
  apply({ params, dependencies }) {
    return Task.create('Merge Structures', async ctx => {
      if (params.structures.length === 0) return StateObject.Null;

      const first = dependencies![params.structures[0].ref].data as Structure;
      const builder = Structure.Builder({ masterModel: first.models[0] });
      for (const { ref } of params.structures) {
        const s = dependencies![ref].data as Structure;
        for (const unit of s.units) {
          // TODO invariantId
          builder.addUnit(unit.kind, unit.model, unit.conformation.operator, unit.elements, unit.traits);
        }
      }

      const structure = builder.getStructure();
      return new PluginStateObject.Molecule.Structure(structure, { label: 'Merged Structure' });
    });
  },
});

// (window as any).DockingViewer = Viewer;
