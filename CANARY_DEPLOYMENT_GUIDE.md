# 🐤 Canary Deployment Strategy

Progressive traffic shifting with automated health monitoring and rollback.

---

## 📋 Overview

Canary deployment gradually shifts production traffic from the old version (Blue) to the new version (Green) in controlled stages, allowing real-world validation with minimal risk.

### Traffic Progression
```
Blue (100%) ────────────────────────────────────> Green (0%)
      ↓
Blue (90%)  ──────────────────────────────────> Green (10%)  ← Canary 1
      ↓         Monitor 5 minutes
Blue (75%)  ──────────────────────────────────> Green (25%)  ← Canary 2
      ↓         Monitor 5 minutes
Blue (50%)  ──────────────────────────────────> Green (50%)  ← Canary 3
      ↓         Monitor 10 minutes
Blue (25%)  ──────────────────────────────────> Green (75%)  ← Canary 4
      ↓         Monitor 10 minutes
Blue (0%)   ──────────────────────────────────> Green (100%) ← Full rollout
```

---

## 🔹 Canary Stages

### Stage 0: Pre-Deployment
- ✅ Deploy new version to Green environment
- ✅ Run comprehensive health checks
- ✅ Verify all services are ready
- ✅ Blue still serves 100% traffic

### Stage 1: 10% Canary (Initial Test)
- 🎯 **Traffic**: 10% → Green, 90% → Blue
- ⏱️ **Duration**: 5 minutes
- 📊 **Metrics**: Error rate < 1%, P95 latency < 500ms
- 🚨 **Rollback if**: Any health check fails

### Stage 2: 25% Canary (Confidence Building)
- 🎯 **Traffic**: 25% → Green, 75% → Blue
- ⏱️ **Duration**: 5 minutes
- 📊 **Metrics**: Error rate < 0.5%, P95 latency < 400ms
- 🚨 **Rollback if**: Error rate increases or latency spikes

### Stage 3: 50% Canary (Even Split)
- 🎯 **Traffic**: 50% → Green, 50% → Blue
- ⏱️ **Duration**: 10 minutes
- 📊 **Metrics**: Error rate < 0.1%, P95 latency < 350ms
- 🚨 **Rollback if**: Green performs worse than Blue

### Stage 4: 75% Canary (Near-Complete)
- 🎯 **Traffic**: 75% → Green, 25% → Blue
- ⏱️ **Duration**: 10 minutes
- 📊 **Metrics**: Error rate ≈ Blue, latency ≈ Blue
- 🚨 **Rollback if**: Any degradation detected

### Stage 5: 100% Full Rollout
- 🎯 **Traffic**: 100% → Green
- ✅ Blue kept warm for instant rollback
- 📊 **Metrics**: Continuous monitoring for 30 minutes
- 🔄 **Rollback**: Manual or automatic if issues arise

---

## 🔹 Load Balancer Configuration

### Option 1: NGINX Weighted Load Balancing

```nginx
# /etc/nginx/conf.d/canary.conf

upstream backend {
    # Stage 1: 10% Canary
    server green.advancia.internal:4000 weight=1;   # 10%
    server blue.advancia.internal:4000 weight=9;    # 90%
    
    # Stage 2: 25% Canary
    # server green.advancia.internal:4000 weight=1;  # 25%
    # server blue.advancia.internal:4000 weight=3;   # 75%
    
    # Stage 3: 50% Canary
    # server green.advancia.internal:4000 weight=1;  # 50%
    # server blue.advancia.internal:4000 weight=1;   # 50%
    
    # Stage 4: 75% Canary
    # server green.advancia.internal:4000 weight=3;  # 75%
    # server blue.advancia.internal:4000 weight=1;   # 25%
    
    # Stage 5: Full Rollout
    # server green.advancia.internal:4000 weight=1;  # 100%
    # server blue.advancia.internal:4000 down;       # 0% (backup only)
    
    keepalive 32;
}

server {
    listen 80;
    server_name api.advancia.com;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Track which backend handled request
        add_header X-Served-By $upstream_addr always;
    }
}
```

### Option 2: Cloudflare Load Balancer

```bash
# Create load balancer pool with weighted backends
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/load_balancers/pools" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "advancia-canary-pool",
    "origins": [
      {
        "name": "green",
        "address": "'$GREEN_IP'",
        "enabled": true,
        "weight": 0.1
      },
      {
        "name": "blue",
        "address": "'$BLUE_IP'",
        "enabled": true,
        "weight": 0.9
      }
    ],
    "monitor": "'$HEALTH_CHECK_ID'",
    "notification_email": "ops@advancia.com"
  }'
```

### Option 3: HAProxy Weighted Routing

