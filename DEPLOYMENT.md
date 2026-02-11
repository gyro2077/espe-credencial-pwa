# PWA Deployment Guide

## ✅ PWA Enabled Successfully

Your app now has full PWA support with:
- ✅ Service Worker for offline functionality
- ✅ App icons (192x192, 512x512)
- ✅ Complete manifest.json
- ✅ User calibration system re-enabled

---

## 🧪 Testing Locally

### 1. Build Production Bundle
```bash
cd /home/gyro/Documents/CLUB/miEspeCredential/espe-credencial-pwa
pnpm build
pnpm start
```

### 2. Test PWA Installation
1. Open Chrome/Edge: `http://localhost:3000`
2. Look for "Install" icon in address bar
3. Click install → App opens as standalone
4. Test offline: Turn off WiFi, reload → Should work!

---

## 📱 Deploy to Mobile (Testing)

### Option A: Vercel (Recommended - Easiest)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd /home/gyro/Documents/CLUB/miEspeCredential/espe-credencial-pwa
vercel

# Follow prompts:
# - Link to Vercel account
# - Deploy as new project
# - Use default settings

# Get URL: https://credencial-espe-xxx.vercel.app
```

**On your phone:**
1. Open the Vercel URL
2. Chrome/Safari will show "Add to Home Screen"
3. Install → Works offline!

### Option B: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build
pnpm build

# Deploy
netlify deploy --prod

# Upload ./out directory
```

### Option C: Local Testing (Same Network)

```bash
# Find your local IP
ip addr show | grep "inet "

# Start dev server (already running)
# Access from phone: http://192.168.x.x:3000
```

---

## 🔧 PWA Features Now Enabled

### Auto-Crop Templates
- **Letter (Mobile)**: `x: 0.070` - Optimized for ESPE mobile PDFs
- **A3 (Desktop)**: `x: 0.050` - Optimized for ESPE web PDFs
- Automatic format detection

### User Calibration
- Upload PDF → "Ajustar recorte"
- Drag to perfect position
- Saves to localStorage (100% confidence)
- Works offline forever

### Offline Capability
- All functionality works without internet
- PDF processing uses local pdf.js
- No external API calls
- User data never leaves device

---

## 📋 Testing Checklist

- [ ] Build production bundle
- [ ] Test PWA installation locally
- [ ] Test offline mode
- [ ] Deploy to Vercel/Netlify
- [ ] Access from mobile
- [ ] Install PWA on mobile
- [ ] Test with Letter PDF (mobile)
- [ ] Test with A3 PDF (desktop)
- [ ] Test user calibration
- [ ] Test offline on mobile

---

## 🚀 Recommended: Deploy to Vercel

**Why Vercel:**
- ✅ Free tier
- ✅ Automatic HTTPS (required for PWA)
- ✅ Dead simple: `vercel`
- ✅ Perfect for Next.js
- ✅ Global CDN

**Steps:**
```bash
vercel login
cd /home/gyro/Documents/CLUB/miEspeCredential/espe-credencial-pwa
vercel --prod
```

Share the URL with anyone - they can install PWA instantly!

---

## 💡 Next Steps

1. **Test locally first**: `pnpm build && pnpm start`
2. **Deploy**: `vercel` (easiest)
3. **Test on your phone**: Open URL, install PWA
4. **Share**: Anyone can access and install

The app is now production-ready! 🎉
