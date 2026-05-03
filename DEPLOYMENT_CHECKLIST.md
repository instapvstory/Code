# Deployment Checklist - CDN-First Instagram Profile Viewer

## ✅ COMPLETED
- [x] CDN-first architecture implemented (Cloudflare + Vercel)
- [x] Multi-layer caching system (memory → database → API)
- [x] Instagram API integration with real access token
- [x] 24-hour cache duration for profiles
- [x] Rate limiting implemented
- [x] Frontend profile display working
- [x] Vercel configuration with cache headers

## 🔧 CREDENTIALS NEEDED

### 1. Supabase Database (Required for persistent cache)
**Status: ❌ MISSING**

**Steps:**
1. Create free account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Project Settings → API
4. Copy these values to `.env` file:
   - `SUPABASE_URL` = Your Project URL
   - `SUPABASE_ANON_KEY` = `anon public` key
   - `SUPABASE_SERVICE_ROLE_KEY` = `service_role` key
5. Run SQL schema: Copy contents of `database/schema.sql` to Supabase SQL editor

### 2. Instagram Access Token
**Status: ✅ READY**
- Token is already in `.env.local`
- Working for real Instagram profiles

### 3. Cloudflare CDN
**Status: ✅ READY**
- No API keys needed
- Configured in `vercel.json` with 24-hour cache headers
- Automatically works when deployed to Vercel

## 🚀 DEPLOYMENT STEPS

### Option A: Deploy to Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `INSTAGRAM_ACCESS_TOKEN`
4. Deploy

### Option B: Deploy to Hostinger
1. Build project: `npm run build`
2. Deploy `/.next` folder to Hostinger
3. Set up environment variables on server

## 📊 PERFORMANCE EXPECTATIONS

### Without Supabase (Current State):
- First request: ~5 seconds (Instagram API call)
- Subsequent requests: Instant (memory cache)
- Cache persistence: Lost on server restart

### With Supabase:
- First request: ~5 seconds (Instagram API call)
- Subsequent requests: Instant (database cache)
- Cache persistence: Survives server restarts
- 24-hour cache duration

## 🔍 TESTING CHECKLIST

- [ ] Profile loads with correct counts (posts, followers, following)
- [ ] Profile picture displays
- [ ] Cache works (second load is faster)
- [ ] Rate limiting works (try rapid requests)
- [ ] 24-hour cache duration (check headers)

## 🛠️ TROUBLESHOOTING

### Common Issues:

1. **Supabase Connection Errors**
   - Check credentials in `.env`
   - Verify Supabase project is active
   - Run SQL schema in Supabase

2. **Instagram API Errors**
   - Token might have expired
   - User might not be a business account
   - API rate limits

3. **Slow First Load**
   - Normal: Instagram API takes time
   - Improves with caching

4. **Posts/Reels Not Showing**
   - Instagram API might not return media for some accounts
   - System falls back to empty array

## 📈 OPTIMIZATION OPPORTUNITIES

1. **Pre-warm cache** for popular profiles
2. **Implement background refresh** for cached profiles
3. **Add more CDN cache rules** in Cloudflare
4. **Implement edge caching** with Vercel Edge Functions

## 📞 SUPPORT

For issues:
1. Check server logs for errors
2. Verify environment variables
3. Test API endpoint directly: `/api/profiles/[username]`
4. Check browser console for frontend errors