```haproxy
# /etc/haproxy/haproxy.cfg

frontend api_frontend
    bind *:80
    default_backend api_backend

backend api_backend
    balance roundrobin
    
    # Stage 1: 10% Canary
    server green green.advancia.internal:4000 check weight 10
    server blue blue.advancia.internal:4000 check weight 90
    
    # Health checks
    option httpchk GET /health HTTP/1.1\r\nHost:\ api.advancia.com
    http-check expect status 200
```

---

## 🔹 Monitoring & Health Checks

### Key Metrics to Monitor

#### 1. Error Rate
```bash
# Acceptable thresholds
Stage 1 (10%):  < 1.0% errors
Stage 2 (25%):  < 0.5% errors
Stage 3 (50%):  < 0.2% errors
Stage 4 (75%):  < 0.1% errors
Stage 5 (100%): < 0.1% errors
```

#### 2. Response Time (P95 Latency)
```bash
# Maximum acceptable latency
Stage 1 (10%):  < 500ms
Stage 2 (25%):  < 400ms
Stage 3 (50%):  < 350ms
Stage 4 (75%):  < 300ms
Stage 5 (100%): < 300ms
```

#### 3. Throughput
```bash
# Requests per second should not degrade
Green RPS ≥ 95% of Blue RPS
```

#### 4. CPU & Memory Usage
```bash
# Resource usage should be stable
CPU:    < 80%
Memory: < 85%
Disk:   < 90%
```

### Health Check Script

```bash
#!/bin/bash
# canary-health-check.sh

ENVIRONMENT=$1  # blue or green
IP=$2
STAGE=$3

echo "🏥 Running health checks for $ENVIRONMENT ($STAGE)"

# 1. Basic HTTP health check
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$IP:4000/health)
if [[ "$HTTP_CODE" != "200" ]]; then
    echo "❌ HTTP health check failed: $HTTP_CODE"
    exit 1
fi
echo "✅ HTTP health check passed"

# 2. Response time check
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" http://$IP:4000/health)
MAX_TIME=0.5
if (( $(echo "$RESPONSE_TIME > $MAX_TIME" | bc -l) )); then
    echo "❌ Response time too slow: ${RESPONSE_TIME}s (max: ${MAX_TIME}s)"
    exit 1
fi
echo "✅ Response time acceptable: ${RESPONSE_TIME}s"

# 3. Database connectivity
DB_CHECK=$(curl -s http://$IP:4000/health/db | jq -r '.status')
if [[ "$DB_CHECK" != "healthy" ]]; then
    echo "❌ Database health check failed"
    exit 1
fi
echo "✅ Database connectivity verified"

# 4. Redis connectivity
REDIS_CHECK=$(curl -s http://$IP:4000/health/redis | jq -r '.status')
if [[ "$REDIS_CHECK" != "healthy" ]]; then
    echo "❌ Redis health check failed"
    exit 1
fi
echo "✅ Redis connectivity verified"

# 5. Error rate check (from metrics endpoint)
ERROR_RATE=$(curl -s http://$IP:4000/metrics | grep 'http_requests_failed' | awk '{print $2}')
THRESHOLD=1.0
if (( $(echo "$ERROR_RATE > $THRESHOLD" | bc -l) )); then
    echo "❌ Error rate too high: ${ERROR_RATE}% (max: ${THRESHOLD}%)"
    exit 1
fi
echo "✅ Error rate acceptable: ${ERROR_RATE}%"

echo "✅ All health checks passed for $ENVIRONMENT"
exit 0
```

---

## 🔹 Rollback Triggers

### Automatic Rollback Conditions

1. **Health Check Failure**
   - Any endpoint returns non-200 status
   - Response time > 5 seconds
   - Service becomes unreachable

2. **Error Rate Spike**
   - Error rate increases by > 50% compared to Blue
   - Error rate exceeds stage threshold
   - Critical errors detected (5xx responses)

3. **Performance Degradation**
   - P95 latency increases by > 30%
   - Throughput drops by > 20%
   - CPU/Memory usage > 90%

4. **Database Issues**
   - Connection pool exhaustion
   - Query timeout rate increases
   - Transaction rollback rate spikes

5. **External Dependencies**
   - Payment gateway failures
   - Email service timeouts
   - SMS provider errors

### Manual Rollback Triggers

- Security vulnerability detected
- Data integrity issues
- Customer complaints spike
- Business-critical feature broken

---

## 🔹 Canary Decision Logic

