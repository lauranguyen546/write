# NYT Bestseller-Level Manuscript Editor Implementation Plan

## Context

Transform the existing Romance Editor into a professional NYT bestseller-level manuscript editor for "Silk Hearts" with:
- **Character Bible** with consistency checking (voice, relations, backstories)
- **Inline manuscript highlighting** with sidebar comments explaining WHY edits are needed
- **NYT bestseller editorial perspective**: developmental edits (structure, pacing, plot holes, character arcs) + copy edits (grammar, style, flow) + marketability analysis
- **Character relationship tracking** to build strong, consistent story
- **User makes edits themselves** after reviewing highlighted suggestions

**Current Foundation:**
The Romance Editor already has manuscript upload, chunking, LLM analysis (samples 1/3 chunks), issue tracking, modal-based revision workflow, and basic exports. The StoryBible and ArcTracker types exist but are unused. We'll build on this foundation.

---

## Research Foundation & Editorial Standards

To ensure NYT bestseller-level feedback, the editor will integrate proven frameworks and current market research:

### 1. Romance Structure & Beat Sheets

**Romancing the Beat by Gwen Hayes** - #1 romance structure guide
- 14 specific romance beats mapped to Save the Cat structure
- Endorsed by NYT/USA Today bestsellers Tessa Dare and Celia Kyle
- Validates: meet-cute, relationship development, black moment, HEA positioning

**Save the Cat! Writes a Novel** - Foundation story structure  
- 15-beat structure with 3 acts
- Dynamic character arc framework
- Universal story principles

**Implementation:** Create `/lib/analysis/editorial-standards.ts` with beat sheet checklists to validate story structure

### 2. Narrative Psychology & Emotional Resonance

**Wired for Story by Lisa Cron** - Brain science + storytelling
- Emotions engage brain faster than plot
- Personal impact drives story meaning (not just dramatic events)
- Triggers dopamine rush keeping readers engaged
- Lisa Cron: UCLA instructor, story consultant for Warner Brothers/William Morris

**Story Genius by Lisa Cron** - Character-driven structure principles

**Implementation:** Create `/lib/analysis/emotional-framework.ts` with Wired for Story evaluation criteria (protagonist goals, personal stakes, curiosity triggers)

### 3. Genre Conventions & Reader Expectations

**Romance Writers of America (RWA) Standards**
- Two core requirements: (1) central love story, (2) emotionally satisfying HEA/HFN
- Standard word count: 50-90K words
- Internal protagonist goal must be connection

**Romance Beat Sheet Bible** - 20 beats, 12 tropes, romantasy architecture

**Implementation:** Validate manuscripts meet RWA requirements, check trope execution quality

### 4. 2026 Market Trends & Commercial Viability

**Current Market Data:**
- Romance generates $1.5 billion annually (50% of mass-market paperbacks)
- **Romantasy dominance**: Fantasy romance sales up 41.3% (2023-2024)
- BookTok influences 15% of romance sales
- **Reader expectations**: Emotional intelligence, narrative sophistication, human authenticity
- **Hot subgenres**: Romantasy, dark romance, contemporary rom-com, clean romance

**Reader Preferences 2026:**
- Emotional stakes must be earned, not exaggerated
- Fluid movement between contemporary, historical, speculative
- Active anti-AI sentiment (readers seek human authorship)

**Implementation:** Create `/lib/analysis/market-data-2026.ts` with current trends for marketability analysis comp title suggestions

### 5. Professional Editorial Standards

**The Chicago Guide to Copyediting Fiction by Amy J. Schneider**
- First fiction-specific guide from University of Chicago Press
- Covers dialogue, voice, grammar, conscious language
- Fiction continuity: tracking character/place/event consistency

**Developmental Editing Best Practices**
- Romance-specific: meet-cute authenticity, emotional arc supporting romantic tension, black moment threat
- Relationship progression tracking, tension escalation
- Conflict must be relationship-based

