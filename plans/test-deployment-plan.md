# Test and Deployment Plan

## Overview
This document outlines the comprehensive testing and deployment strategy for the Instapvstory.com backend migration. The plan ensures a smooth transition from the current direct Instagram API architecture to the new backend with PostgreSQL, Redis caching, and REST API.

## Deployment Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Production    │     │   Staging       │     │   Development   │
│   Environment   │     │   Environment   │     │   Environment   │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ • Vercel/Netlify│     │ • Vercel Preview│     │ • Localhost     │
│ • Neon DB       │     │ • Neon DB (dev) │     │ • Docker Compose│
│ • Redis Cloud   │     │ • Redis Cloud   │     │ • Local Redis   │
│ • API v1        │     │ • API v1        │     │ • API v1        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Phase 1: Pre-Deployment Testing

### 1.1 Unit Testing
**Objective**: Test individual components in isolation.

#### Test Files to Create:
1. `__tests__/services/database.service.test.ts`
2. `__tests__/services/cache.service.test.ts`
3. `__tests__/services/api.service.test.ts`
4. `__tests__/lib/api-client.test.ts`
5. `__tests__/api/routes/profiles.test.ts`

#### Example Test (database.service.test.ts):
```typescript
import { db } from '@/services/database.service'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma')

describe('DatabaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getProfileByUsername', () => {
    it('should return profile data for valid username', async () => {
      const mockProfile = {
        id: '123',
        username: 'instagram',
        fullName: 'Instagram'
      }
      
      prisma.profile.findUnique.mockResolvedValue(mockProfile)
      
      const result = await db.getProfileByUsername('instagram')
      
      expect(prisma.profile.findUnique).toHaveBeenCalledWith({
        where: { username: 'instagram' },
        include: expect.any(Object)
      })
      expect(result).toEqual(mockProfile)
    })
  })
})
```

### 1.2 Integration Testing
**Objective**: Test interactions between components.

#### Test Scenarios:
1. API → Redis → Database flow
2. Cache miss → Database query → Cache update
3. Database → Instagram API fallback

#### Integration Test Script:
```typescript
// tests/integration/api-flow.test.ts
describe('API Integration Flow', () => {
  it('should handle cache miss and update cache', async () => {
    // Clear cache
    await cache.clearUserCache('instagram')
    
    // First request (cache miss)
    const response1 = await apiClient.getProfile('instagram')
    expect(response1.data.metadata.cached).toBe(false)
    
    // Second request (cache hit)
    const response2 = await apiClient.getProfile('instagram')
    expect(response2.data.metadata.cached).toBe(true)
  })
})
```

### 1.3 End-to-End Testing
**Objective**: Test complete user flows.

#### E2E Test Scenarios:
1. User searches for profile → displays data
2. User clicks on post → opens media modal
3. User clicks on highlight → plays media
4. User switches between tabs (posts, followers, follows)

#### Playwright Test Example:
```typescript
// e2e/profile-flow.spec.ts
import { test, expect } from '@playwright/test'

test('complete profile flow', async ({ page }) => {
  // Navigate to profile page
  await page.goto('/instagram')
  
  // Wait for loading
  await page.waitForSelector('.profile-header', { timeout: 10000 })
  
  // Verify profile data
  const username = await page.textContent('.username')
  expect(username).toContain('instagram')
  
  // Click on first post
  await page.click('.post-grid img:first-child')
  
  // Verify modal opens
  await page.waitForSelector('.media-modal', { timeout: 5000 })
  
  // Close modal
  await page.click('.modal-close')
})
```

### 1.4 Performance Testing
**Objective**: Ensure system meets performance requirements.

#### Performance Benchmarks:
1. **Response Time**: < 500ms for cached, < 2000ms for uncached
2. **Throughput**: 100 requests/second
3. **Cache Hit Rate**: > 80%
4. **Error Rate**: < 1%

#### Load Test Script (using k6):
```javascript
// load-tests/profile-api.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up
    { duration: '1m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
}

export default function () {
  const res = http.get('http://localhost:3000/api/v1/profiles/instagram')
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
  
  sleep(1)
}
```

## Phase 2: Staging Environment Setup

### 2.1 Environment Configuration
Create `.env.staging`:
```env
# Database
DATABASE_URL="postgresql://neondb_owner:password@ep-staging-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Redis
REDIS_URL="rediss://:password@staging-redis.upstash.io:6379"
REDIS_TLS=true

# Instagram API
INSTAGRAM_ACCESS_TOKEN="EAAMhsSzKmTYBRCiumkg3zgCDb22i7QZCZBMsTxxF8SCKu3jg9N9GRWSO0KeDG5dNas6dzyuvS1PFJ59BKQgZBMWpArw3OQLHxxChEDZC7P0R1qczpvrkwUwh2k8f09OJhcadxd3mW5Yx0IBChyJI8l0UO3O0ZBg5DJi6xmG2bgBrUzxgZBkOiViuhDVTyj5ZCj7"

# API Configuration
NEXT_PUBLIC_API_BASE=/api/v1
API_RATE_LIMIT_PER_HOUR=100
```

