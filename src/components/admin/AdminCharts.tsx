"use client";

import { useState } from "react";

type MonthMetric = { month: string; revenue: number; appointments: number; completed: number };
const currency = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const number = (value: number) => value.toLocaleString("pt-BR");

export function BarChart({ data }: { data: MonthMetric[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((item) => item.completed));
  const width = 640,
    height = 245,
    left = 12,
    right = 12,
    top = 16,
    bottom = 35;
  const plotH = height - top - bottom;
  const step = (width - left - right) / data.length;
  const barWidth = Math.min(27, step * 0.56);
  return (
    <div className="adm-chart-scroll">
      <svg
        className="adm-chart-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Atendimentos concluídos por mês"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line
              x1={left}
              x2={width - right}
              y1={top + plotH * t}
              y2={top + plotH * t}
              className="adm-grid-line"
            />
            <text x={left} y={top + plotH * t - 5} className="adm-axis-text">
              {Math.round(max * (1 - t))}
            </text>
          </g>
        ))}
        {data.map((item, i) => {
          const barH = (item.completed / max) * (plotH - 8);
          const x = left + i * step + (step - barWidth) / 2;
          return (
            <g
              key={item.month}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              tabIndex={0}
              role="button"
              aria-label={`${item.month}: ${item.completed} atendimentos concluídos`}
            >
              <rect
                x={x - 4}
                y={top}
                width={step}
                height={plotH + 10}
                fill="transparent"
              />
              <rect
                x={x}
                y={top + plotH - barH}
                width={barWidth}
                height={Math.max(3, barH)}
                rx="5"
                className={hover === i ? "adm-bar active" : "adm-bar"}
              />
              <text
                x={left + i * step + step / 2}
                y={height - 11}
                textAnchor="middle"
                className={
                  hover === i ? "adm-axis-text active" : "adm-axis-text"
                }
              >
                {item.month}
              </text>
              {hover === i && (
                <g>
                  <rect
                    x={Math.min(width - 112, Math.max(5, x - 37))}
                    y={Math.max(2, top + plotH - barH - 37)}
                    width="106"
                    height="28"
                    rx="6"
                    className="adm-tooltip-bg"
                  />
                  <text
                    x={Math.min(width - 59, Math.max(58, x + 16))}
                    y={Math.max(20, top + plotH - barH - 19)}
                    textAnchor="middle"
                    className="adm-tooltip-text"
                  >
                    {item.completed} concluídos
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function LineChart({
  data,
  valueKey,
  mode,
}: {
  data: MonthMetric[];
  valueKey: "revenue" | "appointments";
  mode: "money" | "count";
}) {
  const [hover, setHover] = useState<number | null>(null);
  const vals = data.map((item) => item[valueKey]);
  const max = Math.max(1, ...vals) * 1.12;
  const width = 640,
    height = 250,
    left = 12,
    right = 12,
    top = 22,
    bottom = 37;
  const plotH = height - top - bottom,
    plotW = width - left - right;
  const points = data.map((item, i) => ({
    x: left + (i * plotW) / (data.length - 1),
    y: top + plotH - (item[valueKey] / max) * plotH,
    value: item[valueKey],
    month: item.month,
  }));
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  return (
    <div className="adm-chart-scroll">
      <svg
        className="adm-chart-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={
          mode === "money" ? "Receita mensal" : "Agendamentos por mês"
        }
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line
              x1={left}
              x2={width - right}
              y1={top + plotH * t}
              y2={top + plotH * t}
              className="adm-grid-line"
            />
            <text x={left} y={top + plotH * t - 5} className="adm-axis-text">
              {mode === "money"
                ? Math.round((max * (1 - t)) / 1000) + "k"
                : Math.round(max * (1 - t))}
            </text>
          </g>
        ))}
        <path d={path} className="adm-line-path" />
        {points.map((p, i) => (
          <g
            key={p.month}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            tabIndex={0}
            role="button"
            aria-label={`${p.month}: ${mode === "money" ? currency(p.value) : p.value + " agendamentos"}`}
          >
            <rect
              x={p.x - 16}
              y={top}
              width={32}
              height={plotH + 10}
              fill="transparent"
            />
            {hover === i && (
              <line
                x1={p.x}
                x2={p.x}
                y1={top}
                y2={top + plotH}
                className="adm-crosshair"
              />
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={hover === i ? 5 : 3.5}
              className={hover === i ? "adm-line-dot active" : "adm-line-dot"}
            />
            <text
              x={p.x}
              y={height - 12}
              textAnchor="middle"
              className="adm-axis-text"
            >
              {p.month}
            </text>
            {hover === i && (
              <g>
                <rect
                  x={Math.min(width - 122, Math.max(4, p.x - 50))}
                  y={Math.max(1, p.y - 42)}
                  width="116"
                  height="31"
                  rx="6"
                  className="adm-tooltip-bg"
                />
                <text
                  x={Math.min(width - 64, Math.max(62, p.x + 8))}
                  y={Math.max(21, p.y - 22)}
                  textAnchor="middle"
                  className="adm-tooltip-text"
                >
                  {mode === "money"
                    ? currency(p.value)
                    : number(p.value) + " agend."}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
