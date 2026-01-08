# Romance Editor - Complete MVP

An AI-powered manuscript analysis tool for romance novel authors. Upload your manuscript and receive professional editorial feedback, AI-generated rewrites, and actionable improvements.

## 🎉 Complete Feature Set (Steps 1-9)

### ✅ Core Functionality
- **Project Management**: Create unlimited projects with genre-specific settings
- **Manuscript Ingestion**: Upload .txt, .md, .docx files or paste text (up to 200k words)
- **Smart Text Processing**: Automatic chunking and scene/chapter detection
- **Heuristics Analysis**: 7 automated analyses (no API calls required)
- **AI Editorial Analysis**: Genre-aware feedback from OpenAI GPT-4 or Anthropic Claude
- **Rewrite Generation**: AI-powered suggestions with diff viewer
- **Background Processing**: Job queue with real-time progress tracking
- **Export System**: Editorial letter, issues CSV, revised manuscripts

### 📊 Analysis Capabilities

**Local Heuristics (Instant)**:
1. Repeated words and phrases
2. Filter words ("just", "really", "very")
3. Passive voice detection
4. Excessive adverbs
5. Common romance clichés
6. Dialogue tag issues
7. Context extraction for each finding

**AI Editorial Analysis**:
- Developmental feedback (plot, pacing, stakes)
- Character analysis (arcs, motivation, chemistry)
- Scene-level guidance (goals, turning points)
- Line editing (grammar, clarity, style)
- Story bible tracking (characters, relationships, timeline)
- Romance arc progression monitoring

### 🎨 User Interface

**Analysis Page**:
- Start/monitor analysis jobs
- Real-time progress tracking
- Filter by category and severity
- Color-coded severity badges
- Generate AI rewrites for any issue

**Rewrite Drawer**:
- AI-powered rewrite generation
- Side-by-side and inline diff views
- Accept/reject workflow
- Additional instruction input
- Regenerate with new guidance

**Export Page**:
- Editorial letter (Markdown)
- Issues list (CSV)
- Clean revised manuscript
- Tracked changes version

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- API key from OpenAI or Anthropic

### Installation

```bash
# 1. Extract the archive
tar -xzf romance-editor-final.tar.gz
cd romance-editor

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Configure environment
cp .env.example .env
# Edit .env and add your API key

# 4. Initialize database
node scripts/init-db.js

# 5. (Optional) Seed demo data
npm run prisma:seed

# 6. Start the application
npm run dev          # Terminal 1: Web server
npm run worker       # Terminal 2: Job processor

# 7. Open browser
# http://localhost:3000
```

### Environment Configuration

```env
# Choose provider: "openai" or "anthropic"
LLM_PROVIDER=anthropic

# Add at least one API key
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Optional: specify models
ANTHROPIC_MODEL=claude-sonnet-4-20250514
OPENAI_MODEL=gpt-4-turbo-preview
```

## 📖 User Guide

### 1. Create a Project

1. Click "New Project" on homepage
2. Enter a memorable title
3. System creates project with default settings

### 2. Configure Genre Settings

Navigate to **Settings** page and configure:

- **Subgenre**: Contemporary, Historical, Romantic Suspense, Paranormal, Fantasy Romance, YA Romance, or Romcom
- **Heat Level**: Sweet, Closed Door, Open Door, or Explicit
- **Tropes**: Select all that apply (enemies-to-lovers, fake dating, etc.)
- **POV Style**: First person, Third limited, Dual POV, or Multi POV
- **Target Tone**: Lyrical, Punchy, Comedic, or Dark

These settings inform AI analysis and ensure genre-appropriate feedback.

### 3. Upload Manuscript

**Three upload methods**:
- **Drag & Drop**: Drop file into upload zone
- **Browse**: Click to select file from computer
- **Paste**: Switch to "Paste Text" tab and paste content

**Supported formats**: .txt, .md, .docx  
**Size limit**: 200,000 words

### 4. Run Analysis

1. Navigate to **Analysis** page
2. Click "Start Analysis"
3. Monitor progress (updates every 2 seconds)
4. Analysis runs in background (keep worker running)

**Analysis stages**:
- Chunking (0-15%): Split and structure detection
- Heuristics (15-40%): Local pattern analysis
- AI Analysis (40-85%): Genre-aware editorial feedback
- Synthesis (85-100%): Final processing

### 5. Review Issues

**Filter and sort**:
- By category: Developmental, Character, Scene, Line, Repetition
- By severity: Critical, Major, Minor, Suggestion

**Each issue shows**:
- Severity and category badges
- Chapter/scene location
- Description and evidence
- Actionable suggestion
- Accepted revision count

### 6. Generate Rewrites

