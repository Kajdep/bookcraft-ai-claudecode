# BookCraft AI - Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Copy `.env.example` to `.env.local`
- [ ] Configure Supabase URL and anon key (optional, for cloud sync)
- [ ] Set `VITE_ENABLE_DEBUG_LOGGING=false` for production
- [ ] Verify all environment variables are set

### 2. Code Quality
- [ ] Run `npm run build` locally to verify build succeeds
- [ ] Check bundle size (should be < 500KB initial load)
- [ ] Test all features in production build (`npm run preview`)
- [ ] Verify no console errors in production mode

### 3. Performance Optimization
- [ ] Images are optimized and compressed
- [ ] Code splitting is working (check Network tab)
- [ ] Lazy loading is implemented for heavy components
- [ ] Service worker is configured (if applicable)

### 4. Security
- [ ] API keys are NOT in the codebase (users configure in-app)
- [ ] Security headers are configured in `vercel.json`
- [ ] HTTPS is enforced
- [ ] Content Security Policy is set (if needed)

### 5. Testing
- [ ] Test autosave functionality
- [ ] Test theme toggle (light/dark mode)
- [ ] Test material upload (small and large files)
- [ ] Test KDP calculator with various inputs
- [ ] Test export to DOCX, PDF, and EPUB
- [ ] Test offline functionality (IndexedDB)
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices

## Vercel Deployment Steps

### Initial Setup
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL` (optional)
   - `VITE_SUPABASE_ANON_KEY` (optional)
   - `VITE_APP_NAME=BookCraft AI`
   - `VITE_APP_VERSION=1.0.0`
   - `VITE_ENABLE_DEBUG_LOGGING=false`

### Build Configuration
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Domain Configuration
1. Add custom domain in Vercel dashboard
2. Configure DNS records
3. Enable automatic HTTPS

## Post-Deployment Verification

### Functional Testing
- [ ] Create a new project
- [ ] Add chapters and write content
- [ ] Verify autosave works (check "Saved" indicator)
- [ ] Toggle theme and verify persistence
- [ ] Upload a material file
- [ ] Use KDP calculator
- [ ] Export manuscript to all formats
- [ ] Test on different devices

### Performance Monitoring
- [ ] Check Lighthouse scores (aim for 90+ on all metrics)
- [ ] Monitor Core Web Vitals:
  - LCP (Largest Contentful Paint) < 2.5s
  - FID (First Input Delay) < 100ms
  - CLS (Cumulative Layout Shift) < 0.1
- [ ] Check bundle size in production
- [ ] Monitor error rates

### User Experience
- [ ] Test user registration and login
- [ ] Verify data persistence across sessions
- [ ] Test offline mode (disconnect internet)
- [ ] Verify cloud sync (if Supabase configured)

## Monitoring & Maintenance

### Error Tracking
- Consider integrating Sentry for production error tracking
- Monitor browser console for errors
- Set up alerts for critical errors

### Analytics (Optional)
- Google Analytics or Plausible for usage tracking
- Track feature usage (exports, materials, etc.)
- Monitor user engagement

### Performance Monitoring
- Vercel Analytics for performance metrics
- Monitor API response times
- Track bundle size over time

## Rollback Plan

If issues occur in production:

1. **Immediate Rollback**
   - Revert to previous deployment in Vercel dashboard
   - Click "Redeploy" on last stable deployment

2. **Data Recovery**
   - Users' data is stored locally in IndexedDB
   - Cloud sync data is in Supabase (if configured)
   - Emergency backups are in localStorage

3. **Communication**
   - Notify users of any issues
   - Provide status updates
   - Document lessons learned

## Scaling Considerations

### Current Architecture
- Static site hosted on Vercel Edge Network
- Client-side processing (no serverless functions)
- IndexedDB for local storage (250MB+ per user)
- Supabase for optional cloud sync

### Future Scaling
- If Supabase free tier is exceeded:
  - Upgrade to Supabase Pro ($25/month)
  - Or migrate to alternative (Firebase, AWS)
- If bundle size grows:
  - Implement more aggressive code splitting
  - Lazy load heavy libraries
  - Consider CDN for large assets

## Support & Troubleshooting

### Common Issues

**Issue: Autosave not working**
- Check browser console for errors
- Verify IndexedDB is enabled
- Check storage quota

**Issue: Export fails**
- Check file size (large manuscripts may timeout)
- Verify browser supports required APIs
- Check console for specific errors

**Issue: Theme not persisting**
- Check localStorage is enabled
- Verify no browser extensions blocking storage

**Issue: Cloud sync not working**
- Verify Supabase credentials
- Check network connectivity
- Review Supabase dashboard for errors

### Getting Help
- Check browser console for errors
- Review application logs
- Contact support with error details

## Security Best Practices

1. **API Keys**
   - Users configure their own API keys in-app
   - Keys are stored in browser localStorage (encrypted)
   - Never commit API keys to repository

2. **Data Privacy**
   - User data stays in their browser (IndexedDB)
   - Optional cloud sync requires user consent
   - No tracking without user permission

3. **Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Test updates in staging first

## Maintenance Schedule

### Weekly
- Monitor error rates
- Check performance metrics
- Review user feedback

### Monthly
- Update dependencies
- Review security advisories
- Optimize bundle size

### Quarterly
- Major feature releases
- Performance audits
- User surveys

---

**Last Updated:** 2024-01-06
**Version:** 1.0.0
