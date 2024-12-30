import { Meta, StoryObj } from '@storybook/react';

import withInteractionPdb from '../..//pose/ligand-interaction/example_prot.pdb?raw';
import nonInteractionPdb from '../..//pose/non-interaction/example_prot.pdb?raw';
import withInteractionSdf from '../../pose/ligand-interaction/example_lig.sdf?raw';
import nonInteractionSdf from '../../pose/non-interaction/example_lig.sdf?raw';

import { dockingDefaultColor } from './docking-color';
import { DockingViewer } from './docking-viewer';

const meta: Meta<typeof DockingViewer> = {
  component: DockingViewer,
};

export default meta;
type Story = StoryObj<typeof DockingViewer>;

export const NonInteraction: Story = {
  args: {
    structures: [
      {
        structureData: nonInteractionPdb,
        format: 'pdb',
        color: dockingDefaultColor.protein,
      },
      {
        structureData: nonInteractionSdf,
        format: 'sdf',
        color: dockingDefaultColor.ligand,
      },
    ],
  },
};

export const WithInteraction: Story = {
  args: {
    structures: [
      {
        structureData: withInteractionPdb,
        format: 'pdb',
        color: dockingDefaultColor.protein,
      },
      {
        structureData: withInteractionSdf,
        format: 'sdf',
        color: dockingDefaultColor.ligand,
      },
    ],
  },
};
