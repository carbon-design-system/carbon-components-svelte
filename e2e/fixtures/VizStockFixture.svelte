<script>
  import { StockChart } from "carbon-components-svelte/viz";

  // 120 trading days of a made-up ticker.
  const DAY = 86_400_000;
  const start = new Date(2026, 3, 1).getTime();
  let price = 182;
  const rows = [];
  for (let i = 0; i < 120; i++) {
    const drift =
      Math.sin(i / 9) * 1.4 +
      Math.cos(i / 23) * 0.9 +
      ((i * 7919) % 11) / 10 -
      0.5;
    const open = price;
    const close = Math.round((open + drift) * 100) / 100;
    const high =
      Math.round((Math.max(open, close) + ((i * 31) % 7) / 4 + 0.3) * 100) /
      100;
    const low =
      Math.round((Math.min(open, close) - ((i * 17) % 5) / 4 - 0.3) * 100) /
      100;
    const volume =
      18_000_000 + ((i * 104_729) % 9_000_000) + Math.abs(drift) * 4_000_000;
    rows.push({
      date: new Date(start + i * DAY).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      open,
      high,
      low,
      close,
      volume: Math.round(volume),
    });
    price = close;
  }
</script>

<div style="width: 960px; padding: 16px" data-testid="stock">
  <StockChart
    data={rows}
    x="date"
    open="open"
    high="high"
    low="low"
    close="close"
    volume="volume"
    overlays={[
      { type: "sma", period: 10 },
      { type: "ema", period: 30 },
      { type: "bollinger", period: 20 },
    ]}
    indicators={[{ type: "rsi" }, { type: "macd" }]}
    yFormat={{ style: "currency", currency: "USD" }}
    title="ACME, daily"
    zoomBar
  />
</div>
<div style="width: 960px; padding: 16px" data-testid="stock-area">
  <StockChart
    data={rows.slice(60)}
    x="date"
    open="open"
    high="high"
    low="low"
    close="close"
    volume="volume"
    mode="area"
    overlays={[
      { type: "sma", period: 10, label: "10-day average", color: "warning" },
    ]}
    yFormat={{ style: "currency", currency: "USD" }}
    title="ACME, last 60 days"
  />
</div>