**Implementation:** Reference Chicago Guide standards in copy editing prompts, use developmental best practices for structure analysis

### Research Integration Points

**Create 3 new reference files:**

1. **`/lib/analysis/editorial-standards.ts`**
```typescript
export const ROMANCE_BEAT_CHECKLIST = {
  beats: [
    { name: 'Meet-Cute', position: '10-15%', required: true },
    { name: 'First Kiss', position: '30-40%', required: false },
    { name: 'Midpoint Commitment', position: '50%', required: true },
    { name: 'Black Moment', position: '75-80%', required: true },
    { name: 'Grand Gesture', position: '85-90%', required: true },
    { name: 'HEA Established', position: '95-100%', required: true }
  ]
};

export const RWA_STANDARDS = {
  wordCount: { min: 50000, max: 90000 },
  coreRequirements: [
    'Central love story (not subplot)',
    'Emotionally satisfying ending (HEA or HFN)',
    'Protagonist internal goal = connection'
  ]
};
```

2. **`/lib/analysis/emotional-framework.ts`**
```typescript
// Wired for Story: Lisa Cron's key questions
export const EMOTIONAL_RESONANCE_CHECKS = {
  perSceneQuestions: [
    'What does protagonist want in this scene?',
    'What internal need drives this want?',
    'Why does this matter to THEM personally?',
    'What changes by scene end?',
    'What makes reader curious about next scene?'
  ]
};
```

3. **`/lib/analysis/market-data-2026.ts`**
```typescript
export const MARKET_TRENDS_2026 = {
  hotSubgenres: ['romantasy', 'dark-romance', 'contemporary-romcom', 'clean-romance'],
  marketSize: '$1.5 billion annually',
  bookTokInfluence: '15% of sales',
  readerExpectations: [
    'emotional intelligence',
    'narrative sophistication', 
    'human authenticity (anti-AI)',
    'earned emotional stakes'
  ],
  romanticFantasyGrowth: '41.3% (2023-2024)'
};
```

**Update prompts to reference research:**
- `/lib/analysis/prompts-developmental.ts` - Add Romancing the Beat + Save the Cat beat structures
- `/lib/analysis/prompts-marketability.ts` - Reference 2026 market trends and reader preferences
- `/lib/analysis/prompts.ts` - Enhance editor system prompt with Wired for Story principles

**Expected Impact:**
- ✅ Structure analysis validates against proven beat sheets
- ✅ Emotional resonance evaluated using neuroscience-backed principles
- ✅ Marketability assessed against real 2026 market data
- ✅ Genre compliance checked against RWA standards
- ✅ Copy editing follows Chicago Guide fiction standards
- ✅ Transforms from "generic AI feedback" to "industry-standard professional editorial analysis"

---

## Database Schema Changes

**File:** `/home/user/write/romance-editor-final/prisma/schema.prisma`

Add 6 new models and update 4 existing models:

### New Models

1. **Character** - Store character profiles with physical traits, personality, voice patterns, backstory, arc
2. **CharacterRelationship** - Track relationships between characters (type, arc progression, emotional beats)
3. **CharacterMention** - Every mention of a character in the manuscript with position and context
4. **CharacterConsistencyIssue** - Track voice shifts, appearance contradictions, backstory conflicts, behavior inconsistencies
5. **Annotation** - Inline highlights tied to manuscript positions with comments, reasoning (WHY), and suggestions
6. **MarketabilityAnalysis** - Commercial viability assessment with genre alignment, comp titles, market hooks, strengths/weaknesses, recommendations

### Updated Models

- **Project** - Add relations: `characters`, `annotations`, `marketabilityAnalysis`
- **Manuscript** - Add relation: `annotations`
- **Chunk** - Add relation: `characterMentions`
- **Issue** - Add relation: `annotations`

**Migration Steps:**
```bash
npx prisma migrate dev --name add_character_bible_and_annotations
npx prisma generate
```

---

