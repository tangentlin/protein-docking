/**
 * Copyright (c) 2020-2024 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */
import { Button, Stack } from '@mui/material';
import { StructureRepresentationPresetProvider } from 'molstar/lib/mol-plugin-state/builder/structure/representation-preset';
import { StructureRef } from 'molstar/lib/mol-plugin-state/manager/structure/hierarchy-state';
import { PluginUIComponent } from 'molstar/lib/mol-plugin-ui/base';
import { LociLabels } from 'molstar/lib/mol-plugin-ui/controls';
import { BackgroundTaskProgress } from 'molstar/lib/mol-plugin-ui/task';
import { Toasts } from 'molstar/lib/mol-plugin-ui/toast';
import { Viewport, ViewportControls } from 'molstar/lib/mol-plugin-ui/viewport';
import { PluginConfig } from 'molstar/lib/mol-plugin/config';

import { IllustrativePreset } from './presets/illustrative-preset';
import { Interaction3Preset } from './presets/interaction-3-preset';
import { InteractionsPreset } from './presets/interaction-preset';
import { InteractionStructurePreset } from './presets/interaction-structure-preset';
import { PocketPreset } from './presets/pocket-preset';
import { StructurePreset } from './presets/structure-preset';
import { SurfacePreset } from './presets/surface-preset';

export const ShowButtons = PluginConfig.item('showButtons', true);

const presets = [
  StructurePreset,
  IllustrativePreset,
  SurfacePreset,
  PocketPreset,
  InteractionsPreset,
  InteractionStructurePreset,
  Interaction3Preset,
];

interface PresetDescriptor {
  name: string;
  activate: () => Promise<void>;
}

export class ViewportComponent extends PluginUIComponent {
  async _set(structures: readonly StructureRef[], preset: StructureRepresentationPresetProvider) {
    await this.plugin.managers.structure.component.clear(structures);
    await this.plugin.managers.structure.component.applyPreset(structures, preset);
  }

  set = async (preset: StructureRepresentationPresetProvider) => {
    await this._set(this.plugin.managers.structure.hierarchy.selection.structures, preset);
  };

  private _presets: PresetDescriptor[] = [];
  get presets() {
    if (this._presets.length === 0) {
      for (const preset of presets) {
        this._presets.push({
          name: preset.display.name,
          activate: () => {
            return this.set(preset);
          },
        });
      }
    }
    return this._presets;
  }

  get showButtons() {
    return this.plugin.config.get(ShowButtons);
  }

  render() {
    const VPControls = this.plugin.spec.components?.viewport?.controls || ViewportControls;

    return (
      <>
        <Viewport />
        {this.showButtons && (
          <Stack direction={'column'} spacing={2} width='10rem'>
            {this.presets.map(preset => (
              <Button key={preset.name} variant='contained' onClick={preset.activate} color='primary'>
                {preset.name}
              </Button>
            ))}
          </Stack>
        )}
        <VPControls />
        <BackgroundTaskProgress />
        <div className='msp-highlight-toast-wrapper'>
          <LociLabels />
          <Toasts />
        </div>
      </>
    );
  }
}
