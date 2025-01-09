import { dockingDefaultColor } from './components/ProteinDocking/docking-color';
import { DockingViewer } from './components/ProteinDocking/docking-viewer';
import withInteractionSdf from './pose/ligand-interaction/example_lig.sdf?raw';
import withInteractionPdb from './pose/ligand-interaction/example_prot.pdb?raw';

function App() {
  return (
    <DockingViewer
      structures={[
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
      ]}
    />
  );
}

export default App;
