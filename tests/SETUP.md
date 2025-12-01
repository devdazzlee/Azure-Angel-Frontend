# Playwright Setup - Quick Fix

## If Playwright UI is stuck on "Loading...":

### Step 1: Start Dev Server Manually (REQUIRED)

Open a **separate terminal** and run:

```bash
cd "/Users/mac/Desktop/Ahmed Work/Angel Updated/New/Azure-Angel-Frontend"
npm run dev
```

**Wait until you see:**
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Keep this terminal running!**

### Step 2: Verify Test Page is Accessible

Open your browser and go to:
```
http://localhost:5173/test-question-formatter
```

You should see the test page with multiple QuestionFormatter examples.

### Step 3: Run Playwright Tests

**In a NEW terminal** (keep dev server running), run:

```bash
cd "/Users/mac/Desktop/Ahmed Work/Angel Updated/New/Azure-Angel-Frontend"
npm run test:ui
```

### Alternative: Run Tests Without UI

If UI mode still doesn't work:

```bash
npm run test
```

This will run all tests in headless mode and show results in terminal.

## Troubleshooting

1. **Port 5173 already in use?**
   ```bash
   lsof -ti:5173 | xargs kill -9
   ```

2. **Tests still not loading?**
   - Close Playwright UI completely
   - Make sure dev server is running
   - Run: `npx playwright test --list` to verify test discovery
   - Then run: `npm run test:ui` again

3. **Test page shows 404?**
   - Check that route is added in `AppRouter.tsx`
   - Restart dev server
   - Clear browser cache