```python
# canary_decision.py

def should_proceed_to_next_stage(green_metrics, blue_metrics, stage):
    """
    Determine if canary should proceed to next stage
    Returns: (proceed: bool, reason: str)
    """
    
    # 1. Error rate comparison
    if green_metrics.error_rate > blue_metrics.error_rate * 1.2:
        return False, f"Green error rate ({green_metrics.error_rate}%) > Blue ({blue_metrics.error_rate}%) by 20%"
    
    # 2. Latency comparison
    if green_metrics.p95_latency > blue_metrics.p95_latency * 1.3:
        return False, f"Green latency ({green_metrics.p95_latency}ms) > Blue ({blue_metrics.p95_latency}ms) by 30%"
    
    # 3. Absolute thresholds
    thresholds = {
        1: {"error_rate": 1.0, "latency": 500},
        2: {"error_rate": 0.5, "latency": 400},
        3: {"error_rate": 0.2, "latency": 350},
        4: {"error_rate": 0.1, "latency": 300},
        5: {"error_rate": 0.1, "latency": 300},
    }
    
    if green_metrics.error_rate > thresholds[stage]["error_rate"]:
        return False, f"Green error rate ({green_metrics.error_rate}%) exceeds threshold ({thresholds[stage]['error_rate']}%)"
    
    if green_metrics.p95_latency > thresholds[stage]["latency"]:
        return False, f"Green latency ({green_metrics.p95_latency}ms) exceeds threshold ({thresholds[stage]['latency']}ms)"
    
    # 4. Resource usage
    if green_metrics.cpu_usage > 85:
        return False, f"Green CPU usage too high: {green_metrics.cpu_usage}%"
    
    if green_metrics.memory_usage > 90:
        return False, f"Green memory usage too high: {green_metrics.memory_usage}%"
    
    # All checks passed
    return True, "All metrics within acceptable ranges"
```

---

## 🔹 Benefits of Canary Deployment

### ✅ Risk Mitigation
- Only 10% of users affected if issues arise
- Gradual rollout allows early detection
- Instant rollback minimizes downtime

### ✅ Real-World Validation
- Test with actual production traffic patterns
- Validate performance under real load
- Catch edge cases missed in staging

### ✅ Confidence Building
- Progressive traffic increase builds confidence
- Each stage validates the next
- Team can monitor and intervene

### ✅ Continuous Monitoring
- Automated health checks at each stage
- Metrics comparison (Green vs Blue)
- Early warning system for issues

---

## 🔹 Canary vs Blue/Green

| Aspect | Blue/Green | Canary |
|--------|-----------|--------|
| **Traffic Switch** | All-at-once (100%) | Gradual (10→25→50→75→100%) |
| **Risk** | Higher (all users affected) | Lower (limited blast radius) |
| **Rollback** | Instant DNS switch | Instant traffic shift back |
| **Complexity** | Lower | Higher (multiple stages) |
| **Monitoring** | Post-deployment | During deployment |
| **User Impact** | All users immediately | Limited subset first |
| **Best For** | Well-tested releases | Risky/major changes |

### When to Use Canary

✅ Major feature releases  
✅ Architecture changes  
✅ Database schema migrations  
✅ Third-party integrations  
✅ Performance optimizations  
✅ Security patches (non-critical)  

### When to Use Blue/Green

✅ Minor bug fixes  
✅ Config changes  
✅ Well-tested features  
✅ Emergency hotfixes  
✅ Rollback scenarios  

---

## 🔹 Hybrid Approach: Canary → Blue/Green

**Best of both worlds:**

1. **Use Canary for initial rollout**
   - Deploy to Green
   - Gradually shift traffic (10→25→50→75%)
   - Monitor metrics at each stage

2. **Use Blue/Green for final switch**
   - Once 75% traffic on Green looks good
   - Final DNS switch to 100% Green
   - Keep Blue as instant rollback

3. **Keep both environments warm**
   - Green serves production traffic
   - Blue ready for instant rollback
   - Can quickly revert to Blue if needed

---

## 📊 Example Timeline

```
00:00 - Deploy to Green, health checks ✅
00:05 - Stage 1: 10% traffic → Green
00:10 - Monitor 5 minutes... ✅
00:10 - Stage 2: 25% traffic → Green
00:15 - Monitor 5 minutes... ✅
00:15 - Stage 3: 50% traffic → Green
00:25 - Monitor 10 minutes... ✅
00:25 - Stage 4: 75% traffic → Green
00:35 - Monitor 10 minutes... ✅
00:35 - Stage 5: 100% traffic → Green
01:05 - Monitor 30 minutes... ✅
01:05 - Deployment complete! 🎉
```

**Total duration**: ~65 minutes (safe, monitored rollout)

---

## ✅ Setup Checklist

- [ ] Configure load balancer for weighted routing
- [ ] Set up comprehensive health check endpoints
- [ ] Implement metrics collection (Prometheus/Grafana)
- [ ] Create canary decision logic script
- [ ] Configure automated rollback triggers
- [ ] Set up alerting for each canary stage
- [ ] Test rollback procedure
- [ ] Document rollback playbook
- [ ] Train team on canary process
- [ ] Create runbook for canary deployment

---

**Last Updated**: November 15, 2025  
**Status**: Ready for canary implementation ✅

See `CANARY_DEPLOYMENT_WORKFLOW.yml` for GitHub Actions implementation.