## Phase 1: Character Bible System

### Character Extraction & Auto-Population

**Create:** `/home/user/write/romance-editor-final/lib/character/extractor.ts`

- `extractCharactersFromManuscript()` - Analyze chunks with LLM to identify characters, physical traits, personality, voice patterns
- `buildCharacterExtractionPrompt()` - Prompt engineering for character detection
- Track all character mentions with precise positions and context type (description, dialogue, action, internal-thought)
- Merge character data across chunks to build complete profiles
- Save to Character model with all mentions tracked

### Character Consistency Checker

**Create:** `/home/user/write/romance-editor-final/lib/character/consistency-checker.ts`

- `checkCharacterConsistency()` - Compare all mentions of a character for:
  - Physical description contradictions (eye color changes, height inconsistencies)
  - Voice pattern shifts (dialogue style changes, vocabulary inconsistencies)
  - Backstory conflicts (contradictory history references)
  - Behavioral inconsistencies (out-of-character actions)
- Use LLM to analyze voice consistency in dialogue
- Flag issues with severity (critical/major/minor) and save to CharacterConsistencyIssue table
- Store side-by-side evidence for review

### Character Relationship Tracker

**Create:** `/home/user/write/romance-editor-final/lib/character/relationship-tracker.ts`

- `extractRelationships()` - Identify character interactions and relationship types (romantic, familial, friendship, rivalry, professional)
- `analyzeRelationshipArc()` - Track relationship progression through story, detect arc beats, flag missing beats or inconsistencies
- Save to CharacterRelationship model with arc progression and emotional beats

### Character Bible UI

**Create 4 components:**

1. **`/components/character/CharacterBible.tsx`** - Character grid with cards, search, filter by role, "Auto-Extract" and "Add Character" buttons
2. **`/components/character/CharacterEditor.tsx`** - Modal form for editing character name, role, physical traits (structured fields), personality tags, voice patterns, backstory, arc
3. **`/components/character/RelationshipMap.tsx`** - Visual D3 graph showing character nodes connected by relationship edges, colored by type
4. **`/components/character/ConsistencyChecker.tsx`** - List consistency issues by character with side-by-side evidence comparison and "Mark as Resolved" button

### Character Bible API

**Create 6 API routes:**

- `GET/POST /api/characters` - List all characters, create new character
- `GET/PUT/DELETE /api/characters/[id]` - Character CRUD
- `POST /api/characters/extract` - Auto-extract characters from manuscript
- `POST/GET /api/characters/consistency` - Run consistency check, get issues
- `GET/POST /api/relationships` - List relationships, create relationship
- `GET/PUT/DELETE /api/relationships/[id]` - Relationship CRUD

### Character Bible Page

**Create:** `/home/user/write/romance-editor-final/app/projects/[id]/characters/page.tsx`

Two-column layout: Character Bible (left 2/3) + Relationship Map and Consistency Checker (right 1/3)

---

## Phase 2: Inline Manuscript Viewer with Highlighting

### Annotation Generation

**Create:** `/home/user/write/romance-editor-final/lib/annotations/generator.ts`

- `generateAnnotationsFromIssues()` - Convert Issues to Annotations with precise manuscript positions
- `calculateManuscriptPosition()` - Convert chunk-relative positions to manuscript-absolute positions
- Handle overlapping annotations gracefully
- Store comment (WHAT needs fixing), reasoning (WHY it matters - craft explanation), and suggestion (HOW to fix)

### Manuscript Viewer Components

**Create 3 components:**

1. **`/components/manuscript/ManuscriptViewer.tsx`** - Split view with scrollable manuscript text (left) + AnnotationSidebar (right)
   - Line numbers
   - Color-coded highlights by severity (critical=red, major=orange, minor=yellow, suggestion=blue)
   - Click highlight to select and show in sidebar
   - Filters for category/severity
   - Chapter navigation

