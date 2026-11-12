import React, { useState } from 'react';
import { WeightTrendProjection, UnitSystem } from '../../types';
import { convertKgToLb, formatDisplayDate } from '../../utils/engine';

interface WeightProjectionConeChartProps {
  projection: WeightTrendProjection;
  unitSystem?: UnitSystem;
  height?: number;
}

export function WeightProjectionConeChart({
  projection,
  unitSystem = 'metric',
  height = 200,
}: WeightProjectionConeChartProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const isImperial = unitSystem === 'imperial';
  const unit = isImperial ? 'lbs' : 'kg';
  const displayVal = (kg: number) =>
    Number((isImperial ? convertKgToLb(kg) : kg).toFixed(1));

  // Build full series: starting point (Today / Week 0) + 12 weeks
  const todayPoint = {
    date: 'Today',
    daysFromNow: 0,
    weeksFromNow: 0,
    medianKg: projection.currentTrendWeightKg,
    conservativeKg: projection.currentTrendWeightKg,
    aggressiveKg: projection.currentTrendWeightKg,
  };

  const points = [todayPoint, ...projection.projectionPoints];

  // Calculate Y min and max across all trajectories and optional target
  const allValues = points.flatMap((p) => [
    displayVal(p.medianKg),
    displayVal(p.conservativeKg),
    displayVal(p.aggressiveKg),
  ]);

  if (projection.targetWeightKg !== undefined) {
    allValues.push(displayVal(projection.targetWeightKg));
  }

  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const padding = (rawMax - rawMin) * 0.12 || 2;
  const min = Math.max(0, rawMin - padding);
  const max = rawMax + padding;
  const range = max - min || 1;

  // ViewBox dimensions
  const width = 360;
  const padLeft = 18;
  const padRight = 18;
  const padTop = 18;
  const padBottom = 26;

  const usableWidth = width - padLeft - padRight;
  const usableHeight = height - padTop - padBottom;

  const toY = (val: number) =>
    height - padBottom - ((val - min) / range) * usableHeight;

  const coordinates = points.map((p, idx) => {
    const x = padLeft + (idx / (points.length - 1)) * usableWidth;
    const yMedian = toY(displayVal(p.medianKg));
    const yConservative = toY(displayVal(p.conservativeKg));
    const yAggressive = toY(displayVal(p.aggressiveKg));
    return { x, yMedian, yConservative, yAggressive, point: p };
  });

  // Build polygon path for the confidence cone (p10 to p90)
  // Forward along conservative/top boundary, backward along aggressive/bottom boundary
  const topCoords = coordinates.map((c) => {
    // Top visual is the higher Y value (lower y coordinate in SVG)
    const yTop = Math.min(c.yConservative, c.yAggressive);
    return `${c.x},${yTop}`;
  });

  const bottomCoords = [...coordinates].reverse().map((c) => {
    // Bottom visual is lower Y value (higher y coordinate in SVG)
    const yBottom = Math.max(c.yConservative, c.yAggressive);
    return `${c.x},${yBottom}`;
  });

  const conePolygonPoints = [...topCoords, ...bottomCoords].join(' ');

  // Median trajectory polyline
  const medianPolyline = coordinates
    .map((c) => `${c.x},${c.yMedian}`)
    .join(' ');

  // Target Goal line
  const targetY =
    projection.targetWeightKg !== undefined
      ? toY(displayVal(projection.targetWeightKg))
      : undefined;

  const activeCoord = activeIdx !== null ? coordinates[activeIdx] : null;

  return (
    <div className="space-y-2 select-none">
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          style={{ maxHeight: height }}
          onMouseLeave={() => setActiveIdx(null)}
        >
          <defs>
            {/* Subtle cone shading */}
            <linearGradient id="coneGradient" x1="0" y1="0" x2="1" y2="0">
              <stop
                offset="0%"
                stopColor="var(--color-text)"
                stopOpacity="0.04"
              />
              <stop
                offset="100%"
                stopColor="var(--color-text)"
                stopOpacity="0.12"
              />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Baseline */}
          <line
            x1={padLeft}
            y1={height - padBottom}
            x2={width - padRight}
            y2={height - padBottom}
            stroke="var(--color-border)"
            strokeWidth="1"
          />

          {/* Target Goal Line if provided */}
          {targetY !== undefined && targetY >= padTop && targetY <= height - padBottom && (
            <g>
              <line
                x1={padLeft}
                y1={targetY}
                x2={width - padRight}
                y2={targetY}
                stroke="var(--color-accent)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.75"
              />
              <text
                x={width - padRight}
                y={targetY - 5}
                textAnchor="end"
                className="text-[9px] font-bold fill-[var(--color-accent)] opacity-85 uppercase tracking-wider"
              >
                Goal {displayVal(projection.targetWeightKg!)} {unit}
              </text>
            </g>
          )}

          {/* Shaded Confidence Cone (p10 to p90) */}
          <polygon points={conePolygonPoints} fill="url(#coneGradient)" />

          {/* Confidence Cone Border Edges */}
          <polyline
            points={topCoords.join(' ')}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <polyline
            points={[...bottomCoords].reverse().join(' ')}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />

          {/* Median Trajectory Line (Solid Ink) */}
          <polyline
            points={medianPolyline}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Milestone Key Markers (Today, W4, W8, W12) */}
          {coordinates.map((c, idx) => {
            const isMilestone = idx === 0 || idx === 4 || idx === 8 || idx === 12;
            if (!isMilestone) return null;

            return (
              <g key={`marker-${idx}`}>
                <circle
                  cx={c.x}
                  cy={c.yMedian}
                  r="3.5"
                  fill="var(--color-surface)"
                  stroke="var(--color-accent)"
                  strokeWidth="2"
                />
                <text
                  x={c.x}
                  y={height - 8}
                  textAnchor="middle"
                  className="text-[9px] fill-[var(--color-text-subtle)] font-medium"
                >
                  {idx === 0 ? 'Today' : `W${idx}`}
                </text>
              </g>
            );
          })}

          {/* Active Hover / Touch Indicator */}
          {activeCoord && (
            <g>
              <line
                x1={activeCoord.x}
                y1={padTop}
                x2={activeCoord.x}
                y2={height - padBottom}
                stroke="var(--color-accent)"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.8"
              />
              <circle
                cx={activeCoord.x}
                cy={activeCoord.yMedian}
                r="5"
                fill="var(--color-accent)"
                stroke="var(--color-surface)"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Transparent touch interaction hitboxes */}
          {coordinates.map((c, idx) => (
            <rect
              key={`hitbox-${idx}`}
              x={c.x - usableWidth / (points.length * 2)}
              y={0}
              width={usableWidth / points.length}
              height={height}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setActiveIdx(idx)}
              onTouchStart={() => setActiveIdx(idx)}
            />
          ))}
        </svg>

        {/* Dynamic Tooltip */}
        {activeCoord && (
          <div
            className="absolute top-1 pointer-events-none transition-all duration-150 transform -translate-x-1/2 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl px-2.5 py-1.5 shadow-md text-center text-xs"
            style={{
              left: `${(activeCoord.x / width) * 100}%`,
            }}
          >
            <div className="text-[10px] uppercase font-bold text-[var(--color-text-subtle)]">
              {activeCoord.point.weeksFromNow === 0
                ? 'Today'
                : `Week ${activeCoord.point.weeksFromNow} • ${formatDisplayDate(
                    activeCoord.point.date
                  )}`}
            </div>
            <div className="font-bold text-[var(--color-accent)] text-xs mt-0.5">
              {displayVal(activeCoord.point.medianKg)} {unit}
            </div>
            {activeCoord.point.weeksFromNow > 0 && (
              <div className="text-[9px] text-[var(--color-text-muted)] mt-0.5">
                Range: {displayVal(activeCoord.point.conservativeKg)} –{' '}
                {displayVal(activeCoord.point.aggressiveKg)} {unit}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-[var(--color-text-muted)] pt-1 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[var(--color-accent)] rounded-full" />
          <span>Expected Median (p50)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2 bg-[var(--color-border)] rounded-xs opacity-70" />
          <span>Confidence Cone (p10–p90)</span>
        </div>
        {projection.targetWeightKg !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0 border-t border-dashed border-[var(--color-accent)]" />
            <span>Target Goal ({displayVal(projection.targetWeightKg)} {unit})</span>
          </div>
        )}
      </div>
    </div>
  );
}
