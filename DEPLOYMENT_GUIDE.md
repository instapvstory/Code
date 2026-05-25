# Deployment and Monitoring Guide - CDN-First Architecture

## Overview
This guide provides instructions for deploying the PvStoryViewer.com application with the CDN-first architecture (Vercel + Supabase + Cloudflare). This architecture is optimized for 100k monthly traffic with zero media storage costs.

## Architecture Overview
- **Frontend/API**: Vercel (Next.js 15)
- **Database/Cache**: Supabase PostgreSQL
- **CDN**: Cloudflare (via Vercel Edge Network)
- **Caching**: Multi-layer (Memory → Database → Instagram API)
- **Media Storage**: None (only metadata + Instagram URLs)

## Deployment Options

### 1. Vercel (Recommended)
- **Setup**: Connect your GitHub repository to Vercel
- **Environment Variables** (set in Vercel dashboard):
  ```
  # Supabase Configuration
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_ANON_KEY=your-anon-key-here
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
  
  # Optional: Instagram API (for fallback)
  INSTAGRAM_ACCESS_TOKEN=your-instagram-access-token-here
  
  # Cache Configuration
  CACHE_TTL_MINUTES=10
  MAX_CACHE_AGE_HOURS=24
  
  # Rate Limiting
  RATE_LIMIT_REQUESTS_PER_MINUTE=60
  RATE_LIMIT_REQUESTS_PER_HOUR=1000
  
  # CDN Cache Headers
  CDN_CACHE_DURATION_SECONDS=600
  BROWSER_CACHE_DURATION_SECONDS=300
  ```
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Framework Preset**: Next.js

### 2. Supabase Database Setup
1. **Create Supabase Project**:
   - Sign up at supabase.com
   - Create new project
   - Wait for database to be provisioned

2. **Initialize Database**:
   - Go to SQL Editor in Supabase dashboard
   - Run the SQL from `database/schema.sql`
   - This creates `profiles` and `media_cache` tables with indexes

3. **Get Connection Details**:
   - Go to Project Settings > Database
   - Get `Connection string` (URI format)
   - Get `Project URL` and `anon`/`service_role` keys

### 3. Cloudflare CDN Configuration
Vercel automatically uses Cloudflare's global edge network. For optimal caching:

1. **Custom Domain** (optional):
   - Add custom domain in Vercel project settings
   - Vercel automatically configures Cloudflare DNS

2. **Cache Optimization**:
   - API responses include `Cache-Control: public, s-maxage=600` headers
   - Static assets are cached at edge for 1 year
   - HTML pages are cached for 5 minutes

## Environment Configuration

### Required Variables for Production
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: Instagram API (for data fetching)
INSTAGRAM_ACCESS_TOKEN=your-instagram-access-token-here

# Cache Configuration
CACHE_TTL_MINUTES=10
MAX_CACHE_AGE_HOURS=24

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_REQUESTS_PER_HOUR=1000