2. **`/components/manuscript/HighlightedText.tsx`** - Render text with inline highlights
   - Split text into segments based on annotation boundaries
   - Handle overlapping annotations (nested/stacked styling)
   - Tooltip on hover with brief comment
   - Click handler to select annotation

3. **`/components/manuscript/AnnotationSidebar.tsx`** - Scrollable list of annotation cards
   - Each card shows: severity badge, category badge, highlighted excerpt, comment, reasoning (WHY), suggestion, "Generate Rewrite" button, "Jump to location" button
   - When annotation selected: scroll to it, highlight it
   - Statistics: total annotations by severity/category

### Manuscript Viewer Page

**Create:** `/home/user/write/romance-editor-final/app/projects/[id]/manuscript/page.tsx`

Full-page viewer with ManuscriptViewer component, "Regenerate Annotations" button

### Annotation API

**Create 3 API routes:**

- `GET/POST /api/annotations` - List annotations, create manually
- `POST /api/annotations/generate` - Generate annotations from issues
- `GET/PUT/DELETE /api/annotations/[id]` - Annotation CRUD

### Modal Integration

Connect AnnotationSidebar "Generate Rewrite" button to existing RewriteDrawer component at `/components/revision/RewriteDrawer.tsx` - preserve current modal workflow, no changes to RewriteDrawer needed.

---

## Phase 3: Enhanced Analysis Pipeline - NYT Bestseller Level

### Full Manuscript Analysis

**Update:** `/home/user/write/romance-editor-final/lib/analysis/editorial-pipeline.ts`

**Line 162:** Change from sampling (1/3 chunks) to analyzing ALL chunks:
```typescript
// OLD: const chunksToAnalyze = chunksWithStructure.filter((_, i) => i % 3 === 0);
// NEW: const chunksToAnalyze = chunksWithStructure; // Analyze everything
```

Add stages to pipeline:
- **Stage 3.5**: Character extraction (`extractCharactersFromManuscript()`)
- **Stage 3.6**: Developmental analysis (`analyzeDevelopmental()`)
- **Stage 3.7**: Character consistency check (`checkAllCharactersConsistency()`)
- **Stage 3.8**: Marketability analysis (`analyzeMarketability()`)
- **Stage 3.9**: Generate annotations (`generateAnnotationsFromIssues()`)

### Developmental Analysis

**Create:** `/home/user/write/romance-editor-final/lib/analysis/developmental-analyzer.ts`

- `analyzeDevelopmental()` - Full manuscript analysis for:
  1. **Story Structure**: Three-act adherence, inciting incident, midpoint, climax, resolution, genre-specific romance beats
  2. **Pacing**: Scene/sequel balance, tension escalation, sagging middle, info dumps
  3. **Plot Holes**: Logical inconsistencies, unresolved threads, deus ex machina, timeline issues
  4. **Character Arcs**: Protagonist arc completeness, supporting development, transformation credibility
  5. **Emotional Beats**: Resonance points, reader connection, emotional variety, cathartic moments

**Create:** `/home/user/write/romance-editor-final/lib/analysis/prompts-developmental.ts`

Prompts for:
- `getStoryStructurePrompt()` - Identify three-act structure and romance beats
- `getPacingAnalysisPrompt()` - Find slow/rushed sections
- `getPlotHolePrompt()` - Detect logical inconsistencies
- `getEmotionalBeatsPrompt()` - Evaluate emotional impact

### Copy Editing Analysis

**Create:** `/home/user/write/romance-editor-final/lib/analysis/copy-editor.ts`

- `analyzeCopyEditing()` - Professional copy editing per chunk:
  1. **Grammar & Mechanics**: Subject-verb agreement, pronouns, modifiers, punctuation, tense
  2. **Style & Clarity**: Sentence variety, paragraph flow, transitions, ambiguity
  3. **Word Choice**: Precision, appropriate vocabulary, clichés, redundancy, weak verbs
  4. **Showing vs Telling**: Abstract vs concrete, sensory details, emotion showing

