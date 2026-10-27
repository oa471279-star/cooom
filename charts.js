// Thin Chart.js wrapper: theme colours, RTL/LTR mirroring and cleanup between views.
import { isRTL } from './i18n.js';

const live = new Set();

export function destroyCharts() {
  live.forEach((chart) => chart.destroy());
  live.clear();
}

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
export const palette = () => [css('--primary'), css('--green'), css('--blue'), css('--warn'), css('--danger'), '#8a8f98', '#a9b8c9', '#9bc4ae'];

function merge(base, extra) {
  for (const [k, v] of Object.entries(extra || {})) {
    base[k] = v && typeof v === 'object' && !Array.isArray(v) ? merge(base[k] || {}, v) : v;
  }
  return base;
}

/** canvas: the <canvas> element (looked up inside the current view, never by global id). */
export function drawChart(canvas, type, data, options = {}) {
  if (!canvas || !window.Chart) return;
  const rtl = isRTL();
  Chart.defaults.color = css('--text-muted');
  Chart.defaults.font.family = css('--font');
  const base = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { rtl, textDirection: rtl ? 'rtl' : 'ltr', labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: { rtl, textDirection: rtl ? 'rtl' : 'ltr' },
    },
  };
  if (type === 'bar' || type === 'line') {
    base.scales = {
      x: { reverse: rtl, grid: { display: false } },
      y: { beginAtZero: true, position: rtl ? 'right' : 'left', grid: { color: css('--border') } },
    };
  }
  const chart = new Chart(canvas, { type, data, options: merge(base, options) });
  live.add(chart);
  return chart;
}
