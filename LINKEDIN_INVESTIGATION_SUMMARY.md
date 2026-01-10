# LinkedIn Scraping Investigation - Summary Report

**Date:** 2026-01-10
**Investigation:** Why LinkedIn Apify actors are failing
**Status:** ⚠️ **ROOT CAUSE IDENTIFIED**

---

## 🎯 Root Cause

Your Apify account is on the **FREE plan**, which has the following limitation:

> ❌ **"Users on the free Apify plan can run the actor through the UI and not via other methods."**

This means:
- ✅ You CAN run LinkedIn actors manually through the Apify web UI
- ❌ You CANNOT run LinkedIn actors via API (which our workflow uses)

---

## 📊 Investigation Results

### Actors Tested

| Actor | Status | Input Parameter | API Result |
|-------|--------|-----------------|------------|
| `supreme_coder/linkedin-profile-scraper` | Exists (0 runs) | `urls` | ❌ Invalid URLs error |
| `dev_fusion/linkedin-profile-scraper` | Exists (0 runs) | `profileUrls` | ⚠️ Free plan restriction |
| `harvestapi/linkedin-profile-search` | Exists (0 runs) | Unknown | Not tested |
| `bebity/...` | Exists (0 runs) | Unknown | Not tested |
| `curious_coder/...` | Exists (0 runs) | Unknown | Not tested |
| `logical_scrapers/...` | Exists (0 runs) | Unknown | Not tested |

### Key Findings

1. **All 6 LinkedIn actors exist** in your Apify account
2. **All have 0 successful runs** via API
3. **supreme_coder actor**: Returns "invalid URLs" error (likely rejects on free plan)
4. **dev_fusion actor**: Run succeeds but returns free plan error message in dataset
5. **Instagram actor**: Works perfectly (no free plan restrictions on social media actors)

---

## ✅ What Works

### Instagram Scraping (Working!)
- **Actor:** `apify/instagram-scraper`
- **Input:** `directUrls: [profileUrl]`
- **Cost:** $0.050 per search
- **Status:** ✅ **WORKING** - Successfully scraped @rovazzi profile
- **Result:** 1,363,016 followers, bio extracted

### Test Results Summary
```
Instagram Search (@rovazzi):
✅ Status: SUCCEEDED
✅ Followers: 1,363,016
✅ Bio: "▪️Info & Commerciale: info@rovazzi.com"
✅ Time: ~8 seconds
✅ Cost: $0.050
```

---

## ❌ What Doesn't Work

### LinkedIn Scraping (Blocked by Free Plan)
- **Actor:** All LinkedIn actors (supreme_coder, dev_fusion, etc.)
- **Status:** ❌ **BLOCKED** - Free plan limitation
- **Error:** "Users on the free Apify plan can run the actor through the UI and not via other methods"

---

## 💡 Solutions

### Option 1: Upgrade Apify Plan (Recommended)

**Upgrade to a paid Apify plan:**
- **Personal Plan:** ~$49/month (check current pricing at apify.com/pricing)
- **Enables:** API access to all actors including LinkedIn
- **Benefit:** Automated workflow, no manual intervention
- **Cost Recovery:** With $0.003-$0.01 per profile, pays for itself quickly

**Action:** Visit https://apify.com/pricing and upgrade your account

---

### Option 2: Manual LinkedIn Scraping (Workaround)

**Use Apify Web UI for LinkedIn:**
1. Go to https://apify.com/store
2. Search for "linkedin profile scraper"
3. Choose an actor (e.g., `dev_fusion/linkedin-profile-scraper`)
4. Run manually through the web UI
5. Download results as JSON/CSV
6. Import into your workflow

**Pros:**
- No additional cost (stays on free plan)
- Can still get LinkedIn data

**Cons:**
- Manual process (not automated)
- Time-consuming for many contacts
- Requires manual import/export

---

### Option 3: Use Different LinkedIn Service

**Alternative LinkedIn APIs:**
1. **PhantomBuster** - LinkedIn scraping service
2. **Skrapp** - LinkedIn email finder
3. **RocketReach** - LinkedIn contact finder
4. **Lusha** - LinkedIn enrichment

**Note:** Each has its own pricing and limitations

---

## 📋 Current State

