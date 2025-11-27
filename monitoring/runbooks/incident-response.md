# Advancia Pay Incident Response Runbooks

## 🚨 Critical Alerts

### Service Down

**Severity**: Critical  
**Response Time**: Immediate (< 5 minutes)

#### Symptoms

- Service health checks failing
- 500 errors on health endpoint
- PagerDuty alert triggered

#### Investigation Steps

1. **Check service status**

   ```bash
   # Check if containers are running
   docker ps | grep advancia

   # Check logs for errors
   docker logs advancia-backend --tail 100
   docker logs advancia-frontend --tail 100
   ```

2. **Verify external dependencies**

   ```bash
   # Check database connectivity
   psql $DATABASE_URL -c "SELECT 1;"

   # Check Redis (if applicable)
   redis-cli -u $REDIS_URL ping
   ```

3. **Check resource usage**

   ```bash
   # Memory and CPU usage
   docker stats

   # Disk space
   df -h
   ```

#### Resolution Steps

1. **Immediate Actions**
   - Restart affected services
   - Scale up if resource constrained
   - Enable maintenance page if needed

2. **Service Restart**

   ```bash
   # Restart backend
   docker-compose restart backend

   # Restart frontend
   docker-compose restart frontend
   ```

3. **Rollback if Recent Deployment**

   ```bash
   # Rollback to previous version
   git checkout HEAD~1
   docker-compose up -d --build
   ```

#### Escalation

- If not resolved in 15 minutes, escalate to Platform Lead
- If customer-facing impact > 30 minutes, notify leadership

---

### SLA Breach (< 99% Uptime)

**Severity**: Critical  
**Response Time**: Immediate

#### Symptoms - SLA Breach

- 24h uptime below 99%
- Multiple service degradation events
- Customer complaints about availability

#### Investigation Steps - SLA Breach

1. **Review incident timeline**

   ```bash
   # Check Grafana dashboard for timeline
   # Review alertmanager for recent alerts
   # Check GitHub Actions for recent deployments
   ```

2. **Analyze root cause**
   - Recent deployments or changes
   - External service dependencies
   - Infrastructure issues

#### Resolution Steps

1. **Immediate Stabilization**
   - Ensure all services are healthy
   - Verify monitoring is accurate
   - Check for ongoing issues

2. **Root Cause Analysis**
   - Document all incidents in the period
   - Identify patterns or common causes
   - Update monitoring if gaps found

3. **Customer Communication**
   - Prepare incident report
   - Notify affected customers
   - Provide timeline for resolution

#### Follow-up Actions

- Post-incident review within 24h
- Update monitoring and alerting
- Implement preventive measures

---

### High Error Rate (> 5%)

**Severity**: Critical  
**Response Time**: < 10 minutes

#### Investigation Steps - High Error Rate

1. **Identify error patterns**

   ```bash
   # Check logs for error patterns
   grep -E "ERROR|FATAL" logs/app.log | tail -50

   # Check specific endpoints
   grep "500\|502\|503\|504" logs/access.log | tail -20
   ```

2. **Check recent changes**
   - Review recent deployments
   - Check configuration changes
   - Check feature flags

#### Resolution Steps - High Error Rate

1. **Quick fixes**
   - Rollback recent deployment if applicable
   - Restart services to clear transient issues
   - Scale up if resource-related

2. **Targeted fixes**
   - Fix identified bugs
   - Update configuration
   - Clear problematic cache

---

## ⚠️ Warning Alerts

### SLA Degradation (< 99.5%)

**Severity**: Warning  
**Response Time**: < 30 minutes

#### Investigation Steps - SLA Degradation

1. **Check service performance**
   - Review response times
   - Check error rates
   - Monitor resource usage

2. **Identify trends**
   - Look for gradual degradation
   - Check for capacity issues
   - Review traffic patterns

#### Resolution Steps - SLA Degradation

1. **Performance optimization**
   - Optimize slow queries
   - Scale services if needed
   - Clear unnecessary cache

2. **Preventive measures**
   - Monitor trends closely
   - Prepare for scaling
   - Update capacity planning

---

### High Response Time

**Severity**: Warning  
**Response Time**: < 30 minutes

#### Investigation Steps - High Response Time

1. **Database performance**

   ```sql
   -- Check slow queries
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

2. **Application performance**
   - Check CPU and memory usage
   - Review recent code changes
   - Verify external API performance

#### Resolution Steps - High Response Time

1. **Database optimization**
   - Add missing indexes
   - Optimize slow queries
   - Consider read replicas

2. **Application optimization**
   - Optimize hot code paths
   - Add caching where appropriate
   - Scale horizontally if needed

---

## 📞 Escalation Procedures

### On-Call Rotation

1. **Primary**: Platform Engineer (immediate response)
2. **Secondary**: Platform Lead (15 min escalation)
3. **Tertiary**: Engineering Manager (30 min escalation)

### Escalation Criteria

- **Critical alerts not resolved in 15 minutes**
- **SLA breach confirmed**
- **Customer escalation**
- **Security incident suspected**

### Communication Channels

- **Critical**: PagerDuty → Phone/SMS
- **Updates**: Slack #incidents channel
- **Customer communication**: Support team lead
- **Executive updates**: Email to leadership

---

## 📋 Post-Incident Process

### Immediate (< 1 hour)

- [ ] Incident resolved and services stable
- [ ] PagerDuty incident resolved
- [ ] Initial timeline documented
- [ ] Key stakeholders notified

### Short-term (< 24 hours)

- [ ] Detailed timeline created
- [ ] Root cause identified
- [ ] Customer impact assessed
- [ ] Initial incident report drafted

### Follow-up (< 1 week)

- [ ] Post-incident review completed
- [ ] Action items assigned and tracked
- [ ] Process improvements implemented
- [ ] Monitoring enhancements deployed

### Documentation

- All incidents logged in incident tracking system
- Runbook updates based on learnings
- Process improvements documented
- Training materials updated if needed
