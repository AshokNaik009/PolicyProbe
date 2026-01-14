# PolicyProbe V2: High-Fidelity Structural Knowledge Retrieval

<div align="center">

**A demonstration of superior retrieval quality using Structural/Recursive Chunking with Weaviate's Generative Search**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Weaviate](https://img.shields.io/badge/Weaviate-00BFFF?style=flat)](https://weaviate.io/)

</div>

---

## 🎯 Problem Solved

Complex hierarchical documents (Policies, Terms & Conditions, Technical Specs) lose context when chunked linearly. **PolicyProbe V2** enriches small content chunks with their governing section context, enabling:

- ✅ **Contextual Understanding**: Each chunk knows its parent heading and top-level section
- ✅ **Precise Retrieval**: Find exact clauses while understanding their broader context
- ✅ **Transparent AI**: See exactly which document sections informed the answer
- ✅ **High Information Density**: Rich metadata displayed in an Anthropic-inspired UI

## 🏗️ Architecture

```
User Query
    ↓
Weaviate Hybrid Search
(Vector + Keyword)
    ↓
Top-5 Structural Chunks Retrieved
(with parent_heading, top_level_section, section_path)
    ↓
Groq LLM Generation
(llama-3.3-70b-versatile)
    ↓
Answer + Rich Context Display
```

### Structural Chunking Flow

```
Document
    ↓
Level 1: Split by major headings → top_level_section
    ↓
Level 2: Split by sub-headings → parent_heading + section_path
    ↓
Level 3: Split into paragraphs → content chunks (3-5 sentences)
    ↓
Enrich each chunk with inherited metadata
    ↓
Weaviate Ingestion (Cohere embeddings)
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ and npm v9+
- **Cohere API Key** (Free tier): https://cohere.com
- **Groq API Key**: https://groq.com
- **Weaviate Cloud** account: https://console.weaviate.cloud

### Installation

```bash
# Clone the repository
git clone https://github.com/AshokNaik009/PolicyProbe.git
cd PolicyProbe

# Install all dependencies
npm run install:all

# Configure environment variables
cp .env.example .env
# Edit .env and add your API keys:
#   - COHERE_API_KEY
#   - GROQ_API_KEY
#   - WEAVIATE_HOST
#   - WEAVIATE_API_KEY
```

### Setup & Run

```bash
# 1. Initialize Weaviate schema
npm run setup:schema

# 2. Ingest sample policy document
npm run ingest

# 3. Start both servers (backend on :3002, frontend on :8084)
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:8084
- **Backend API**: http://localhost:3002

## 📊 Demo Query

Try this query to see structural retrieval in action:

```
"What is the definition of 'Excluded Damages' and where is that term mentioned in the 'Indemnification' clause?"
```

**Expected behavior:**
1. Retrieves definition from Section 1.2 (Financial Terms)
2. Retrieves relevant chunks from Section 7.2 (Limitation of Liability)
3. Retrieves references from Section 8 (Indemnification)
4. Shows parent heading and top-level section for each chunk
5. Generates comprehensive answer citing all sources

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Backend** | Node.js, TypeScript, Express | API server |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS | User interface |
| **Vector DB** | Weaviate Cloud | Hybrid search & storage |
| **Embeddings** | Cohere (embed-multilingual-v3.0) | Text vectorization |
| **LLM** | Groq (llama-3.3-70b-versatile) | Answer generation |

## 📁 Project Structure

```
policy-probe-v2/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── weaviate.ts          # Weaviate client & schema
│   │   ├── services/
│   │   │   ├── chunking.ts          # Structural chunking engine
│   │   │   ├── ingestion.ts         # Batch upload to Weaviate
│   │   │   └── query.ts             # Hybrid search + Groq generation
│   │   ├── routes/
│   │   │   └── policy.ts            # API endpoints
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript types
│   │   └── index.ts                 # Express server
│   ├── scripts/
│   │   ├── setup-schema.ts          # Initialize Weaviate class
│   │   ├── ingest.ts                # Document ingestion CLI
│   │   └── test-query.ts            # Test query script
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ContextCard.tsx      # Retrieved chunk display
│   │   │   ├── AnswerDisplay.tsx    # Generated answer display
│   │   │   └── QueryBar.tsx         # Search input
│   │   ├── services/
│   │   │   └── api.ts               # API client (Axios)
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript types
│   │   ├── App.tsx                  # Main app component
│   │   ├── main.tsx                 # React entry point
│   │   └── index.css                # Tailwind imports
│   ├── index.html
│   ├── vite.config.ts               # Vite configuration
│   └── package.json
├── sample-data/
│   └── test.txt                     # Sample policy document
├── .env                              # Environment variables (gitignored)
├── .env.example                      # Example environment config
├── .gitignore
├── package.json                      # Root package.json (workspaces)
└── README.md
```

## 🔍 Key Features

### 1. Structural Chunking

The ingestion pipeline performs three-level recursive splitting:

