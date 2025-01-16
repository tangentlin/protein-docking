import { FunctionComponent, useEffect, useId, useMemo, useRef } from 'react';

import { styled } from '@mui/material/styles';
import { BuiltInTrajectoryFormat } from 'molstar/lib/mol-plugin-state/formats/trajectory';

import { areArrayEqual } from '../../utils/array-util';

import { DockingRenderer } from './docking-renderer';
import { zoomToLigand } from './docking-viewer-util';

export interface DockingStructureModel {
  structureData: string;
  format: BuiltInTrajectoryFormat;
  color: number;
}

type DockingStructureDataModel = Pick<DockingStructureModel, 'structureData' | 'format'>;

export interface DockingViewerProp {
  structures: readonly DockingStructureModel[];
  height?: string;
  hideButtons?: boolean;
}

const Container = styled('div')<{ height?: string }>`
  height: ${props => props.height ?? props.theme.spacing(37.5)};
  width: 100%;
  position: relative;
`;

export const DockingViewer: FunctionComponent<DockingViewerProp> = props => {
  const { structures, height = '30rem', hideButtons = false } = props;
  const previousColors = useRef<readonly number[]>([]);
  const previousStructureData = useRef<readonly DockingStructureDataModel[]>([]);
  const viewerRef = useRef<DockingRenderer | null>(null);
  const elementId = useId();
  const isInit = useRef(false);

  const colors = useMemo<readonly number[]>(() => {
    const updatedColors = structures.map(t => t.color);
    if (!areArrayEqual(updatedColors, previousColors.current)) {
      previousColors.current = updatedColors;
    }
    return previousColors.current;
  }, [structures]);

  const structureData = useMemo(() => {
    const updatedStructureData = structures.map<DockingStructureDataModel>(t => ({
      structureData: t.structureData,
      format: t.format,
    }));
    if (!areArrayEqual(updatedStructureData, previousStructureData.current)) {
      previousStructureData.current = updatedStructureData;
    }
    return previousStructureData.current;
  }, [structures]);

  useEffect(() => {
    if (isInit.current) {
      return;
    }

    isInit.current = true;
    DockingRenderer.create(elementId, colors, !hideButtons).then(async viewer => {
      // TODO: This may not work with updated data
      await viewer.loadStructuresFromUrlsAndMerge(structureData);
      viewerRef.current = viewer;
      zoomToLigand(viewer.plugin);
    });
  }, [colors, elementId, structureData, hideButtons]);

  return <Container id={elementId} height={height}></Container>;
};