### Marketability Analysis

**Create:** `/home/user/write/romance-editor-final/lib/analysis/marketability.ts`

- `analyzeMarketability()` - Commercial viability assessment:
  1. **Genre Alignment**: How well it fits genre expectations, conventions satisfied, unique differentiation
  2. **Comparable Titles**: 3-5 comp titles, market positioning, gap vs saturation
  3. **Commercial Hooks**: High-concept premise, character dynamics, unique elements, series potential
  4. **Target Audience**: Demographics, cross-genre appeal
  5. **Strengths**: What makes readers buy (emotional resonance, chemistry, arc satisfaction)
  6. **Weaknesses**: Pacing issues, niche elements, insufficient stakes, predictability
  7. **Recommendations**: How to strengthen commercial appeal, marketing angles, positioning advice
- Return 1-10 overall score, save to MarketabilityAnalysis table

**Create:** `/home/user/write/romance-editor-final/lib/analysis/prompts-marketability.ts`

`getMarketabilityPrompt()` - Detailed prompt asking LLM to act as literary agent and publishing expert to assess commercial viability

### Enhanced Editor Prompt

**Update:** `/home/user/write/romance-editor-final/lib/analysis/prompts.ts`

Enhance `getEditorSystemPrompt()` to include NYT bestseller standards:
- Commercial hooks that pitch in one sentence
- Tight three-act structure with clear turning points
- Properly paced with escalating tension
- Deep emotional beats that resonate
- Craft excellence (showing vs telling, sensory grounding, varied structure)
- Add "marketability" to issue categories
- Add `reasoning` field requirement (WHY this matters for bestseller potential and reader experience)

---

## Phase 4: Marketability Report UI

**Create:** `/home/user/write/romance-editor-final/app/projects/[id]/marketability/page.tsx`

Display:
- Overall commercial viability score (1-10) with visual chart
- Genre alignment section with score
- Comparable titles list with positioning notes
- Commercial hooks (bullet list)
- Two-column: Strengths panel (left) + Weaknesses panel (right)
- Recommendations list with actionable steps

**Add dependency:** `recharts` for score visualization charts

---

## Phase 5: UI Integration & Navigation

### Update Project Dashboard

**Update:** `/home/user/write/romance-editor-final/app/projects/[id]/page.tsx`

Add navigation cards for:
- Character Bible
- Manuscript Viewer (inline highlights)
- Marketability Report

### Enhance Analysis Page

**Update:** `/home/user/write/romance-editor-final/app/projects/[id]/analysis/page.tsx`

Add:
- "Marketability" category filter
- "View in Manuscript" button on each issue (jumps to ManuscriptViewer with highlight active)
- Character consistency issues section
- Link to Character Bible page

---

## Phase 6: Cost Optimization

### Caching Layer

**Create:** `/home/user/write/romance-editor-final/lib/analysis/cache.ts`

- `getChunkHash()` - MD5 hash of chunk text
- `isChunkAnalyzed()` - Check if chunk with this hash already analyzed (stored in Chunk.summaryJson)
- `markChunkAnalyzed()` - Mark chunk as analyzed with hash and timestamp
- Skip re-analyzing unchanged chunks on re-run

### Smart Batching

**Update:** `/home/user/write/romance-editor-final/lib/analysis/editorial-pipeline.ts`

- Process chunks in batches of 5 with 2-second delay between batches
- Implement exponential backoff for rate limit errors
- Track cost per analysis run

### Optional: Tiered Analysis Levels

Add analysis level selection (quick/standard/professional/bestseller) to control depth and cost:
- Quick: Heuristics + 10% LLM sampling (~$1)
- Standard: Current 1/3 sampling (~$1.50)
- Professional: 50% sampling + developmental (~$3)
- Bestseller: Full analysis (~$5)

**Update:** `/home/user/write/romance-editor-final/app/api/analysis/start/route.ts` to accept `analysisLevel` parameter

