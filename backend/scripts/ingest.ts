import * as fs from 'fs';
import * as path from 'path';
import { StructuralChunker } from '../src/services/chunking';
import { IngestionService } from '../src/services/ingestion';
import { getPolicySegmentSchema } from '../src/config/weaviate';
import { getWeaviateClient, POLICY_SEGMENT_CLASS } from '../src/config/weaviate';

async function ingestDocument() {
  console.log('🚀 PolicyProbe V2 - Document Ingestion\n');
  console.log('=====================================\n');

  try {
    // Get file path from command line
    const args = process.argv.slice(2);
    const fileArg = args.find((arg) => arg.startsWith('--file='));

    if (!fileArg) {
      console.error('❌ No file specified');
      console.log('\nUsage: npm run ingest -- --file=your-document.txt');
      console.log('\nNote: Place your document in the sample-data/ directory first.\n');
      console.log('Alternatively, use the web UI to upload documents directly.\n');
      process.exit(1);
    }

    const fileName = fileArg.split('=')[1];
    const filePath = path.join(__dirname, '../../sample-data', fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      console.log('\nUsage: npm run ingest -- --file=your-document.txt');
      console.log('\nNote: Place your document in the sample-data/ directory first.\n');
      console.log('Alternatively, use the web UI to upload documents directly.\n');
      process.exit(1);
    }

    console.log(`📁 Reading document: ${fileName}`);
    const content = fs.readFileSync(filePath, 'utf-8');
    console.log(`   Size: ${(content.length / 1024).toFixed(2)} KB`);
    console.log(`   Lines: ${content.split('\n').length}\n`);

    // Ensure schema exists
    console.log('🔍 Checking Weaviate schema...');
    const client = getWeaviateClient();
    const schema = await client.schema.getter().do();
    const classExists = schema.classes?.some((c: any) => c.class === POLICY_SEGMENT_CLASS);

    if (!classExists) {
      console.log('   Schema not found. Creating...');
      await client.schema.classCreator().withClass(getPolicySegmentSchema()).do();
      console.log('   ✓ Schema created\n');
    } else {
      console.log('   ✓ Schema exists\n');
    }

    // Initialize services
    const chunker = new StructuralChunker();
    const ingestionService = new IngestionService();

    // Clear existing data (optional)
    const shouldClear = args.includes('--clear');
    if (shouldClear) {
      await ingestionService.clearAll();
      console.log('🔍 Checking schema again after clear...');
      const schemaAfterClear = await client.schema.getter().do();
      const classExistsAfterClear = schemaAfterClear.classes?.some(
        (c: any) => c.class === POLICY_SEGMENT_CLASS
      );
      if (!classExistsAfterClear) {
        console.log('   Schema was deleted. Recreating...');
        await client.schema.classCreator().withClass(getPolicySegmentSchema()).do();
        console.log('   ✓ Schema recreated\n');
      }
    }

    // Chunk the document
    const chunks = chunker.chunkDocument(content);

    // Display sample chunks
    console.log('📊 Sample chunks:\n');
    chunks.slice(0, 3).forEach((chunk, idx) => {
      console.log(`   Chunk ${idx + 1}:`);
      console.log(`   Top Level: "${chunk.metadata.top_level_section}"`);
      console.log(`   Parent: "${chunk.metadata.parent_heading}"`);
      console.log(`   Path: ${chunk.metadata.section_path}`);
      console.log(`   Content: "${chunk.content.substring(0, 100)}..."`);
      console.log('');
    });

    // Ingest chunks
    await ingestionService.ingestChunks(chunks);

    // Verify ingestion
    console.log('\n🔍 Verifying ingestion...');
    const count = await ingestionService.getCount();
    console.log(`   Total objects in Weaviate: ${count}\n`);

    console.log('✨ All done! Ready to query.\n');
    console.log('Next step: Start the server with "npm run dev"\n');
  } catch (error) {
    console.error('❌ Ingestion error:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      if (error.stack) {
        console.error('   Stack:', error.stack);
      }
    }
    process.exit(1);
  }
}

ingestDocument();
