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

export interface Stats {
  total_chunks: number;
  class_name: string;
}