---

## Phase 7: New Dependencies

**Add to package.json:**
```json
{
  "dependencies": {
    "d3": "^7.8.5",
    "@types/d3": "^7.4.0",
    "react-markdown": "^9.0.0",
    "recharts": "^2.10.0"
  }
}
```

Install: `npm install`

---

## Critical Files to Modify/Create

### Modify (7 files):
1. `/home/user/write/romance-editor-final/prisma/schema.prisma` - Add 6 new models, update 4 existing
2. `/home/user/write/romance-editor-final/lib/analysis/editorial-pipeline.ts` - Full analysis, add 5 new stages
3. `/home/user/write/romance-editor-final/lib/analysis/prompts.ts` - Enhance to NYT bestseller level
4. `/home/user/write/romance-editor-final/app/projects/[id]/page.tsx` - Add navigation cards
5. `/home/user/write/romance-editor-final/app/projects/[id]/analysis/page.tsx` - Add marketability filter, "View in Manuscript" button
6. `/home/user/write/romance-editor-final/app/api/analysis/start/route.ts` - Optional: add analysis level parameter
7. `/home/user/write/romance-editor-final/package.json` - Add dependencies

### Create (32 new files):

**Character System (8 files):**
1. `/lib/character/extractor.ts`
2. `/lib/character/consistency-checker.ts`
3. `/lib/character/relationship-tracker.ts`
4. `/components/character/CharacterBible.tsx`
5. `/components/character/CharacterEditor.tsx`
6. `/components/character/RelationshipMap.tsx`
7. `/components/character/ConsistencyChecker.tsx`
8. `/app/projects/[id]/characters/page.tsx`

**Character API (6 routes):**
9. `/app/api/characters/route.ts`
10. `/app/api/characters/[id]/route.ts`
11. `/app/api/characters/extract/route.ts`
12. `/app/api/characters/consistency/route.ts`
13. `/app/api/relationships/route.ts`
14. `/app/api/relationships/[id]/route.ts`

**Manuscript Viewer (5 files):**
15. `/lib/annotations/generator.ts`
16. `/components/manuscript/ManuscriptViewer.tsx`
17. `/components/manuscript/HighlightedText.tsx`
18. `/components/manuscript/AnnotationSidebar.tsx`
19. `/app/projects/[id]/manuscript/page.tsx`

**Annotation API (3 routes):**
20. `/app/api/annotations/route.ts`
21. `/app/api/annotations/generate/route.ts`
22. `/app/api/annotations/[id]/route.ts`

**Research Reference Files (3 files):**
23. `/lib/analysis/editorial-standards.ts` - Romancing the Beat + Save the Cat beat sheets, RWA standards
24. `/lib/analysis/emotional-framework.ts` - Wired for Story evaluation criteria
25. `/lib/analysis/market-data-2026.ts` - Current trends, reader preferences, bestseller data

**Enhanced Analysis (5 files):**
26. `/lib/analysis/developmental-analyzer.ts`
27. `/lib/analysis/prompts-developmental.ts`
28. `/lib/analysis/copy-editor.ts`
29. `/lib/analysis/marketability.ts`
30. `/lib/analysis/prompts-marketability.ts`

**Optimization (1 file):**
31. `/lib/analysis/cache.ts`

**Marketability UI (1 file):**
32. `/app/projects/[id]/marketability/page.tsx`

---

## Implementation Sequence

**Week 1: Database & Character Foundation**
1. Add new database models to schema.prisma
2. Run migration and generate Prisma client
3. Create character extraction logic
4. Build character API routes
5. Create Character Bible UI components
6. Test character extraction end-to-end

**Week 2: Manuscript Viewer & Annotations**
1. Build annotation generator
2. Create HighlightedText component
3. Build AnnotationSidebar component
4. Create ManuscriptViewer page
5. Implement annotation API routes
6. Test inline highlighting workflow

