# 🚀 SF Dashboard V2 → Supabase Migration Guide

This guide will help you migrate your SF Dashboard from local backend to Supabase for production deployment on Vercel.

## 📋 **Prerequisites**

- ✅ SF Dashboard V2 running locally
- ✅ Backend running on localhost:3002
- ✅ 454+ events currently working
- ✅ Node.js and npm installed

## 🗄️ **Step 1: Create Supabase Project**

1. **Go to [supabase.com](https://supabase.com)**
2. **Click "Start your project"**
3. **Sign in with GitHub**
4. **Click "New Project"**
5. **Choose your organization**
6. **Project name**: `sf-dashboard-v2`
7. **Database password**: Generate a strong password
8. **Region**: Choose closest to you (e.g., `West US (N. California)`)
9. **Click "Create new project"**

## 🔑 **Step 2: Get API Keys**

1. **Wait for project to finish setting up** (2-3 minutes)
2. **Go to Settings → API**
3. **Copy these values**:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public**: `your-anon-key-here`
   - **service_role**: `your-service-role-key-here`

## 🗃️ **Step 3: Set Up Database**

1. **Go to SQL Editor in Supabase**
2. **Copy the contents of `supabase-schema.sql`**
3. **Paste and run the SQL**
4. **Verify tables are created**:
   - `events` table
   - `venues` table
   - Functions and triggers

## ⚙️ **Step 4: Configure Environment**

1. **Create `.env.local` file** in your project root:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# For migration script
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

2. **Install Supabase client**:
```bash
npm install @supabase/supabase-js
```

## 🔄 **Step 5: Migrate Data**

1. **Ensure backend is running**: `node simple-backend-service.js`
2. **Run migration script**:
```bash
node scripts/migrate-to-supabase.js
```

3. **Verify migration**:
   - Check Supabase dashboard → Table Editor
   - Should see ~454 events in `events` table
   - Should see venues in `venues` table

## 🧪 **Step 6: Test Supabase Integration**

1. **Update your frontend** to use Supabase instead of localhost:3002
2. **Test that events load** from database
3. **Test that venues display** correctly
4. **Test custom venue addition** (+ button)

## 🚀 **Step 7: Deploy to Vercel**

1. **Push code to GitHub**
2. **Connect to Vercel**
3. **Add environment variables** in Vercel dashboard
4. **Deploy**

## 📊 **Database Management**

### **Automatic Cleanup**
- **Daily**: Events older than 7 days are deleted
- **Weekly**: Events older than 30 days are deleted
- **Monthly**: Database size check and optimization

### **Manual Cleanup**
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Manual cleanup
SELECT cleanup_old_events();

-- Check event count
SELECT COUNT(*) FROM events;
```

## 🔧 **Troubleshooting**

### **Common Issues**

1. **"Missing Supabase environment variables"**
   - Check `.env.local` file exists
   - Verify keys are correct

2. **"Backend not responding"**
   - Ensure `node simple-backend-service.js` is running
   - Check localhost:3002 is accessible

3. **"Permission denied"**
   - Verify service role key is correct
   - Check RLS policies in Supabase

4. **"Events not loading"**
   - Check browser console for errors
   - Verify Supabase URL and keys
   - Check database tables have data

### **Useful Commands**

```bash
# Check backend status
curl http://localhost:3002/health

# Check events count
curl http://localhost:3002/api/events | jq '.count'

# Test Supabase connection
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
supabase.from('events').select('count').then(console.log);
"
```

## 🎯 **Success Criteria**

- ✅ **454+ events migrated** to Supabase
- ✅ **Frontend loads events** from database
- ✅ **Venues display correctly** with categories
- ✅ **Custom venue addition** works
- ✅ **No data loss** during migration
- ✅ **Ready for Vercel deployment**

## 🚀 **Next Steps After Migration**

1. **Deploy to Vercel**
2. **Set up automated scraping** (optional)
3. **Add user authentication** (optional)
4. **Monitor database usage**
5. **Optimize performance**

---

**Need help?** Check the troubleshooting section or create an issue in your repository.

**Migration time estimate**: 30-60 minutes
**Deployment time estimate**: 15-30 minutes
**Total time to production**: 1-2 hours
