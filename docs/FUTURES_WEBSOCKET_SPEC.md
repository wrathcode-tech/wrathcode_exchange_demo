# Futures WebSocket Specification

This document describes the expected payload structure for `futures:update` events so the frontend can display orderbook and recent trades like the spot trade page (which uses `exchange:update`).

## Event: `futures:update`

When a client subscribes via `futures:subscribe` with `{ base_currency_id, quote_currency_id }`, the backend should emit `futures:update` with the following structure (aligned with spot's `exchange:update`):

```json
{
  "pairs": [...],
  "balance": {
    "base_currency_balance": 0,
    "quote_currency_balance": 0
  },
  "open_position": [...],
  "close_position": [...],
  "open_orders": [...],
  "orders_history": [...],
  "trade_history": [...],
  "buy_order": [
    { "price": 97123.5, "quantity": 0.5, "remaining": 0.5 }
  ],
  "sell_order": [
    { "price": 97124.0, "quantity": 0.3, "remaining": 0.3 }
  ],
  "recent_trades": [
    { "price": 97123.5, "quantity": 0.01, "side": "BUY", "time": "14:32:15" }
  ],
  "ticker": {
    "buy_price": 97123.5,
    "sell_price": 97124.0,
    "change": 0.5,
    "change_24hour": 2.3,
    "high": 97500,
    "low": 96500,
    "volume": 1234.56
  }
}
```

### Order Book Format

- **buy_order**: Array of buy orders, sorted by price descending (best bid first).
- **sell_order**: Array of sell orders, sorted by price ascending (best ask first).
- Each order: `{ price: number, quantity: number, remaining: number }`
  - `remaining` is used for the volume bar fill percentage and display.

### Recent Trades Format

- **recent_trades**: Array of recent trades (newest first).
- Each trade: `{ price: number, quantity: number, side: "BUY" | "SELL", time?: string }`
  - `time` optional; if missing, frontend can format from timestamp.

### Futures Pair Metadata

Each pair in `pairs` should include for proper validations:

- `tick_size` (or derived from `price_precision`): Minimum price increment.
- `step_size` (or derived from `quantity_precision`): Minimum quantity increment.
- `price_precision`, `quantity_precision`: Used if tick_size/step_size are not provided.
