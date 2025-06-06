export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  sdk: {
    baseUrlWs: process.env.BASE_URL_WS || 'wss://ws.trade.polariumbroker.com/echo/websocket',
    baseUrlApi: process.env.BASE_URL_API || 'https://api.trade.polariumbroker.com',
    brokerId: parseInt(process.env.BROKER_ID ?? '82', 10),
  },
  sdkCacheTtlMs: parseInt(process.env.SDK_CACHE_TTL_MS ?? '3600000', 10),
  orderSubscriptionTimeout: parseInt(process.env.ORDER_SUBSCRIPTION_TIMEOUT ?? '65000', 10),
});