**Week 3: Enhanced Analysis Pipeline**
1. **Create research reference files**: editorial-standards.ts, emotional-framework.ts, market-data-2026.ts
2. Update editorial-pipeline to analyze all chunks
3. Build developmental analyzer with prompts (integrate Romancing the Beat + Save the Cat)
4. Create copy editing analyzer (Chicago Guide standards)
5. Implement marketability analyzer with prompts (integrate 2026 market trends)
6. Add caching and batching
7. Test full pipeline with real manuscript

**Week 4: Character Relationships & Consistency**
1. Build relationship tracker
2. Implement consistency checker
3. Create RelationshipMap component (D3)
4. Build ConsistencyChecker component
5. Test character analysis features

**Week 5: UI Integration & Polish**
1. Create marketability report page
2. Update project dashboard navigation
3. Enhance analysis page with new filters
4. Add character bible page to nav
5. Integrate modal workflows (AnnotationSidebar → RewriteDrawer)
6. Polish UI/UX, responsive design

**Week 6: Testing & Optimization**
1. Test with "Silk Hearts" manuscript
2. Verify character consistency detection works
3. Check inline highlights render correctly
4. Validate marketability analysis accuracy
5. Optimize performance (caching, batching)
6. Document usage in README

---

## Verification Approach

### End-to-End Test Flow

1. **Upload Manuscript**
   - Upload "Silk Hearts" .md file
   - Verify text stored correctly

2. **Run Full Analysis**
   - Start analysis with "bestseller" level
   - Monitor progress through all stages
   - Verify completion within 10 minutes (50k words target)

3. **Character Bible**
   - Check characters auto-extracted
   - Verify character profiles populated (physical traits, personality, voice)
   - Review relationship map shows connections
   - Run consistency check
   - Verify consistency issues found (voice shifts, appearance contradictions)

4. **Manuscript Viewer**
   - Open manuscript viewer
   - Check text displays with line numbers
   - Verify highlights appear color-coded by severity
   - Click highlight, check sidebar shows annotation
   - Verify comment includes WHY reasoning
   - Test filters (category, severity)

5. **Analysis Quality**
   - Review developmental issues (structure, pacing, plot holes)
   - Check character arc issues identified
   - Verify copy editing issues found
   - Review marketability report

6. **Marketability Report**
   - Check overall score displayed (1-10)
   - Verify genre alignment assessed
   - Check comp titles listed
   - Review commercial hooks identified
   - Verify strengths/weaknesses shown
   - Check recommendations actionable

7. **Approval Workflow**
   - Click "Generate Rewrite" from sidebar annotation
   - Verify RewriteDrawer modal opens
   - Generate rewrite with additional guidance
   - Review diff (side-by-side or inline)
   - Accept revision
   - Verify status updated

8. **Export**
   - Export editorial letter (verify marketability section included)
   - Export issues CSV (verify all categories present)
   - Export clean manuscript (verify accepted revisions applied)

### Success Criteria

- ✅ Character Bible auto-populates with >90% accuracy
- ✅ Consistency checker detects voice/appearance/backstory issues
- ✅ Inline highlights render without performance lag
- ✅ All annotations include WHY reasoning (craft explanation)
- ✅ Developmental analysis identifies structure problems
- ✅ Marketability analysis provides actionable commercial insights
- ✅ Full analysis completes in <10 minutes for 50k words
- ✅ Cost per bestseller-level analysis <$5
- ✅ Modal workflow preserved and enhanced
- ✅ Export includes all new data

---

## Estimated Cost

**Per 50k word manuscript (bestseller-level analysis):**
- ~100 chunks analyzed (full coverage)
- ~100 chunk LLM calls
- ~1 developmental analysis (full manuscript)
- ~1 character extraction pass
- ~1 marketability analysis
- ~10-20 character consistency checks
- **Total: ~$3-5 per analysis**

