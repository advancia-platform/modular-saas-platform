# OpenTelemetry Tracing Guide

## Overview

This backend now includes comprehensive distributed tracing using OpenTelemetry. Traces help you:

- Monitor request flow through your application
- Identify performance bottlenecks
- Debug issues in production
- Analyze database query performance
- Track API dependencies

## Quick Start

### 1. Enable Tracing

Add to your `.env` file:

```bash
OTEL_TRACING_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
OTEL_SERVICE_NAME=advancia-backend
```

### 2. Start AI Toolkit Trace Viewer

In VS Code:

1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Run: `AI Toolkit: Open Trace Viewer`
3. This starts the OTLP collector on `http://localhost:4318`

### 3. Start Your Backend

```bash
cd backend
npm run dev
```

### 4. View Traces

1. Make requests to your API (e.g., `curl http://localhost:4000/api/health`)
2. Open AI Toolkit trace viewer in VS Code
3. See detailed traces of each request including:
   - HTTP request/response timing
   - Express middleware execution
   - Database queries (Prisma)
   - External API calls

## What Gets Traced Automatically

The tracing setup automatically instruments:

### ✅ HTTP Requests

- All incoming HTTP requests to Express
- Request headers, method, URL
- Response status codes, timing
- Error stack traces

### ✅ Express Middleware

- Each middleware execution as a span
- Middleware timing
- Route handlers

### ✅ Database Queries (Prisma)

- SQL queries executed
- Query parameters (sanitized)
- Query execution time
- Connection pool metrics

### ✅ External HTTP Calls

- Axios requests
- Node.js `http`/`https` module calls
- Response timing

## Configuration Options

### Environment Variables

| Variable                      | Default                           | Description            |
| ----------------------------- | --------------------------------- | ---------------------- |
| `OTEL_TRACING_ENABLED`        | `true`                            | Enable/disable tracing |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4318/v1/traces` | OTLP endpoint URL      |
| `OTEL_SERVICE_NAME`           | `advancia-backend`                | Service name in traces |

### Disable Tracing

Set `OTEL_TRACING_ENABLED=false` in your `.env` file.

## Advanced Usage

### Manual Span Creation

For custom tracing beyond automatic instrumentation:

```typescript
import { getTracer } from './tracing';

const tracer = getTracer();

async function processPayment(orderId: string) {
  const span = tracer.startSpan('processPayment', {
    attributes: {
      'order.id': orderId,
      'payment.method': 'stripe',
    },
  });

  try {
    // Your payment processing logic
    const result = await stripeAPI.charge(...);

    span.setAttribute('payment.status', result.status);
    span.setStatus({ code: SpanStatusCode.OK });

    return result;
  } catch (error) {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message
    });
    throw error;
  } finally {
    span.end();
  }
}
```

### Add Custom Attributes

```typescript
import { trace } from "@opentelemetry/api";

// In any function
const span = trace.getActiveSpan();
if (span) {
  span.setAttribute("user.id", userId);
  span.setAttribute("user.tier", "premium");
  span.addEvent("Payment processed", {
    "payment.amount": 99.99,
    "payment.currency": "USD",
  });
}
```

## Production Deployment

### Export to Observability Platforms

#### Jaeger (Free, Self-hosted)

```bash
# Start Jaeger with Docker
docker run -d --name jaeger \
  -e COLLECTOR_OTLP_ENABLED=true \
  -p 16686:16686 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest

# Update .env
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces

# View traces at http://localhost:16686
```

#### New Relic

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp.nr-data.net:4318/v1/traces
OTEL_EXPORTER_OTLP_HEADERS=api-key=YOUR_NEW_RELIC_LICENSE_KEY
```

#### Datadog

```bash
# Start Datadog agent with OTLP enabled
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

#### Honeycomb

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io/v1/traces
OTEL_EXPORTER_OTLP_HEADERS=x-honeycomb-team=YOUR_API_KEY
```

#### Azure Monitor (Application Insights)

```bash
npm install @azure/monitor-opentelemetry-exporter

# Update tracing.ts to use AzureMonitorTraceExporter
OTEL_EXPORTER_OTLP_ENDPOINT=YOUR_APPINSIGHTS_CONNECTION_STRING
```

## Troubleshooting

### No Traces Appearing

1. **Check if tracing is enabled**

   ```bash
   # Should be true
   echo $OTEL_TRACING_ENABLED
   ```

2. **Verify OTLP endpoint is reachable**

   ```bash
   curl http://localhost:4318/v1/traces
   ```

3. **Check backend startup logs**

   ```
   ✅ OpenTelemetry tracing initialized successfully
   ```

4. **Verify AI Toolkit trace viewer is running**
   - Run `AI Toolkit: Open Trace Viewer` in VS Code

### High Memory Usage

If tracing causes high memory usage:

1. **Reduce batch size** (edit `tracing.ts`):

   ```typescript
   new BatchSpanProcessor(otlpExporter, {
     maxQueueSize: 100,
     maxExportBatchSize: 10,
   });
   ```

2. **Disable noisy instrumentations**:

   ```typescript
   '@opentelemetry/instrumentation-fs': {
     enabled: false,
   },
   ```

### Spans Missing Context

Ensure tracing is imported FIRST in `index.ts`:

```typescript
import dotenv from "dotenv";
dotenv.config();

// MUST be before other imports
import "./tracing";
```

## Performance Impact

Tracing overhead is minimal:

- **HTTP requests**: ~0.1-0.5ms per request
- **Database queries**: ~0.05-0.2ms per query
- **Memory**: ~10-50MB additional heap usage
- **CPU**: <1% additional CPU usage

For production, consider:

- Using sampling (trace 10% of requests)
- Tail-based sampling (only trace errors/slow requests)
- Batch exports to reduce network overhead

## Best Practices

1. ✅ **Enable tracing in all environments** (dev, staging, prod)
2. ✅ **Use consistent service names** across deployments
3. ✅ **Add meaningful attributes** to spans (user IDs, order IDs, etc.)
4. ✅ **Record exceptions** in error handlers
5. ✅ **Use trace context propagation** for microservices
6. ✅ **Sample in high-traffic production** (10-50% of requests)
7. ✅ **Monitor trace storage costs** (especially in cloud platforms)
8. ❌ **Don't log sensitive data** (passwords, tokens, PII)
9. ❌ **Don't trace health checks** (creates noise)
10. ❌ **Don't create spans in tight loops** (performance impact)

## Resources

- [OpenTelemetry Docs](https://opentelemetry.io/docs/)
- [AI Toolkit Tracing](https://github.com/microsoft/vscode-ai-toolkit)
- [Prisma Instrumentation](https://www.prisma.io/docs/concepts/components/prisma-client/opentelemetry-tracing)
- [Express Instrumentation](https://opentelemetry.io/docs/instrumentation/js/libraries/express/)

## Support

For issues with tracing setup:

1. Check backend logs for initialization errors
2. Verify OTLP endpoint connectivity
3. Review this guide's troubleshooting section
4. Check OpenTelemetry GitHub issues

---

**Happy Tracing! 🔍📊**