1. Click "Generate Rewrite" on any issue
2. (Optional) Add additional instructions
3. Click "Generate AI Rewrite"
4. Review in side-by-side or inline diff view
5. Accept, Reject, or Regenerate

**View modes**:
- **Side-by-side**: Original and suggested text in columns
- **Inline**: Changes shown with strikethrough and highlighting

### 7. Export Results

Navigate to **Export** page for:

**Editorial Letter** (.md):
- 2-4 page professional editorial letter
- Analysis summary and priority recommendations
- Genre-specific guidance
- Revision plan with timeline

**Issues CSV**:
- Spreadsheet of all issues
- Category, severity, description, evidence, suggestions
- Opens in Excel/Google Sheets
- Perfect for tracking progress

**Revised Manuscript** (.txt):
- Clean version with accepted revisions applied
- Ready for further editing

**Tracked Changes** (.md):
- Shows revisions with markup
- Original in strikethrough, new in bold
- Review before finalizing

## 🏗️ Architecture

### Project Structure

```
romance-editor/
├── app/                       # Next.js App Router
│   ├── api/                   # API endpoints
│   │   ├── projects/         # CRUD operations
│   │   ├── manuscripts/      # Upload
│   │   ├── analysis/         # Job management
│   │   ├── issues/           # Issue filtering
│   │   ├── revisions/        # Rewrite generation
│   │   └── export/           # File exports
│   ├── projects/[id]/
│   │   ├── page.tsx          # Dashboard
│   │   ├── settings/         # Configuration
│   │   ├── analysis/         # Issue review
│   │   └── export/           # Downloads
│   └── layout.tsx            # Root layout
├── components/
│   ├── manuscript/
│   │   └── UploadZone.tsx   # File upload
│   └── revision/
│       ├── DiffViewer.tsx   # Text comparison
│       └── RewriteDrawer.tsx # Rewrite UI
├── lib/
│   ├── analysis/
│   │   ├── chunker.ts       # Text segmentation
│   │   ├── scene-detector.ts # Structure detection
│   │   ├── heuristics.ts    # Local analysis
│   │   ├── editorial-pipeline.ts # Orchestration
│   │   └── prompts.ts       # AI prompts
│   ├── llm/
│   │   ├── client.ts        # Abstraction layer
│   │   ├── openai-adapter.ts
│   │   └── anthropic-adapter.ts
│   ├── processing/
│   │   ├── text-parser.ts
│   │   └── docx-parser.ts
│   ├── export/
│   │   ├── editorial-letter.ts
│   │   ├── csv-exporter.ts
│   │   └── manuscript-exporter.ts
│   └── jobs/
│       └── queue.ts         # Job management
├── scripts/
│   ├── init-db.js          # Database setup
│   └── worker.ts           # Background worker
├── tests/                   # Test suite
└── prisma/
    └── schema.prisma       # Database schema
```

### Data Flow

```
Upload → Parse → Validate
    ↓
Store Manuscript
    ↓
[Job Created] → Worker picks up
    ↓
Chunk Text → Detect Structure
    ↓
Run Heuristics → Create Issues
    ↓
AI Analysis → Extract Issues → Update Story Bible
    ↓
Store Results
    ↓
User Reviews → Generate Rewrites → Accept/Reject
    ↓
Export Results
```

### Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: SQLite with Prisma ORM
- **AI**: OpenAI GPT-4 / Anthropic Claude (switchable)
- **File Processing**: Mammoth (DOCX), native parsers
- **Background Jobs**: SQLite queue with polling worker
- **Diff**: diff library for text comparison
- **CSV**: csv-stringify for spreadsheet export

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Test Coverage

- ✅ Text parser (parsing, validation, metadata)
- ✅ DOCX parser (extraction, validation)
- ✅ Chunker (splitting, overlap, boundaries)
- ✅ Scene detector (chapters, scenes, POV)
- ✅ Heuristics (all 7 analyses)
- ✅ Manuscript exporter (revisions, tracked changes)
- ✅ Editorial letter generator
- ✅ Integration tests (full pipeline)

### Test Files

```
tests/
├── text-parser.test.ts
├── chunker.test.ts
├── scene-detector.test.ts
├── heuristics.test.ts
├── manuscript-exporter.test.ts
├── editorial-letter.test.ts
└── integration.test.ts
```

## ⚙️ Configuration

### Genre Settings

Settings influence AI analysis and ensure genre-appropriate feedback:

**Subgenres**:
- Contemporary: Modern settings and conflicts
- Historical: Period-appropriate language and constraints
- Romantic Suspense: External danger and trust issues
- Paranormal: Supernatural worldbuilding
- Fantasy Romance: Magic systems and epic stakes
- YA Romance: Age-appropriate emotional maturity
- Romcom: Witty dialogue and comedic situations

