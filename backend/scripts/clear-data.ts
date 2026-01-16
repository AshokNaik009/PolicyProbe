import { IngestionService } from '../src/services/ingestion';
import { getWeaviateClient, POLICY_SEGMENT_CLASS } from '../src/config/weaviate';

async function clearData() {
  console.log('🚀 PolicyProbe V2 - Clear All Data\n');
  console.log('=====================================\n');

  try {
    const ingestionService = new IngestionService();

    // Get current count
    console.log('🔍 Checking current data...');
    const currentCount = await ingestionService.getCount();
    console.log(`   Current chunks in Weaviate: ${currentCount}\n`);

    if (currentCount === 0) {
      console.log('✨ No data to clear. Database is already empty.\n');
      return;
    }

    // Clear all data
    await ingestionService.clearAll();

    // Verify clearing
    console.log('🔍 Verifying data cleared...');
    const client = getWeaviateClient();
    const schema = await client.schema.getter().do();
    const classExists = schema.classes?.some((c: any) => c.class === POLICY_SEGMENT_CLASS);

    if (classExists) {
      const finalCount = await ingestionService.getCount();
      console.log(`   Remaining chunks: ${finalCount}\n`);
    } else {
      console.log(`   ✓ Class "${POLICY_SEGMENT_CLASS}" removed completely\n`);
    }

    console.log('✨ All done! Database cleared successfully.\n');
    console.log('Next step: Upload a new document via the UI or run "npm run ingest"\n');
  } catch (error) {
    console.error('❌ Clear data error:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      if (error.stack) {
        console.error('   Stack:', error.stack);
      }
    }
    process.exit(1);
  }
}

clearData();