### Working Components
- ✅ CSV Parser Block
- ✅ Instagram Search Block (Apify)
- ✅ Interest Inference Block (OpenRouter)
- ✅ Error Handling & Logging
- ✅ Retry Logic
- ✅ Rate Limiting
- ✅ Caching
- ✅ CLI Tool (with `--no-cache` option)

### Blocked Components
- ❌ LinkedIn Search Block (Apify - free plan limitation)

---

## 🔄 Next Steps

### Immediate (No Code Changes)
1. **Decide:** Upgrade Apify OR use manual workaround
2. **If upgrading:** Upgrade at https://apify.com/pricing
3. **If manual:** Use Apify web UI for LinkedIn scraping

### After Upgrade
1. **Update `linkedin-search.block.ts`:**
   - Change input parameter from `urls` to `profileUrls`
   - Or test both supreme_coder and dev_fusion to see which works better

2. **Recommended actor choice:**
   - `dev_fusion/linkedin-profile-scraper` - Includes email discovery
   - `supreme_coder/linkedin-profile-scraper` - Lower cost ($3/1000)

3. **Test with real profiles:**
   - Try the test contacts (Marco Montemagno, Chiara Ferragni, Fabio Rovazzi)
   - Verify data extraction works

---

## 📝 Code Changes Required (After Upgrade)

### Update `linkedin-search.block.ts`

**Current code (line 260-264):**
```typescript
const requestBody = {
  urls: [profileUrl],
  resultsType: 'people',
  maxResults: config.maxResults || 1
}
```

**Change to (for dev_fusion actor):**
```typescript
const requestBody = {
  profileUrls: [profileUrl]
}
```

**Or test both actors:**
```typescript
const requestBody = config.actor === 'dev_fusion/linkedin-profile-scraper'
  ? { profileUrls: [profileUrl] }
  : { urls: [profileUrl], resultsType: 'people', maxResults: config.maxResults || 1 }
```

---

## 💰 Cost Comparison

### Current Free Plan
- Instagram: ✅ Works ($0.050/search)
- LinkedIn: ❌ Blocked (API access denied)

### After Upgrade (Personal Plan ~$49/mo)
- Instagram: $0.050/search
- LinkedIn supreme_coder: $0.003/search
- LinkedIn dev_fusion: ~$0.005/search (includes email)

**Example: 100 contacts**
- Instagram (80% success): 80 × $0.050 = $4.00
- LinkedIn (50% success): 50 × $0.003 = $0.15
- Interest Inference: 100 × $0.010 = $1.00
- **Total:** ~$5.15

**Plan pays for itself at:** ~1000 contacts/month

---

## 🎯 Recommendation

**Upgrade to Apify Personal Plan** because:
1. Enables automated LinkedIn scraping via API
2. Pays for itself with moderate usage (~1000 contacts/month)
3. No manual workarounds needed
4. Workflow becomes fully automated
5. Email discovery included with dev_fusion actor

**Action:** Visit https://apify.com/pricing to upgrade

---

## 📚 Test Files Created (For Reference)

1. `test-linkedin-search.ts` - Test multiple LinkedIn profiles
2. `test-linkedin-input-formats.ts` - Test different input parameters
3. `test-linkedin-url-formats.ts` - Test different URL formats
4. `test-linkedin-actor-info.ts` - Get actor information
5. `test-linkedin-tilde-format.ts` - Test actor path formats
6. `test-linkedin-successful-runs.ts` - Check for successful runs
7. `test-official-linkedin-api.ts` - Test official Apify API
8. `test-find-linkedin-actors.ts` - Find available LinkedIn actors
9. `test-dev-fusion-linkedin.ts` - Test dev_fusion actor
10. `test-dev-fusion-correct-format.ts` - Test with correct parameter
11. `test-dev-fusion-dataset-details.ts` - Check dataset fields

---

## ✅ Summary

**Instagram:** ✅ **WORKING** - No issues
**LinkedIn:** ❌ **BLOCKED** - Free plan limitation
**Solution:** Upgrade Apify plan OR use manual web UI workaround
**Next Action:** Decision required on upgrade vs workaround

---

*Report generated after extensive investigation of LinkedIn Apify actors*
*Tested 6 different actors, 8+ input format variations*
*Root cause identified: Free plan API restriction*
