import { getWeaviateClient, POLICY_SEGMENT_CLASS } from '../config/weaviate';
import { QueryResponse, RetrievedContext } from '../types';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export class QueryService {
  private client = getWeaviateClient();
  private groq: Groq;

  constructor() {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY is required');
    }
    this.groq = new Groq({ apiKey: groqApiKey });
  }

  /**
   * Execute hybrid search and generate answer using Groq
   */
  async query(userQuestion: string, limit: number = 5): Promise<QueryResponse> {
    console.log(`\n🔍 Query: "${userQuestion}"`);

    try {
      // Step 1: Hybrid Search in Weaviate
      console.log('   Searching Weaviate...');
      const searchResult = await this.client.graphql
        .get()
        .withClassName(POLICY_SEGMENT_CLASS)
        .withHybrid({
          query: userQuestion,
          alpha: 0.5, // Balance between vector (0) and keyword (1) search
        })
        .withLimit(limit)
        .withFields('content parent_heading top_level_section section_path _additional { certainty }')
        .do();

      const results = searchResult.data?.Get?.[POLICY_SEGMENT_CLASS] || [];

      if (results.length === 0) {
        return {
          final_answer: 'No relevant information found in the policy documents.',
          retrieved_context: [],
          query: userQuestion,
          timestamp: new Date().toISOString(),
        };
      }

      console.log(`   Found ${results.length} relevant chunks`);

      // Step 2: Format retrieved context
      const retrievedContext: RetrievedContext[] = results.map((result: any) => ({
        content: result.content,
        parent_heading: result.parent_heading,
        top_level_section: result.top_level_section,
        section_path: result.section_path,
        score: result._additional?.certainty || 0,
      }));

      // Step 3: Generate answer using Groq
      console.log('   Generating answer with Groq...');
      const answer = await this.generateAnswer(userQuestion, retrievedContext);

      console.log('   ✓ Query complete\n');

      return {
        final_answer: answer,
        retrieved_context: retrievedContext,
        query: userQuestion,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  /**
   * Generate answer using Groq LLM
   */
  private async generateAnswer(
    question: string,
    context: RetrievedContext[]
  ): Promise<string> {
    // Build context string
    const contextString = context
      .map((ctx, idx) => {
        return `[Source ${idx + 1}: ${ctx.top_level_section} > ${ctx.parent_heading}]\n${ctx.content}`;
      })
      .join('\n\n---\n\n');

    const systemPrompt = `You are a helpful assistant that answers questions about policy documents.
You MUST base your answer ONLY on the provided context from the policy document.
If the context doesn't contain enough information to answer the question, say so.
Always cite which source(s) you used (e.g., "According to Source 1..." or "As stated in Source 2...").
Be precise and comprehensive in your answer.`;

    const userPrompt = `Context from policy document:

${contextString}

Question: ${question}

Provide a clear, accurate answer based only on the context above. Cite your sources.`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: 'llama-3.3-70b-versatile', // Fast and high-quality model
        temperature: 0.3, // Lower temperature for more factual responses
        max_tokens: 1024,
      });

      return completion.choices[0]?.message?.content || 'Unable to generate answer.';
    } catch (error) {
      console.error('Groq API error:', error);
      throw new Error('Failed to generate answer with Groq');
    }
  }

  /**
   * Get statistics about the indexed data
   */
  async getStats(): Promise<any> {
    try {
      const result = await this.client.graphql
        .aggregate()
        .withClassName(POLICY_SEGMENT_CLASS)
        .withFields('meta { count }')
        .do();

      const count = result.data?.Aggregate?.[POLICY_SEGMENT_CLASS]?.[0]?.meta?.count || 0;

      return {
        total_chunks: count,
        class_name: POLICY_SEGMENT_CLASS,
      };
    } catch (error) {
      console.error('Stats error:', error);
      return {
        total_chunks: 0,
        class_name: POLICY_SEGMENT_CLASS,
        error: 'Failed to get statistics',
      };
    }
  }
}
