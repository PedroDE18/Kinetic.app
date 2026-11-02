import React, { useState } from 'react';

export interface ChartDataPoint {
  xLabel: string;
  primaryValue: number;
  secondaryValue?: number; // e.g. raw scale weigh-in when primary is smoothed trend
  unit?: string;
  notes?: string;
}

export interface TrendChartProps {
  title: string;
  data: ChartDataPoint[];
  primaryLabel?: string;
  secondaryLabel?: string;
  emptyMessage?: string;
  height?: number;
  showAreaGradient?: boolean;
}

export function TrendChart({
  title,
  data,
  primaryLabel = 'Primary',
  secondaryLabel = 'Raw',
  emptyMessage = 'Not enough data to graph yet',
  height = 160,
  showAreaGradient = true,
}: TrendChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!data || data.length < 2) {
    return (
      <div
        className="h-full flex items-center justify-center text-[var(--color-text-subtle)] text-xs p-4 text-center"
        style={{ minHeight: height }}
      >
        {emptyMessage}
      </div>
    );
  }

  const primaryVals = data.map((d) => d.primaryValue);
  const secondaryVals = data
    .map((d) => d.secondaryValue)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  const allVals = [...primaryVals, ...secondaryVals];

  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);
  const padding = (rawMax - rawMin) * 0.1 || (rawMax ? rawMax * 0.05 : 1);
  const min = rawMin - padding;
  const max = rawMax + padding;
  const range = max - min || 1;

  const width = 340;
  const chartHeight = height;
  const padLeft = 14;
  const padRight = 14;
  const padTop = 16;
  const padBottom = 24;

  const usableWidth = width - padLeft - padRight;
  const usableHeight = chartHeight - padTop - padBottom;

  const points = data.map((d, idx) => {
    const x = padLeft + (idx / (data.length - 1)) * usableWidth;
    const yPrimary = chartHeight - padBottom - ((d.primaryValue - min) / range) * usableHeight;
    const ySecondary =
      d.secondaryValue !== undefined
        ? chartHeight - padBottom - ((d.secondaryValue - min) / range) * usableHeight
        : undefined;

    return {
      x,
      yPrimary,
      ySecondary,
      data: d,
    };
  });

  const polylineCoords = points.map((p) => `${p.x},${p.yPrimary}`).join(' ');
  const areaCoords = `${points[0].x},${chartHeight - padBottom} ${polylineCoords} ${
    points[points.length - 1].x
  },${chartHeight - padBottom}`;

  const activePoint = activeIndex !== null && points[activeIndex] ? points[activeIndex] : null;

  return (
    <div className="relative w-full select-none" onMouseLeave={() => setActiveIndex(null)}>
      {/* Active Point Floating Tooltip */}
      {activePoint && (
        <div
          className="absolute -top-1 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl px-2.5 py-1 text-[11px] shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full z-10 text-[var(--color-text)] flex items-center gap-2 whitespace-nowrap animate-fade-in"
          style={{ left: `${(activePoint.x / width) * 100}%` }}
        >
          <span className="font-semibold text-[var(--color-text-muted)]">
            {activePoint.data.xLabel}:
          </span>
          <span className="font-bold text-[var(--color-accent)]">
            {activePoint.data.primaryValue} {activePoint.data.unit || ''}
          </span>
          {activePoint.data.secondaryValue !== undefined && (
            <span className="text-[10px] text-[var(--color-text-subtle)]">
              ({secondaryLabel}: {activePoint.data.secondaryValue})
            </span>
          )}
        </div>
      )}

      {/* SVG Vector Chart */}
      <svg
        viewBox={`0 0 ${width} ${chartHeight}`}
        className="w-full h-full overflow-visible touch-none"
        role="img"
        aria-label={`${title} chart showing ${data.length} records. Latest value is ${
          data[data.length - 1].primaryValue
        } ${data[data.length - 1].unit || ''}.`}
      >
        <defs>
          <linearGradient id={`trendGrad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--color-accent)', stopOpacity: 0.28 }} />
            <stop offset="100%" style={{ stopColor: 'var(--color-accent)', stopOpacity: 0 }} />
          </linearGradient>
        </defs>

        {/* Horizontal reference grid lines */}
        <line
          x1={padLeft}
          y1={padTop + usableHeight * 0.25}
          x2={width - padRight}
          y2={padTop + usableHeight * 0.25}
          style={{ stroke: 'var(--color-border)', strokeDasharray: '3 3' }}
        />
        <line
          x1={padLeft}
          y1={padTop + usableHeight * 0.75}
          x2={width - padRight}
          y2={padTop + usableHeight * 0.75}
          style={{ stroke: 'var(--color-border)', strokeDasharray: '3 3' }}
        />

        {/* Gradient Fill under primary line */}
        {showAreaGradient && (
          <polygon
            points={areaCoords}
            fill={`url(#trendGrad-${title.replace(/\s+/g, '')})`}
          />
        )}

        {/* Secondary Scatter Dots (e.g. raw weigh-ins) */}
        {points.map((p, idx) => {
          if (p.ySecondary === undefined) return null;
          return (
            <circle
              key={`sec-${idx}`}
              cx={p.x}
              cy={p.ySecondary}
              r="2.5"
              opacity="0.55"
              style={{ fill: 'var(--color-text-subtle)' }}
            />
          );
        })}

        {/* Primary Polyline Trend Line */}
        <polyline
          fill="none"
          strokeWidth="2.5"
          style={{ stroke: 'var(--color-accent)' }}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polylineCoords}
        />

        {/* Active crosshair vertical guideline */}
        {activePoint && (
          <line
            x1={activePoint.x}
            y1={padTop}
            x2={activePoint.x}
            y2={chartHeight - padBottom}
            style={{ stroke: 'var(--color-accent)', strokeDasharray: '2 2', strokeWidth: 1.5 }}
          />
        )}

        {/* Data points & hit-targets */}
        {points.map((p, idx) => (
          <g
            key={`pt-${idx}`}
            className="cursor-pointer"
            onMouseEnter={() => setActiveIndex(idx)}
            onTouchStart={() => setActiveIndex(idx)}
          >
            {/* Invisible large hit target for touch accessibility */}
            <circle cx={p.x} cy={p.yPrimary} r="14" fill="transparent" />

            {/* Visual Dot */}
            <circle
              cx={p.x}
              cy={p.yPrimary}
              r={activeIndex === idx ? '5.5' : '3.5'}
              strokeWidth="2"
              style={{
                fill: 'var(--color-surface)',
                stroke: 'var(--color-accent)',
                transition: 'r 0.15s ease',
              }}
            />

            {/* X-axis label (sampled if many points) */}
            {(data.length <= 7 || idx === 0 || idx === data.length - 1 || idx % 2 === 0) && (
              <text
                x={p.x}
                y={chartHeight - 4}
                textAnchor="middle"
                style={{ fill: 'var(--color-text-subtle)' }}
                fontSize="8"
                fontWeight="bold"
              >
                {p.data.xLabel}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Screen-Reader Accessible Summary Table (hidden visually, available for AT) */}
      <div className="sr-only">
        <table>
          <caption>{title} data history</caption>
          <thead>
            <tr>
              <th scope="col">Date / Label</th>
              <th scope="col">{primaryLabel}</th>
              {secondaryVals.length > 0 && <th scope="col">{secondaryLabel}</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i}>
                <td>{d.xLabel}</td>
                <td>
                  {d.primaryValue} {d.unit || ''}
                </td>
                {d.secondaryValue !== undefined && (
                  <td>
                    {d.secondaryValue} {d.unit || ''}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
