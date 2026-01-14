import { getWeaviateClient, POLICY_SEGMENT_CLASS } from '../config/weaviate';
import { DocumentChunk } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class IngestionService {
  private client = getWeaviateClient();

  /**
   * Ingest chunks into Weaviate with batch processing
   */
  async ingestChunks(chunks: DocumentChunk[]): Promise<void> {
    console.log(`📤 Ingesting ${chunks.length} chunks to Weaviate...`);

    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      console.log(`   Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}...`);

      try {
        // Prepare batch
        let batcher = this.client.batch.objectsBatcher();

        for (const chunk of batch) {
          const obj = {
            class: POLICY_SEGMENT_CLASS,
            id: uuidv4(),
            properties: {
              content: chunk.content,
              parent_heading: chunk.metadata.parent_heading,
              top_level_section: chunk.metadata.top_level_section,
              section_path: chunk.metadata.section_path,
              source_page: chunk.metadata.source_page,
            },
          };

          batcher = batcher.withObject(obj);
        }

        // Execute batch
        const result = await batcher.do();

        // Check for errors
        if (result && Array.isArray(result)) {
          result.forEach((item: any) => {
            if (item.result?.errors) {
              console.error(`      Error:`, item.result.errors);
              errorCount++;
            } else {
              successCount++;
            }
          });
        } else {
          successCount += batch.length;
        }
      } catch (error) {
        console.error(`      Batch error:`, error);
        errorCount += batch.length;
      }
    }

    console.log(`\n✅ Ingestion complete!`);
    console.log(`   Success: ${successCount} chunks`);
    if (errorCount > 0) {
      console.log(`   Errors: ${errorCount} chunks`);
    }
  }

  /**
   * Get count of objects in the class
   */
  async getCount(): Promise<number> {
    try {
      const result = await this.client.graphql
        .aggregate()
        .withClassName(POLICY_SEGMENT_CLASS)
        .withFields('meta { count }')
        .do();

      return result.data?.Aggregate?.[POLICY_SEGMENT_CLASS]?.[0]?.meta?.count || 0;
    } catch (error) {
      console.error('Error getting count:', error);
      return 0;
    }
  }

  /**
   * Clear all objects from the class
   */
  async clearAll(): Promise<void> {
    console.log('🗑️  Clearing existing data...');

    try {
      // Delete all objects by deleting and recreating the class
      await this.client.schema
        .classDeleter()
        .withClassName(POLICY_SEGMENT_CLASS)
        .do();

      console.log('   ✓ Data cleared\n');
    } catch (error) {
      console.log('   No existing data to clear\n');
    }
  }
}