# CDN Cache Headers
CDN_CACHE_DURATION_SECONDS=600
BROWSER_CACHE_DURATION_SECONDS=300
```

### Development Setup
1. Copy `.env.example` to `.env.local`
2. Update with your Supabase credentials
3. Run `npm run dev` to start development server

## Database Schema

### Tables
1. **profiles** - Instagram profile metadata
   - `username` (unique), `instagram_id`, `full_name`, `bio`
   - `followers_count`, `following_count`, `posts_count`
   - `last_fetched` (for cache validation)
   - `created_at`, `updated_at`

2. **media_cache** - Cached media URLs
   - `profile_id`, `media_url`, `thumb_url`, `media_type`
   - `instagram_id`, `width`, `height`, `duration`
   - `likes_count`, `comments_count`, `timestamp`

### Indexes
- `profiles_username_idx` on `profiles(username)` 
- `profiles_last_fetched_idx` on `profiles(last_fetched)`
- `media_cache_profile_id_idx` on `media_cache(profile_id)`

## Monitoring Setup

### 1. Application Monitoring
- **Vercel Analytics**: Built-in with Vercel deployment
- **Health Endpoint**: `GET /api/health` returns service status
- **Logging**: Console logs with cache hit/miss statistics

### 2. Database Monitoring (Supabase)
- **Dashboard**: Supabase project dashboard
- **Metrics**: Query performance, connection pool usage
- **Logs**: SQL query logs in Supabase Logs Explorer

### 3. Performance Monitoring
- **Web Vitals**: Next.js built-in web vitals reporting
- **Cache Hit Rate**: Monitor via application logs
- **API Response Times**: Track via Vercel Analytics

## Health Checks

### API Health Endpoint
- `GET /api/health`: Returns service status
- Checks: API, Database (Supabase), Cache service
- Expected response: 200 OK with JSON health status

### Database Health
- Regular connection tests via Supabase dashboard
- Query performance monitoring
- Backup verification (Supabase automatic backups)

### Cache Health
- Memory cache hit/miss ratios
- Database cache validation with `last_fetched`
- Cache size monitoring

## Backup Strategy

### Database Backups (Supabase)
1. **Automated Backups**:
   - Supabase provides daily backups with 7-day retention
   - Point-in-time recovery available

2. **Manual Backups**:
   ```sql
   -- Export data
   pg_dump -h db.supabase.co -U postgres -d postgres > backup.sql
   ```

### Application Backups
- GitHub repository as source of truth
- Environment variables stored in Vercel dashboard
- `vercel.json` configuration in repository

## Scaling Considerations

### Vertical Scaling
- Upgrade Supabase database plan for more resources
- Increase Vercel function memory/CPU allocation
- Adjust cache TTL based on traffic patterns

### Horizontal Scaling
- Vercel automatically scales across edge locations
- Supabase connection pooling for database connections
- Memory cache is per-instance (stateless)

### CDN Optimization
- Cache hit ratio should be >90% for popular profiles
- Adjust `s-maxage` headers based on profile popularity
- Implement stale-while-revalidate for better UX

## Cost Optimization

### Zero-Cost Strategy
1. **Vercel Hobby Plan**: Free for personal projects
2. **Supabase Free Tier**: 500MB database, 50MB file storage
3. **Cloudflare CDN**: Free with Vercel
4. **No Media Storage**: Only store metadata, not media files

### Estimated Monthly Costs (100k traffic)
- **Vercel**: $0 (Hobby plan)
- **Supabase**: $0 (Free tier)
- **Cloudflare**: $0 (Included with Vercel)
- **Total**: $0/month

### Scaling Costs
- 1M+ traffic: Supabase Pro ($25/month)
- High database usage: Scale Supabase compute
- Custom domain: Domain registration cost only

## Troubleshooting

### Common Issues
1. **Supabase Connection Errors**:
   - Check environment variables
   - Verify Supabase project is active
   - Check network connectivity

2. **Cache Not Working**:
   - Verify `last_fetched` is being updated
   - Check cache TTL configuration
   - Monitor cache hit/miss logs

3. **Rate Limiting Issues**:
   - Adjust `RATE_LIMIT_REQUESTS_PER_MINUTE`
   - Check IP detection in production
   - Monitor 429 responses

### Debugging
1. **Local Development**:
   ```bash
   npm run dev
   # Check console for cache logs
   ```

2. **Production Logs**:
   - Vercel deployment logs
   - Supabase query logs
   - Application error tracking

## Deployment Checklist

### Pre-Deployment
- [ ] Supabase project created and database initialized
- [ ] Environment variables configured in Vercel
- [ ] Custom domain configured (optional)
- [ ] Database schema applied (`database/schema.sql`)

### Post-Deployment
- [ ] Health check passes (`/api/health`)
- [ ] API endpoints responding correctly
- [ ] Cache working (check logs for hits/misses)
- [ ] CDN headers present in responses
- [ ] Rate limiting functioning

### Monitoring Setup
- [ ] Vercel analytics enabled
- [ ] Error tracking configured (optional)
- [ ] Uptime monitoring set up
- [ ] Performance metrics being collected

## Support
- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **GitHub Repository**: Your repo URL here