### 2.2 Database Migration
```bash
# Apply migrations to staging database
npx prisma migrate deploy --schema=./prisma/schema.prisma

# Seed test data
npx tsx scripts/seed-staging-data.ts
```

### 2.3 Cache Warm-up
```bash
# Warm up cache with popular profiles
npx tsx scripts/warm-cache.ts --env=staging
```

### 2.4 Deployment to Staging
```bash
# Build and deploy to Vercel staging
vercel deploy --prod --env DATABASE_URL=$STAGING_DB_URL --env REDIS_URL=$STAGING_REDIS_URL
```

## Phase 3: Staging Validation

### 3.1 Smoke Tests
**Objective**: Verify basic functionality works in staging.

#### Smoke Test Checklist:
- [ ] API health endpoint returns 200
- [ ] Profile endpoint returns data for test users
- [ ] Cache is working (check response headers)
- [ ] Database connections are stable
- [ ] Error handling works correctly

#### Automated Smoke Test:
```bash
# Run smoke tests
npm run test:smoke -- --env=staging
```

### 3.2 Performance Validation
**Objective**: Ensure performance meets requirements in staging.

#### Performance Tests:
```bash
# Run load tests against staging
k6 run load-tests/profile-api.js --env API_URL=https://staging.instapvstory.com
```

### 3.3 Security Validation
**Objective**: Ensure security best practices are followed.

#### Security Checks:
1. **Environment Variables**: No secrets in code
2. **API Rate Limiting**: Enabled and configured
3. **CORS**: Properly configured
4. **Database**: SSL connections enabled
5. **Redis**: TLS connections enabled

### 3.4 User Acceptance Testing (UAT)
**Objective**: Get feedback from stakeholders.

#### UAT Checklist:
- [ ] Profile pages load correctly
- [ ] Media displays properly (images, videos)
- [ ] Highlights are playable
- [ ] Navigation between tabs works
- [ ] Error messages are user-friendly
- [ ] Performance feels fast

## Phase 4: Production Deployment

### 4.1 Production Environment Setup
Create `.env.production`:
```env
# Database (Neon Production)
DATABASE_URL="postgresql://neondb_owner:prod_password@ep-production-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Redis (Redis Cloud Production)
REDIS_URL="rediss://:prod_password@production-redis.upstash.io:6379"
REDIS_TLS=true

# API Configuration
NEXT_PUBLIC_API_BASE=/api/v1
API_RATE_LIMIT_PER_HOUR=500
```

### 4.2 Database Migration Strategy
**Blue-Green Deployment**:
1. Create new database migration
2. Apply to production database
3. Verify migration success
4. Update application to use new schema

#### Migration Script:
```bash
#!/bin/bash
# deploy-migration.sh

echo "Starting database migration..."

# Backup current database
echo "Creating backup..."
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Apply migrations
echo "Applying migrations..."
npx prisma migrate deploy

# Verify migration
echo "Verifying migration..."
npx prisma db execute --file ./scripts/verify-migration.sql

echo "Migration completed successfully!"
```

### 4.3 Cache Strategy for Production
**Cache Warming**:
```typescript
// scripts/warm-production-cache.ts
const popularProfiles = [
  'instagram', 'cristiano', 'therock', 'kyliejenner',
  'leomessi', 'selenagomez', 'kimkardashian', 'beyonce'
]

async function warmProductionCache() {
  console.log('Warming production cache...')
  
  for (const username of popularProfiles) {
    try {
      await apiClient.getProfile(username)
      console.log(`✅ Warmed cache for: ${username}`)
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`❌ Failed to warm cache for ${username}:`, error.message)
    }
  }
  
  console.log('Cache warming completed!')
}
```

### 4.4 Deployment Rollout Strategy
**Canary Deployment**:
1. **Phase 1**: 5% of traffic to new backend
2. **Phase 2**: 25% of traffic (if no issues)
3. **Phase 3**: 50% of traffic
4. **Phase 4**: 100% of traffic

#### Traffic Routing Configuration:
```typescript
// Feature flag for canary deployment
const CANARY_PERCENTAGE = 0.05 // 5%

export async function fetchProfile(username: string) {
  const useNewBackend = Math.random() < CANARY_PERCENTAGE
  
  if (useNewBackend) {
    return fetchProfileFromNewAPI(username)
  } else {
    return fetchProfileFromDirectAPI(username)
  }
}
```

### 4.5 Monitoring Setup
**Key Metrics to Monitor**:
1. **Application Metrics**:
   - Response time (p50, p95, p99)
   - Error rate (4xx, 5xx)
   - Request rate (RPM)
   - Cache hit rate

2. **Infrastructure Metrics**:
   - Database connections
   - Redis memory usage
   - CPU/Memory usage
   - Network throughput

3. **Business Metrics**:
   - Active users
   - Profile views
   - Cache effectiveness
   - API cost savings

#### Monitoring Dashboard (Grafana):
```yaml
# grafana/dashboard.yaml
dashboard:
  title: "Instapvstory Backend Performance"
  panels:
    - title: "API Response Time"
      type: "graph"
      metrics:
        - "rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])"
    
    - title: "Cache Hit Rate"
      type: "stat"
      metrics:
        - "redis_cache_hits / (redis_cache_hits + redis_cache_misses) * 100"
```

