import { getWeaviateClient, POLICY_SEGMENT_CLASS, getPolicySegmentSchema } from '../src/config/weaviate';

async function setupSchema() {
  console.log('🚀 Setting up Weaviate schema...\n');

  try {
    const client = getWeaviateClient();

    // Check if class already exists
    const existingSchema = await client.schema.getter().do();
    const classExists = existingSchema.classes?.some(
      (c: any) => c.class === POLICY_SEGMENT_CLASS
    );

    if (classExists) {
      console.log(`⚠️  Class "${POLICY_SEGMENT_CLASS}" already exists.`);
      console.log('   Deleting existing class...');
      await client.schema.classDeleter().withClassName(POLICY_SEGMENT_CLASS).do();
      console.log('   ✓ Deleted\n');
    }

    // Create the schema
    console.log(`📝 Creating class "${POLICY_SEGMENT_CLASS}"...`);
    const schema = getPolicySegmentSchema();
    await client.schema.classCreator().withClass(schema).do();
    console.log('   ✓ Created\n');

    // Verify the schema
    const newSchema = await client.schema.getter().do();
    const createdClass = newSchema.classes?.find(
      (c: any) => c.class === POLICY_SEGMENT_CLASS
    );

    if (createdClass) {
      console.log('✅ Schema setup successful!\n');
      console.log('Class details:');
      console.log(`   Name: ${createdClass.class}`);
      console.log(`   Vectorizer: ${createdClass.vectorizer}`);
      console.log(`   Properties: ${createdClass.properties?.length}`);
      console.log('\nProperties:');
      createdClass.properties?.forEach((prop: any) => {
        console.log(`   - ${prop.name} (${prop.dataType.join(', ')})`);
      });
    } else {
      throw new Error('Schema verification failed');
    }

    console.log('\n🎉 Ready to ingest documents!\n');
    console.log('Next step: npm run ingest\n');
  } catch (error) {
    console.error('❌ Error setting up schema:', error);
    process.exit(1);
  }
}

setupSchema();