**Cost optimization:**
- Caching prevents re-analyzing unchanged chunks
- Smart batching reduces rate limit issues
- Optional tiered levels let users control cost
- Incremental analysis on re-run (only analyze new/changed sections)

---

This plan transforms the Romance Editor into a professional NYT bestseller-level manuscript editor for "Silk Hearts" with Character Bible, inline highlighting with WHY explanations, comprehensive developmental + copy editing + marketability analysis, and character relationship tracking—all while preserving the modal-based workflow and keeping costs reasonable through caching and smart batching.

---

## Research Sources & References

The editorial analysis is grounded in industry-standard frameworks and current market research:

### Romance Craft & Structure
- **Romancing the Beat** by Gwen Hayes - [Amazon](https://www.amazon.com/Romancing-Beat-Structure-Romance-Kissing/dp/1530838614)
- **Save the Cat! Writes a Novel** - [Beat Sheets](https://savethecat.com/beat-sheets/book-lovers-novel-beat-sheet-analysis)
- **Romance Beat Sheet Bible** - [20 Beats & Tropes](https://cipherwrite.com/guides/romance-romantasy-beat-sheet-bible)
- **Romancing the Beat Guide** - [Fictionary](https://fictionary.co/journal/romancing-the-beat/)

### Narrative Psychology
- **Wired for Story** by Lisa Cron - [Amazon](https://www.amazon.com/Wired-Story-Writers-Science-Sentence/dp/1607742454) | [Official Site](http://wiredforstory.com/wired-for-story)
- **Story Genius** by Lisa Cron - [Amazon](https://www.amazon.com/Story-Genius-Science-Outlining-Riveting/dp/1607748894)
- **Using Brain Science to Hook Readers** - [Creative Penn Interview](https://www.thecreativepenn.com/2012/08/14/wired-for-story-lisa-cron/)

### Editorial Standards
- **The Chicago Guide to Copyediting Fiction** by Amy J. Schneider - [University of Chicago Press](https://press.uchicago.edu/ucp/books/book/chicago/C/bo183690033.html)
- **Developmental Editing Best Practices** - [Reedsy](https://reedsy.com/editing/developmental-editing)
- **Romance Novel Editing Guide** - [AutomateeD](https://www.automateed.com/romance-novel-editor)
- **Fiction Editing Best Practices** - [BubbleCow](https://bubblecow.com/blog/romance-book-editing)

### Genre Conventions
- **Romance Writers of America Standards** - [Lucy Monroe](https://www.lucymonroe.com/lucy-at-the-heart/romance-conventions-reader-expectations/)
- **Romance Beat Sheets Explained** - [Mary Berman](https://mtgberman.substack.com/p/on-romance-novel-beat-sheets)
- **Beat Sheet Template for Bestsellers** - [River Editor](https://rivereditor.com/blogs/2026-beat-sheet-template-six-figure-fiction)

### 2026 Market Trends
- **Romance Market Trends 2026** - [Author Ever After](https://www.authoreverafter.com/romance-market-trends-reader-expectations/)
- **NYT Romance Bestsellers Q1 2026** - [Romancing the Data](https://blog.romancingthedata.com/p/new-york-times-romance-best-sellers)
- **Genre Shifts 2025-2026** - [WriteStats](https://writestats.com/genre-shifts-in-2025-what-worked-what-skyrocketed-and-what-authors-should-know-for-2026/)
- **Romance Novels 2026 Trend** - [Accio](https://www.accio.com/business/romance-novels-2026-trend)
- **What Genre Sells Most 2026** - [Writers of the West](https://writersofthewest.net/blog/what-genre-of-book-sells-the-most-in-2025-trends-data-what-it-means-for-authors/)
- **Top Selling Romance Novels** - [Accio](https://www.accio.com/business/top-selling-romance-novels)

This research foundation ensures the editor provides feedback aligned with proven craft principles, current market expectations, and professional editorial standards—transforming it from generic AI suggestions to authoritative NYT bestseller-level guidance.
