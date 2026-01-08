# Romance Editor - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Extract & Install (2 minutes)

```bash
# Extract the archive
tar -xzf romance-editor-final.tar.gz
cd romance-editor

# Install dependencies
npm install --legacy-peer-deps
```

### Step 2: Configure (1 minute)

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add ONE of these:
# ANTHROPIC_API_KEY=sk-ant-your-key-here
# OR
# OPENAI_API_KEY=sk-your-key-here

# Set provider
# LLM_PROVIDER=anthropic  (or "openai")
```

### Step 3: Initialize Database (30 seconds)

```bash
# Create database
node scripts/init-db.js

# (Optional) Add demo data
npm run prisma:seed
```

### Step 4: Start Application (1 minute)

```bash
# Terminal 1 - Web Server
npm run dev

# Terminal 2 - Background Worker
npm run worker
```

### Step 5: Open Browser

Visit: **http://localhost:3000**

---

## 📖 First Use Tutorial

### 1. Create Your First Project (1 minute)

1. Click "**New Project**"
2. Enter title: "My Romance Novel"
3. Click "**Create Project**"

### 2. Configure Settings (2 minutes)

You'll be taken to Settings automatically:

- **Subgenre**: Choose your romance type (e.g., "Contemporary")
- **Heat Level**: Select intimacy level (e.g., "Open Door")
- **Tropes**: Check all that apply (e.g., "Enemies-to-lovers")
- **POV Style**: Pick your narrative style (e.g., "Third Limited")
- **Target Tone**: Choose writing style (e.g., "Punchy")

Click "**Save Settings**"

### 3. Upload Manuscript (1 minute)

**Option A - Drag & Drop**:
- Drag your .txt, .md, or .docx file into the upload zone
- Wait for confirmation

**Option B - Paste**:
- Click "**Paste Text**" tab
- Paste your manuscript
- Click "**Upload Manuscript**"

### 4. Run Analysis (5-10 minutes)

1. Click "**Continue to Analysis →**"
2. Click "**Start Analysis**"
3. Watch progress bar (updates every 2 seconds)
4. Wait for completion

**What happens**:
- ✅ Text is split into chunks
- ✅ Structure detected (chapters/scenes)
- ✅ 7 heuristics analyses run
- ✅ AI analyzes content
- ✅ Issues extracted and stored

### 5. Review Issues (5-10 minutes)

**Filter Issues**:
- **Category**: Developmental, Character, Scene, Line, Repetition
- **Severity**: Critical, Major, Minor, Suggestion

**For Each Issue**:
- Read description and evidence
- Review suggestion
- Click "**Generate Rewrite**" if desired

### 6. Generate Rewrites (2-3 minutes per issue)

1. Click "**Generate Rewrite**" on any issue
2. (Optional) Add instructions: "Make it more comedic"
3. Click "**Generate AI Rewrite**"
4. Review diff (side-by-side or inline)
5. Click "**Accept Revision**" or "**Reject**"

### 7. Export Results (1 minute)

1. Go to "**Export**" page
2. Download:
   - **Editorial Letter** - Professional analysis summary
   - **Issues CSV** - Spreadsheet for tracking
   - **Clean Manuscript** - With accepted revisions
   - **Tracked Changes** - See what changed

---

## 🎯 Common Workflows

### Workflow 1: Quick Check (10 minutes)
1. Create project
2. Upload manuscript
3. Run analysis
4. Download editorial letter
5. Review top priorities

### Workflow 2: Deep Edit (1-2 hours)
1. Create project and configure settings
2. Upload manuscript
3. Run analysis
4. Filter by "Critical" severity
5. Generate rewrites for each critical issue
6. Accept/reject as needed
7. Export clean manuscript
8. Repeat for "Major" issues

### Workflow 3: Progress Tracking (Ongoing)
1. Run initial analysis
2. Download issues CSV
3. Open in Excel/Google Sheets
4. Add "Status" and "Notes" columns
5. Track progress manually
6. Re-run analysis after major revisions
7. Compare new issues to original list

---

## 💡 Pro Tips

### For Best Results
- ✅ Configure genre settings accurately
- ✅ Upload clean manuscripts (no formatting codes)
- ✅ Start with critical issues first
- ✅ Use additional instructions for specific guidance
- ✅ Export frequently to avoid data loss

### Common Mistakes to Avoid
- ❌ Not running the worker (analysis won't complete)
- ❌ Ignoring genre settings (affects AI quality)
- ❌ Accepting all rewrites blindly (review each one)
- ❌ Not filtering issues (can be overwhelming)
- ❌ Forgetting to export (no backup if database resets)

### Keyboard Shortcuts
- `Ctrl/Cmd + Click` on issue → Open in new tab
- `Esc` → Close rewrite drawer
- `Tab` → Navigate form fields

---

## 🐛 Troubleshooting Quick Fixes

### "Analysis stuck at 0%"
→ Check Terminal 2 for worker errors
→ Restart worker: `npm run worker`

### "No issues found after analysis"
→ Check filters (may be hiding results)
→ Review worker console for errors

### "Failed to generate rewrite"
→ Check API key in .env
→ Verify internet connection
→ Check API rate limits

### "Upload failed"
→ Verify file format (.txt, .md, .docx)
→ Check file size (<200k words)
→ Try paste method instead

---

## 📊 What to Expect

### Small Manuscript (20k words)
- Analysis: ~2-3 minutes
- Issues found: 20-50
- Critical: 2-5
- Rewrites: ~30 seconds each

### Medium Manuscript (60k words)
- Analysis: ~6-8 minutes
- Issues found: 60-150
- Critical: 5-10
- Rewrites: ~30 seconds each

### Large Manuscript (120k words)
- Analysis: ~12-15 minutes
- Issues found: 120-300
- Critical: 10-20
- Rewrites: ~30 seconds each

---

## 🎓 Next Steps After First Use

1. **Read Editorial Letter** - Provides big-picture guidance
2. **Prioritize Critical Issues** - Start with highest impact
3. **Experiment with Rewrites** - Generate, review, accept/reject
4. **Track Progress** - Use CSV to organize work
5. **Export Regularly** - Back up your work
6. **Re-run Analysis** - After major revisions

---

## 📚 Additional Resources

- **README-FINAL.md** - Complete documentation
- **IMPLEMENTATION_SUMMARY_FINAL.md** - Technical details
- **Tests folder** - Usage examples

---

## 🆘 Need Help?

1. Check **Troubleshooting** section in README
2. Review **Implementation Summaries**
3. Look at test files for examples
4. Check worker console for detailed errors

---

**You're ready to go! 🎉**

Start with the demo seed data to see the app in action, then upload your own manuscript to begin your editorial journey.

Happy writing! ✍️