## Phase 5: Post-Deployment Activities

### 5.1 Performance Monitoring
**First 24 Hours**:
- Monitor response times every 15 minutes
- Check error rates every 30 minutes
- Verify cache hit rate every hour
- Monitor database connections

#### Alert Configuration:
```yaml
# alerts/alerts.yaml
alerts:
  - name: "High Error Rate"
    condition: "error_rate > 5"
    duration: "5m"
    severity: "critical"
    channels: ["slack", "pagerduty"]
  
  - name: "Slow Response Time"
    condition: "p95_response_time > 2000"
    duration: "10m"
    severity: "warning"
    channels: ["slack"]
  
  - name: "Low Cache Hit Rate"
    condition: "cache_hit_rate < 50"
    duration: "30m"
    severity: "warning"
    channels: ["slack"]
```

### 5.2 Rollback Plan
**Conditions for Rollback**:
1. Error rate > 10% for 15 minutes
2. Response time > 5000ms for 10 minutes
3. Database connection failures
4. Cache system failure

#### Rollback Procedure:
```bash
#!/bin/bash
# rollback.sh

echo "Initiating rollback..."

# 1. Update feature flag to 0% traffic
echo "Setting canary percentage to 0%..."
update_feature_flag "canary_percentage" "0"

# 2. Clear new backend cache
echo "Clearing new backend cache..."
redis-cli -h $NEW_REDIS_HOST FLUSHALL

# 3. Verify old backend is working
echo "Verifying old backend..."
curl -f https://old-backend.instapvstory.com/health

if [ $? -eq 0 ]; then
  echo "✅ Rollback completed successfully"
else
  echo "❌ Rollback failed - old backend not responding"
  exit 1
fi
```

### 5.3 Documentation Update
**Update Documentation**:
1. API documentation (OpenAPI/Swagger)
2. Deployment runbook
3. Troubleshooting guide
4. Monitoring guide
5. Rollback procedures

### 5.4 Team Training
**Training Sessions**:
1. New architecture overview
2. Monitoring and alerting
3. Troubleshooting common issues
4. Performance optimization techniques
5. Disaster recovery procedures

## Phase 6: Optimization and Scaling

### 6.1 Performance Optimization
**Areas for Optimization**:
1. **Database**: Query optimization, indexing
2. **Cache**: TTL optimization, cache warming strategies
3. **API**: Response compression, pagination optimization
4. **Frontend**: Lazy loading, code splitting

### 6.2 Scaling Strategy
**Horizontal Scaling**:
1. **API Layer**: Multiple instances behind load balancer
2. **Cache Layer**: Redis Cluster for high availability
3. **Database**: Read replicas for read-heavy workloads
4. **CDN**: Static assets delivery

### 6.3 Cost Optimization
**Cost Reduction Strategies**:
1. **Cache Optimization**: Reduce Instagram API calls
2. **Database Optimization**: Efficient queries, connection pooling
3. **CDN Usage**: Cache static assets
4. **Monitoring**: Right-size infrastructure

## Testing Summary

### Test Coverage Goals
- **Unit Tests**: 80% coverage
- **Integration Tests**: 70% coverage  
- **E2E Tests**: Critical user flows
- **Performance Tests**: Load, stress, endurance

### Test Execution Timeline
```
Day 1-2: Unit & Integration Tests
Day 3: E2E Tests
Day 4: Performance Tests
Day 5: Staging Deployment & Validation
Day 6: Production Deployment (Canary)
Day 7-14: Monitoring & Optimization
```

## Success Criteria

### Technical Success Criteria
1. **Performance**: 95% of requests < 500ms
2. **Reliability**: 99.9% uptime
3. **Cache Efficiency**: > 80% cache hit rate
4. **Error Rate**: < 1% error rate
5. **Scalability**: Handle 10x current traffic

### Business Success Criteria
1. **User Experience**: No degradation in UX
2. **Cost Reduction**: 90% reduction in Instagram API calls
3. **Maintainability**: Easier to debug and monitor
4. **Scalability**: Ready for user growth

## Risk Mitigation

### Identified Risks and Mitigations
1. **Database Migration Failure**: Rollback plan, backups
2. **Cache Invalidation Issues**: Clear cache strategy, monitoring
3. **API Rate Limiting**: Rate limiting, circuit breaker pattern
4. **Performance Degradation**: Performance monitoring, auto-scaling
5. **Data Loss**: Regular backups, point-in-time recovery

## Conclusion

This comprehensive test and deployment plan ensures a smooth transition to the new backend architecture. By following this phased approach with thorough testing at each stage, we minimize risks and ensure a successful deployment that improves performance, reliability, and scalability while maintaining an excellent user experience.

### Final Checklist Before Production Deployment
- [ ] All tests passing
- [ ] Staging environment validated
- [ ] Performance benchmarks met
- [ ] Monitoring and alerting configured
- [ ] Rollback plan tested
- [ ] Team trained on new system
- [ ] Documentation updated
- [ ] Stakeholder approval obtained