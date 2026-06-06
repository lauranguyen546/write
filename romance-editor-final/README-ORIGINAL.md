# Romance Editor

An AI-powered manuscript analysis tool for romance novel authors. Upload your manuscript and receive professional editorial feedback, AI-generated rewrites, and actionable improvements.

## Features Completed (Steps 1-3)

### ✅ Architecture & Scaffolding
- Next.js 14 with App Router and TypeScript
- Tailwind CSS for styling
- SQLite database with Prisma ORM
- Project-based workflow structure

### ✅ Manuscript Ingestion
- Upload support for `.txt`, `.md`, and `.docx` files
- Paste text directly into the editor
- Drag-and-drop file upload
- Manuscript validation (up to 200,000 words)
- Word count and reading time calculation

### ✅ Project Management
- Create and manage multiple projects
- Configure genre settings:
  - Subgenre (Contemporary, Historical, etc.)
  - Heat level (Sweet, Closed Door, Open Door, Explicit)
  - Tropes (Enemies-to-lovers, Fake dating, etc.)
  - POV style (First person, Third limited, etc.)
  - Target tone (Lyrical, Punchy, Comedic, Dark)

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd romance-editor
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```
   OPENAI_API_KEY=your_openai_key_here
   ANTHROPIC_API_KEY=your_anthropic_key_here
   LLM_PROVIDER=anthropic  # or "openai"
   ```

4. Initialize the database:
   ```bash
   node scripts/init-db.js
   ```

5. (Optional) Seed with demo data:
   ```bash
   npm run prisma:seed
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open your browser to `http://localhost:3000`

## Project Structure

```
romance-editor/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── projects/            # Project CRUD
│   │   └── manuscripts/         # Manuscript upload
│   ├── projects/                # Project pages
│   │   ├── new/                 # Create project
│   │   └── [id]/                # Project dashboard
│   │       ├── settings/        # Genre settings & upload
│   │       ├── analysis/        # Issues (coming in Step 7)
│   │       └── export/          # Export (coming in Step 8)
│   └── page.tsx                 # Landing page
├── components/                  # React components
│   └── manuscript/
│       └── UploadZone.tsx      # File upload component
├── lib/                         # Core libraries
│   ├── prisma.ts               # Database client
│   └── processing/
│       ├── text-parser.ts      # Text/Markdown parsing
│       └── docx-parser.ts      # DOCX parsing
├── types/                       # TypeScript types
│   └── index.ts
├── prisma/                      # Database
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Sample data
└── scripts/
    └── init-db.js              # Database initialization
```

## Database Schema

- **Project**: Stores project metadata and genre settings
- **Manuscript**: Stores uploaded manuscript text
- **Chunk**: Text segments for analysis (created in Step 4)
- **Issue**: Editorial findings (created in Step 5-6)
- **Revision**: AI-generated rewrites (created in Step 6)
- **Job**: Background job tracking (created in Step 6)

## Usage

### Creating a Project

1. Click "New Project" on the homepage
2. Enter a project title
3. Configure genre settings (subgenre, heat level, tropes, etc.)
4. Upload your manuscript (or paste text)

### Uploading a Manuscript

- **File Upload**: Drag and drop or browse for `.txt`, `.md`, or `.docx` files
- **Paste Text**: Switch to "Paste Text" tab and paste your entire manuscript

## Coming Next

### Steps 4-6 (In Progress)
- Chunking and scene/chapter detection
- Local heuristics analysis (repetition, passive voice, etc.)
- LLM integration for editorial analysis
- Background job processing

### Steps 7-9 (Upcoming)
- Issue list and filtering UI
- Scene view with highlighting
- Rewrite generation and acceptance
- Export functionality (DOCX, CSV, editorial letter)
- Testing and documentation

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **AI**: OpenAI GPT-4 / Anthropic Claude (configurable)
- **File Processing**: Mammoth (DOCX), native parsers (TXT/MD)

## Development

### Running Tests
```bash
npm test
```

### Database Management
```bash
# View database in Prisma Studio (requires Prisma generate to work)
npx prisma studio

# Reset database
rm prisma/dev.db && node scripts/init-db.js
```

## Contributing

This is a work in progress. Steps 4-9 are in development.

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
