# NYT Bestseller-Level Manuscript Editor for Romance Novels

A professional manuscript editing tool that provides NYT bestseller-level editorial feedback for romance novels. Built on proven frameworks (Romancing the Beat, Save the Cat, Wired for Story), current market trends (2026 data), and professional editorial standards (Chicago Guide to Copyediting Fiction).

---

## What This Tool Does

Transform your romance manuscript with professional-grade feedback:

✅ **Character Bible** - Auto-extract characters, track consistency (voice, appearance, backstory), map relationships  
✅ **Inline Manuscript Highlighting** - See exactly what needs editing with sidebar comments explaining WHY  
✅ **NYT Bestseller Analysis** - Developmental edits (structure, pacing, plot holes) + copy edits (grammar, style) + marketability assessment  
✅ **Character Relationship Tracking** - Monitor relationship arcs, emotional beats, chemistry  
✅ **Research-Backed Feedback** - Grounded in Romancing the Beat, Wired for Story, RWA standards, 2026 market trends  

---

## Project Status

### ✅ Phase 0: Foundation Setup (COMPLETE)
- Romance Editor base application installed
- Dependencies installed (390 packages)
- Database initialized (SQLite with Prisma)
- Environment configured (.env with API keys)
- Git repository established

### 📋 Phase 1-6: NYT Bestseller Enhancement (PLANNED)
See **IMPLEMENTATION_PLAN.md** for full details.

**Current State:** Foundation ready, implementation plan complete, research integrated

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm
- Git
- API key (Anthropic Claude or OpenAI GPT)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/lauranguyen546/write.git
   cd write/romance-editor-final
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API key:
   ```
   ANTHROPIC_API_KEY=your_key_here
   LLM_PROVIDER=anthropic
   ```

4. **Initialize database:**
   ```bash
   npx prisma db push
   ```

5. **Start the application:**
   
   **Terminal 1 - Web Server:**
   ```bash
   npm run dev
   ```
   
   **Terminal 2 - Background Worker:**
   ```bash
   npm run worker
   ```

6. **Open browser:**
   ```
   http://localhost:3000
   ```

---

## Current Features (Foundation)

### Manuscript Management
- Upload `.txt`, `.md`, `.docx` files
- Paste text directly
- Drag-and-drop interface
- Word count and reading time

### Project Configuration
- Subgenre selection (Contemporary, Historical, Paranormal, etc.)
- Heat level (Sweet, Closed Door, Open Door, Explicit)
- Tropes (Enemies-to-lovers, Fake dating, etc.)
- POV style and target tone

### Analysis (Basic)
- Text chunking (1000 tokens with overlap)
- Heuristics analysis (repetition, passive voice, clichés)
- LLM analysis (samples 1/3 of manuscript)
- Issue tracking by category and severity

### Revision Workflow
- AI-generated rewrites
- Side-by-side diff viewing
- Accept/reject approval flow
- Modal-based interface

### Export
- Editorial letter (Markdown)
- Issues CSV
- Clean manuscript (with accepted revisions)
- Tracked changes version

---

## Planned Features (Implementation Plan)

### Character Bible
- Auto-extract characters from manuscript
- Track physical traits, personality, voice patterns, backstory
- Visual relationship map (D3 graph)
- Consistency checking (voice shifts, appearance contradictions)
- Character arc analysis

### Inline Manuscript Viewer
- Scrollable text with line numbers
- Color-coded highlights by severity (critical=red, major=orange, minor=yellow, suggestion=blue)
- Sidebar with annotation cards showing:
  - What needs editing
  - **WHY it needs editing** (craft explanation + reader impact)
  - How to fix it
- Click highlights to jump to details
- Filter by category/severity

### NYT Bestseller-Level Analysis

**Developmental Editing:**
- Story structure (3-act, Romancing the Beat validation)
- Pacing analysis (tension escalation, sagging middle detection)
- Plot holes (logical inconsistencies, unresolved threads)
- Character arcs (transformation credibility, arc integration)
- Emotional beats (resonance, variety, cathartic moments)

**Copy Editing:**
- Grammar & mechanics (professional standards)
- Style & clarity (sentence variety, flow, transitions)
- Word choice (precision, weak verbs, clichés)
- Showing vs telling (sensory details, concrete vs abstract)

**Marketability Analysis:**
- Genre alignment (how well it fits romance conventions)
- Comparable titles (3-5 comp titles with positioning)
- Commercial hooks (high-concept, unique elements, series potential)
- Target audience (demographics, cross-genre appeal)
- Strengths/weaknesses (commercial viability assessment)
- Overall commercial score (1-10)

### Character Relationships
- Relationship type tracking (romantic, familial, friendship, rivalry)
- Arc progression monitoring
- Emotional beat detection
- Chemistry analysis

---

## Research Foundation

This editor is grounded in industry-standard frameworks and current market research:

### Romance Structure
- **Romancing the Beat** by Gwen Hayes - 14 romance beats
- **Save the Cat!** - 15-beat story structure
- **RWA Standards** - Genre requirements and conventions

### Narrative Psychology
- **Wired for Story** by Lisa Cron - Brain science + storytelling
- **Story Genius** - Character-driven structure

### Editorial Standards
- **Chicago Guide to Copyediting Fiction** - Professional editing standards
- **Developmental Editing Best Practices** - Structural and content editing

### 2026 Market Trends
- Romance market: $1.5 billion annually
- Romantasy growth: +41.3% (2023-2024)
- BookTok influence: 15% of sales
- Reader expectations: Emotional intelligence, narrative sophistication

**Full research sources:** See `RESEARCH_SOURCES.md`

---

## Documentation

