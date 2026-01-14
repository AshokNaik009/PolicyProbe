import { QueryService } from '../src/services/query';

async function testQuery() {
  console.log('🧪 Testing PolicyProbe V2 Query System\n');
  console.log('======================================\n');

  try {
    const queryService = new QueryService();

    // Get stats first
    console.log('📊 Database Statistics:');
    const stats = await queryService.getStats();
    console.log(`   Total chunks indexed: ${stats.total_chunks}\n`);

    if (stats.total_chunks === 0) {
      console.log('⚠️  No data found. Please run: npm run ingest\n');
      process.exit(1);
    }

    // Test queries
    const testQueries = [
      "What is the definition of 'Excluded Damages' and where is that term mentioned in the 'Indemnification' clause?",
      'What are the user obligations?',
      'What is the termination policy?',
    ];

    for (const query of testQueries) {
      console.log('─'.repeat(60));
      console.log(`\n📝 Query: "${query}"\n`);

      const result = await queryService.query(query);

      console.log('💡 Answer:');
      console.log(result.final_answer);
      console.log('\n📚 Retrieved Context:');

      result.retrieved_context.forEach((ctx, idx) => {
        console.log(`\n   [${idx + 1}] Score: ${ctx.score.toFixed(3)}`);
        console.log(`       Top Section: ${ctx.top_level_section}`);
        console.log(`       Parent: ${ctx.parent_heading}`);
        console.log(`       Path: ${ctx.section_path}`);
        console.log(`       Content: ${ctx.content.substring(0, 150)}...`);
      });

      console.log('\n');
    }

    console.log('─'.repeat(60));
    console.log('\n✅ Test complete!\n');
  } catch (error) {
    console.error('❌ Test error:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  }
}

testQuery();
