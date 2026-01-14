// Weaviate PolicySegment schema
export interface PolicySegment {
  content: string;
  parent_heading: string;
  top_level_section: string;
  section_path: string;
  source_page: number;
}

// API Response types
export interface RetrievedContext {
  content: string;
  parent_heading: string;
  top_level_section: string;
  section_path: string;
  score: number;
}

export interface QueryResponse {
  final_answer: string;
  retrieved_context: RetrievedContext[];
  query: string;
  timestamp: string;
}

// Ingestion types
export interface ChunkMetadata {
  parent_heading: string;
  top_level_section: string;
  section_path: string;
  source_page: number;
}

export interface DocumentChunk {
  content: string;
  metadata: ChunkMetadata;
}

// Structural parsing types
export interface Section {
  heading: string;
  level: number;
  content: string;
  children: Section[];
  path: string;
}