- **IMPLEMENTATION_PLAN.md** - Complete 6-week implementation roadmap (32 new files)
- **RESEARCH_SOURCES.md** - All third-party research, frameworks, and industry standards
- **QUICK-START.md** - User guide for authors (non-developers)
- **README-ORIGINAL.md** - Original foundation README
- **README-FINAL.md** - Original foundation documentation
- **IMPLEMENTATION_SUMMARY_FINAL.md** - Technical implementation details

---

## Implementation Roadmap

**Week 1:** Database & Character Foundation  
**Week 2:** Manuscript Viewer & Annotations  
**Week 3:** Enhanced Analysis Pipeline (+ Research Integration)  
**Week 4:** Character Relationships & Consistency  
**Week 5:** UI Integration & Polish  
**Week 6:** Testing & Optimization  

See **IMPLEMENTATION_PLAN.md** for detailed task breakdown.

---

## Technology Stack

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript 5
- Tailwind CSS
- D3.js (relationship visualization)
- Recharts (analytics charts)

### Backend
- Next.js API Routes
- Prisma ORM
- SQLite database

### AI
- Anthropic Claude (default: claude-sonnet-4-20250514)
- OpenAI GPT (configurable alternative)
- Abstraction layer supports both providers

### File Processing
- Mammoth (DOCX parsing)
- Native parsers (TXT/MD)

---

## Database Schema

**Current (Foundation):**
- Project, Manuscript, Chunk, Issue, Revision, Job

**Planned Additions:**
- Character (profiles with traits, voice, backstory)
- CharacterRelationship (connections, arc progression)
- CharacterMention (all character appearances tracked)
- CharacterConsistencyIssue (voice/appearance/backstory conflicts)
- Annotation (inline highlights with WHY reasoning)
- MarketabilityAnalysis (commercial viability assessment)

---

## Cost Estimates

### Foundation Analysis (Current)
- Samples 1/3 of manuscript
- ~$0.50-$1.00 per 50k word manuscript

### Bestseller-Level Analysis (Planned)
- Full manuscript analysis
- Character extraction + consistency checking
- Developmental + copy editing + marketability
- ~$3-$5 per 50k word manuscript

**Cost optimization:**
- Caching (don't re-analyze unchanged chunks)
- Smart batching (rate limit management)
- Tiered analysis levels (Quick/Standard/Professional/Bestseller)

---

## Project Structure

```
romance-editor-final/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   ├── projects/[id]/        # Project pages
│   │   ├── settings/         # Genre settings & upload
│   │   ├── analysis/         # Issues view
│   │   ├── characters/       # Character Bible (planned)
│   │   ├── manuscript/       # Inline viewer (planned)
│   │   ├── marketability/    # Commercial analysis (planned)
│   │   └── export/           # Export functionality
│   └── page.tsx              # Landing page
├── components/               # React components
│   ├── character/            # Character Bible UI (planned)
│   ├── manuscript/           # Viewer components (planned)
│   └── revision/             # Rewrite drawer & diff viewer
├── lib/                      # Core libraries
│   ├── analysis/             # Editorial pipeline & analyzers
│   ├── character/            # Character extraction (planned)
│   ├── annotations/          # Annotation generation (planned)
│   ├── llm/                  # LLM client abstraction
│   ├── processing/           # File parsers
│   ├── export/               # Export generators
│   └── jobs/                 # Background job queue
├── prisma/                   # Database
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Sample data
├── scripts/
│   ├── init-db.js            # Database initialization
│   └── worker.ts             # Background job processor
├── types/                    # TypeScript types
├── tests/                    # Unit & integration tests
├── IMPLEMENTATION_PLAN.md    # 6-week roadmap
├── RESEARCH_SOURCES.md       # Research bibliography
└── .env.example              # Environment template
```

---

## Development Workflow

### Running Tests
```bash
npm test
```

### Database Management
```bash
# View database in Prisma Studio
npx prisma studio

# Reset database
rm prisma/dev.db
npx prisma db push
```

### Adding Dependencies
```bash
npm install <package-name>
```

### Creating Migrations
```bash
npx prisma migrate dev --name <migration_name>
npx prisma generate
```

---

## Contributing

This project is under active development. The implementation plan in **IMPLEMENTATION_PLAN.md** provides a detailed roadmap.

**Current Phase:** Foundation complete, ready for Phase 1 implementation

---

## Use Case: Editing "Silk Hearts"

This editor is being built specifically to provide NYT bestseller-level feedback for the romance novel "Silk Hearts."

**Target capabilities:**
- Character consistency tracking for complex character ensemble
- Relationship arc validation against Romancing the Beat structure
- Marketability assessment for contemporary romance market
- Inline editing workflow for efficient revision process
- Commercial viability scoring against 2026 market trends

---

## Support & Resources

### Getting Help
- Check **QUICK-START.md** for user guide
- Review **IMPLEMENTATION_PLAN.md** for technical details
- See **RESEARCH_SOURCES.md** for craft resources

### API Keys
- **Anthropic:** https://console.anthropic.com/
- **OpenAI:** https://platform.openai.com/api-keys

### Recommended Reading
- Romancing the Beat by Gwen Hayes
- Wired for Story by Lisa Cron
- The Chicago Guide to Copyediting Fiction by Amy J. Schneider

---

## License

MIT

---

## Acknowledgments

Built on research from:
- Gwen Hayes (Romancing the Beat)
- Lisa Cron (Wired for Story, Story Genius)
- Amy J. Schneider (Chicago Guide to Copyediting Fiction)
- Romance Writers of America
- 2026 market trend analysts and publishing industry experts

---

**Current Version:** Foundation (Phase 0)  
**Next Milestone:** Character Bible System (Week 1)  
**Repository:** https://github.com/lauranguyen546/write  
**Branch:** claude/setup-romance-editor-xT3g8
