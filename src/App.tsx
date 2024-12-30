// import { DockingViewer } from './components/DockingViewer/DockingViewer';
import { useEffect, useRef } from 'react';

import { DockingRenderer } from './components/ProteinDocking/docking-renderer';
// import { nonInteractionLigand } from './pose/non-interaction/example-ligand';
// import { nonInteractionProtein } from './pose/non-interaction/example-protein';

import nonInteractionLigand from './pose/non-interaction/example_lig.sdf?raw';
import nonInteractionProtein from './pose/non-interaction/example_prot.pdb?raw';

function App() {
  const initiated = useRef<boolean>(false);
  useEffect(() => {
    if (initiated.current) {
      return;
    }

    initiated.current = true;
    DockingRenderer.create('docking', [0x33dd22, 0x1133ee], true).then(viewer => {
      viewer.loadStructuresFromUrlsAndMerge([
        { structureData: nonInteractionProtein, format: 'pdb' },
        { structureData: nonInteractionLigand, format: 'sdf' },
      ]);
    });
  }, []);
  return <div id='docking'></div>;
}

export default App;