```typescript
// Level 1: Major headings
"# TechCorp Software Services Agreement" → top_level_section

// Level 2: Sub-headings
"## 8. Indemnification" → parent_heading
"### 8.2 Indemnification Limits" → section_path

// Level 3: Content chunks
"Provider's indemnification obligation does not apply..." → content
```

Each Level 3 chunk inherits metadata from its parent sections.

### 2. Rich Metadata Display

Every retrieved chunk shows:
- **Content snippet**: The actual text
- **Parent heading**: Immediate context (e.g., "8.2 Indemnification Limits")
- **Top-level section**: Broad context (e.g., "Indemnification")
- **Section path**: Structural identifier (e.g., "8.2")
- **Relevance score**: Confidence percentage

### 3. Hybrid Search

Combines:
- **Vector search** (Cohere embeddings): Semantic similarity
- **Keyword search** (BM25): Exact term matching
- **Alpha = 0.5**: Balanced weight between both approaches

### 4. Transparent AI

- User sees all 5 retrieved chunks
- Each chunk clearly labeled with source metadata
- Answer cites specific sources (e.g., "According to Source 1...")
- Trust through transparency

## 📝 Adding Your Own Documents

### 1. Prepare Your Document

Ensure your document has clear hierarchical structure using Markdown headings:

```markdown
# Top Level Section
## Major Heading
### Sub-heading
#### Clause

Content paragraphs here...
```

Or numbered format:

```
1. Top Level Section
1.1 Sub-section
1.1.1 Clause

Content paragraphs here...
```

### 2. Place in sample-data/

```bash
cp your-policy.txt sample-data/
```

### 3. Ingest

```bash
npm run ingest -- --file=your-policy.txt --clear
```

The `--clear` flag removes existing data before ingestion.

## 🔧 Configuration

### Backend (.env)

```bash
# Weaviate Configuration
WEAVIATE_HOST=your-cluster.weaviate.cloud
WEAVIATE_API_KEY=your_weaviate_key

# Cohere (for embeddings)
COHERE_API_KEY=your_cohere_key

# Groq (for LLM)
GROQ_API_KEY=your_groq_key

# Server
PORT=3002
NODE_ENV=development
```

### Frontend (vite.config.ts)

```typescript
export default defineConfig({
  server: {
    port: 8084,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
      },
    },
  },
});
```

## 📡 API Endpoints

### POST /api/policy-query

Execute a policy query with structural retrieval.

**Request:**
```json
{
  "query": "What are the indemnification limits?",
  "limit": 5
}
```

**Response:**
```json
{
  "final_answer": "Provider's indemnification...",
  "retrieved_context": [
    {
      "content": "Provider shall defend...",
      "parent_heading": "Provider Indemnification",
      "top_level_section": "Indemnification",
      "section_path": "8.1",
      "score": 0.89
    }
  ],
  "query": "What are the indemnification limits?",
  "timestamp": "2024-01-14T10:30:00Z"
}
```

### GET /api/stats

Get statistics about indexed data.

**Response:**
```json
{
  "total_chunks": 142,
  "class_name": "PolicySegment"
}
```

### GET /api/health

Health check endpoint.

## 🧪 Testing

### Test Query Script

```bash
npm run test:query
```

Runs predefined test queries and displays results in the terminal.

### Manual Testing

1. Start the dev servers: `npm run dev`
2. Open http://localhost:8084
3. Try the example queries
4. Verify retrieved context shows proper metadata

## 🚢 Deployment

### Backend

Deploy to any Node.js hosting platform (Heroku, Railway, Render, etc.):

```bash
cd backend
npm run build
npm start
```

Set environment variables on your hosting platform.

### Frontend

Build and deploy to Vercel, Netlify, or static hosting:

```bash
cd frontend
npm run build
# Deploy the dist/ folder
```

Update `VITE_API_URL` environment variable to point to your deployed backend.

## 🐛 Troubleshooting

### "COHERE_API_KEY is required"

Ensure your `.env` file has the Cohere API key set.

### "Failed to connect to Weaviate"

- Check `WEAVIATE_HOST` in `.env` (should not include `https://`)
- Verify `WEAVIATE_API_KEY` is correct
- Ensure Weaviate Cloud cluster is running

### "No data found"

Run the ingestion script:
```bash
npm run ingest
```

### Frontend can't connect to backend

- Ensure backend is running on port 3002
- Check Vite proxy configuration in `vite.config.ts`

## 📖 Learn More

- [Weaviate Documentation](https://weaviate.io/developers/weaviate)
- [Cohere Embeddings](https://docs.cohere.com/docs/embeddings)
- [Groq LLM API](https://console.groq.com/docs/quickstart)
- [Structural Chunking Strategies](https://www.pinecone.io/learn/chunking-strategies/)

## 📄 License

MIT License - see LICENSE file for details.

## 👤 Author

**Ashok Naik**
- GitHub: [@AshokNaik009](https://github.com/AshokNaik009)

## 🙏 Acknowledgments

- Built with [Weaviate](https://weaviate.io/) vector database
- Embeddings powered by [Cohere](https://cohere.com/)
- LLM inference by [Groq](https://groq.com/)
- UI inspired by [Anthropic](https://www.anthropic.com/) design principles
