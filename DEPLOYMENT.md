# SF Dashboard - Deployment Guide

## 🚀 Quick Deployment Options

### Option 1: Vercel (Recommended - Free)
1. **Push to GitHub**: Upload your project to a GitHub repository
2. **Connect to Vercel**: Go to [vercel.com](https://vercel.com) and connect your GitHub repo
3. **Auto-deploy**: Every push to main branch automatically deploys
4. **Custom domain**: Add your own domain if desired

### Option 2: Netlify (Free)
1. **Build locally**: Run `npm run build`
2. **Drag & Drop**: Go to [netlify.com](https://netlify.com) and drag your `dist` folder
3. **Auto-deploy**: Set up GitHub integration for automatic updates

### Option 3: GitHub Pages (Free)
1. **Build**: Run `npm run build`
2. **Deploy**: Use GitHub Actions to auto-deploy from `dist` folder
3. **Access**: Available at `https://yourusername.github.io/reponame`

### Option 4: Local Production Server
1. **Build**: `npm run build`
2. **Start**: `npm run start` (runs on port 3000)
3. **Access**: Open `http://localhost:3000` in browser

## 🔧 Production Build Commands

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Start production server
npm run start

# Full deployment (build + start)
npm run deploy
```

## 📁 What Gets Deployed

The `dist/` folder contains:
- ✅ Optimized HTML, CSS, and JavaScript
- ✅ Compressed assets for fast loading
- ✅ Production-ready bundle
- ✅ All static assets

## 🌐 Environment Variables

For production, you may want to set:
- `VITE_API_URL`: Your backend API endpoint
- `VITE_SCRAPER_ENABLED`: Enable/disable web scraping

## 🔒 Security Considerations

- Web scraping is limited by CORS policies
- Consider using a backend proxy for scraping
- Rate limiting may be needed for venue websites
- Monitor for changes in venue website structures

## 📱 Performance

- Production build is optimized and compressed
- Assets are cached for better performance
- Responsive design works on all devices
- IndexedDB for local event storage

## 🚨 Troubleshooting

**Build fails:**
- Check TypeScript errors: `npm run lint`
- Verify all dependencies: `npm install`

**Scraping doesn't work:**
- Check browser console for CORS errors
- Venue websites may have changed structure
- Consider using a backend proxy service

**Deployment issues:**
- Ensure `dist/` folder is generated
- Check hosting platform requirements
- Verify build output in browser console