**Heat Levels**:
- Sweet: No intimacy beyond kissing
- Closed Door: Romance clear but off-page
- Open Door: Some intimate details
- Explicit: Detailed intimate scenes

**Tropes** (select multiple):
- Enemies-to-lovers
- Friends-to-lovers
- Fake dating
- Second chance
- Forced proximity
- Marriage of convenience
- Opposites attract
- Grumpy-sunshine
- Forbidden love

### Analysis Parameters

**Chunking**:
- Target: 1000 tokens per chunk
- Overlap: 200 tokens
- Boundary: Sentence-aware

**Heuristics**:
- Repeated word window: 100 characters
- Min word length: 4 characters
- Result limits: 5-50 per type

**LLM Sampling** (MVP):
- Analyzes every 3rd chunk for speed
- Production would analyze all chunks

## 📈 Performance

### Typical Analysis Times

**Small Manuscript (20k words)**:
- ~20 chunks
- Heuristics: <30 seconds
- AI analysis: ~2 minutes
- Total: ~2.5 minutes

**Medium Manuscript (60k words)**:
- ~60 chunks
- Heuristics: ~1 minute
- AI analysis: ~5 minutes
- Total: ~6 minutes

**Large Manuscript (120k words)**:
- ~120 chunks
- Heuristics: ~2 minutes
- AI analysis: ~10 minutes
- Total: ~12 minutes

*Times include LLM sampling (every 3rd chunk)*

### Optimization Tips

- Keep worker running for fastest processing
- Use heuristics-only mode for quick checks
- Export regularly to avoid data loss
- Monitor worker console for errors

## 🐛 Troubleshooting

### Analysis Not Starting?

1. Ensure worker is running: `npm run worker`
2. Check API keys in `.env`
3. Monitor worker console for errors
4. Verify network access to API endpoints

### No Issues Found?

1. Analysis may still be running (check progress)
2. Manuscript may be very clean
3. Check filters aren't hiding results
4. Review heuristics vs AI toggle

### Worker Crashes?

1. Check database connection
2. Verify API key is valid
3. Monitor for rate limiting
4. Check available disk space

### Upload Fails?

1. Verify file format (.txt, .md, .docx)
2. Check file size (200k word limit)
3. Ensure valid UTF-8 encoding
4. Try paste method as alternative

## 🔒 Security & Privacy

- All data stored locally in SQLite
- API keys stored in environment variables
- No data sent to third parties (except LLM APIs)
- Manuscripts never logged or cached
- Clean up old jobs automatically (7+ days)

## 🎯 Best Practices

### For Best Results

1. **Configure genre settings accurately** - AI uses these for context
2. **Upload clean manuscripts** - Remove formatting codes first
3. **Review in priority order** - Critical → Major → Minor → Suggestions
4. **Use additional instructions** - Guide AI rewrites with specific requests
5. **Export frequently** - Download editorial letter early for guidance
6. **Track progress with CSV** - Use spreadsheet to organize revisions

### Revision Workflow

1. Download and read editorial letter
2. Address critical structural issues first
3. Work through character and scene issues
4. Polish line-level items last
5. Generate rewrites for specific problems
6. Review tracked changes before accepting
7. Export clean manuscript when ready

## 📚 Additional Resources

### Included Documentation

- `IMPLEMENTATION_SUMMARY.md` - Steps 1-3 details
- `IMPLEMENTATION_SUMMARY_STEPS_4-6.md` - Steps 4-6 details
- This README - Complete guide

### Support

For issues or questions:
1. Check troubleshooting section above
2. Review implementation summaries
3. Check test files for usage examples

## 🎓 Development

### Adding New Heuristics

Edit `lib/analysis/heuristics.ts`:

```typescript
export function findNewPattern(text: string): HeuristicResult {
  // Your analysis logic
  return {
    category: 'line',
    type: 'new-pattern',
    matches: [],
    count: 0,
  };
}
```

Add to `analyzeTextHeuristics()` export array.

### Adding New Export Formats

1. Create exporter in `lib/export/`
2. Add API route in `app/api/export/[id]/`
3. Add download button in export page

### Customizing AI Prompts

Edit `lib/analysis/prompts.ts`:
- `getEditorSystemPrompt()` - Editorial analysis
- `getRewriteSystemPrompt()` - Rewrite generation

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

Built with:
- Next.js (Vercel)
- Anthropic Claude API
- OpenAI GPT-4 API
- Prisma ORM
- Tailwind CSS

---

**Romance Editor v1.0** - Your AI-powered editorial assistant for romance manuscripts.
