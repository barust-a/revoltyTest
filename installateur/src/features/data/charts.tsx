// SVG chart primitives for the data screen. Geometry/paths come from dataView.ts (pure, tested);
// these components only turn that math into react-native-svg elements.
import React from 'react';
import { Defs, Line as SvgLine, Path, Pattern, Rect, Svg } from 'react-native-svg';

import type { DaySlot, Gap } from '../../core/energy';
import { theme } from '../../ui/theme';
import {
  BATTERY_CHART_HEIGHT,
  BATTERY_ZERO_Y,
  buildBatteryBars,
  buildEnergyPaths,
  buildGapBands,
  buildSocPaths,
  ENERGY_CHART_HEIGHT,
  ENERGY_GRID_Y,
  ENERGY_ZERO_Y,
  slotCenterX,
  SOC_CHART_HEIGHT,
  SOC_FULL_Y,
  SOC_ZERO_Y,
} from './dataView';

const GAP_PATTERN_ID = 'rv-gap-hatch';
const SURPLUS_PATTERN_ID = 'rv-surplus-hatch';

// Both patterns are cheap to declare even when unused: each <Svg> is its own document, ids never clash.
function ChartPatterns() {
  return (
    <Defs>
      <Pattern
        id={GAP_PATTERN_ID}
        patternUnits="userSpaceOnUse"
        width={7}
        height={7}
        patternTransform="rotate(45)"
      >
        <Rect x={0} y={0} width={7} height={7} fill={theme.colors.offlineBar} />
        <SvgLine x1={0} y1={0} x2={0} y2={7} stroke={theme.colors.offline} strokeWidth={2} />
      </Pattern>
      <Pattern
        id={SURPLUS_PATTERN_ID}
        patternUnits="userSpaceOnUse"
        width={6}
        height={6}
        patternTransform="rotate(45)"
      >
        <SvgLine x1={0} y1={0} x2={0} y2={6} stroke={theme.colors.solar} strokeWidth={2} />
      </Pattern>
    </Defs>
  );
}

function GapBands({
  slots,
  gaps,
  width,
  height,
}: {
  slots: DaySlot[];
  gaps: Gap[];
  width: number;
  height: number;
}) {
  const bands = buildGapBands(slots, gaps, width);
  return (
    <>
      {bands.map((band) => (
        <Rect
          key={band.fromIndex}
          x={band.x}
          y={0}
          width={band.width}
          height={height}
          fill={`url(#${GAP_PATTERN_ID})`}
        />
      ))}
    </>
  );
}

function CursorLine({
  index,
  width,
  height,
}: {
  index: number | null;
  width: number;
  height: number;
}) {
  if (index === null) return null;
  const x = slotCenterX(index, width);
  return (
    <SvgLine
      x1={x}
      y1={0}
      x2={x}
      y2={height}
      stroke={theme.colors.forest}
      strokeWidth={1.5}
      strokeDasharray="4,3"
    />
  );
}

function NowLine({
  index,
  width,
  height,
}: {
  index: number | null;
  width: number;
  height: number;
}) {
  if (index === null) return null;
  const x = slotCenterX(index, width);
  return (
    <SvgLine x1={x} y1={0} x2={x} y2={height} stroke={theme.colors.offlineText} strokeWidth={1.5} />
  );
}

type ChartProps = {
  slots: DaySlot[];
  gaps: Gap[];
  width: number;
  cursorIndex: number | null;
  nowIndex: number | null;
};

export function EnergyChart({ slots, gaps, width, cursorIndex, nowIndex }: ChartProps) {
  const { productionPath, consumptionPath, surplusPath } = buildEnergyPaths(slots, width);
  return (
    <Svg width={width} height={ENERGY_CHART_HEIGHT} testID="energy-chart">
      <ChartPatterns />
      <SvgLine
        x1={0}
        y1={ENERGY_ZERO_Y}
        x2={width}
        y2={ENERGY_ZERO_Y}
        stroke={theme.colors.line}
        strokeWidth={1}
      />
      <SvgLine
        x1={0}
        y1={ENERGY_GRID_Y}
        x2={width}
        y2={ENERGY_GRID_Y}
        stroke={theme.colors.offlineBar}
        strokeWidth={1}
      />
      <GapBands slots={slots} gaps={gaps} width={width} height={ENERGY_CHART_HEIGHT} />
      <Path
        d={productionPath}
        fill={theme.colors.solar}
        fillOpacity={0.22}
        stroke={theme.colors.solar}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d={surplusPath} fill={`url(#${SURPLUS_PATTERN_ID})`} />
      <Path
        d={consumptionPath}
        fill="none"
        stroke={theme.colors.forest}
        strokeWidth={2.2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <CursorLine index={cursorIndex} width={width} height={ENERGY_CHART_HEIGHT} />
      <NowLine index={nowIndex} width={width} height={ENERGY_CHART_HEIGHT} />
    </Svg>
  );
}

export function BatteryChart({ slots, gaps, width, cursorIndex, nowIndex }: ChartProps) {
  const { chargePath, dischargePath } = buildBatteryBars(slots, width);
  return (
    <Svg width={width} height={BATTERY_CHART_HEIGHT} testID="battery-chart">
      <ChartPatterns />
      <GapBands slots={slots} gaps={gaps} width={width} height={BATTERY_CHART_HEIGHT} />
      <SvgLine
        x1={0}
        y1={BATTERY_ZERO_Y}
        x2={width}
        y2={BATTERY_ZERO_Y}
        stroke={theme.colors.line}
        strokeWidth={1}
      />
      <Path d={chargePath} fill={theme.colors.primary} />
      <Path d={dischargePath} fill={theme.colors.teal} />
      <CursorLine index={cursorIndex} width={width} height={BATTERY_CHART_HEIGHT} />
      <NowLine index={nowIndex} width={width} height={BATTERY_CHART_HEIGHT} />
    </Svg>
  );
}

export function SocChart({ slots, gaps, width, cursorIndex, nowIndex }: ChartProps) {
  const { areaPath, linePath } = buildSocPaths(slots, width);
  return (
    <Svg width={width} height={SOC_CHART_HEIGHT} testID="soc-chart">
      <ChartPatterns />
      <GapBands slots={slots} gaps={gaps} width={width} height={SOC_CHART_HEIGHT} />
      <SvgLine
        x1={0}
        y1={SOC_ZERO_Y}
        x2={width}
        y2={SOC_ZERO_Y}
        stroke={theme.colors.line}
        strokeWidth={1}
      />
      <SvgLine
        x1={0}
        y1={SOC_FULL_Y}
        x2={width}
        y2={SOC_FULL_Y}
        stroke={theme.colors.offlineBar}
        strokeWidth={1}
      />
      <Path d={areaPath} fill={theme.colors.teal} fillOpacity={0.1} />
      <Path d={linePath} fill="none" stroke={theme.colors.teal} strokeWidth={2} />
      <CursorLine index={cursorIndex} width={width} height={SOC_CHART_HEIGHT} />
      <NowLine index={nowIndex} width={width} height={SOC_CHART_HEIGHT} />
    </Svg>
  );
}
