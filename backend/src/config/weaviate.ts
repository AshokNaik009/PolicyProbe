import weaviate, { WeaviateClient } from 'weaviate-ts-client';
import dotenv from 'dotenv';

dotenv.config();

let client: WeaviateClient | null = null;

export const getWeaviateClient = (): WeaviateClient => {
  if (client) {
    return client;
  }

  const weaviateHost = process.env.WEAVIATE_HOST;
  const weaviateApiKey = process.env.WEAVIATE_API_KEY;
  const cohereApiKey = process.env.COHERE_API_KEY;

  if (!weaviateHost || !weaviateApiKey || !cohereApiKey) {
    throw new Error(
      'Missing required environment variables: WEAVIATE_HOST, WEAVIATE_API_KEY, or COHERE_API_KEY'
    );
  }

  // Remove https:// if present in the host
  const cleanHost = weaviateHost.replace(/^https?:\/\//, '');

  client = weaviate.client({
    scheme: 'https',
    host: cleanHost,
    apiKey: new weaviate.ApiKey(weaviateApiKey),
    headers: {
      'X-Cohere-Api-Key': cohereApiKey,
    },
  });

  return client;
};

export const POLICY_SEGMENT_CLASS = 'PolicySegment';

export const getPolicySegmentSchema = () => ({
  class: POLICY_SEGMENT_CLASS,
  description: 'Structurally chunked policy document segments with hierarchical metadata',
  vectorizer: 'text2vec-cohere',
  moduleConfig: {
    'text2vec-cohere': {
      model: 'embed-multilingual-v3.0',
      truncate: 'END',
    },
    'generative-openai': {
      model: 'gpt-3.5-turbo',
    },
  },
  properties: [
    {
      name: 'content',
      dataType: ['text'],
      description: 'The actual content chunk (paragraph or sentence group)',
      moduleConfig: {
        'text2vec-cohere': {
          skip: false,
          vectorizePropertyName: false,
        },
      },
    },
    {
      name: 'parent_heading',
      dataType: ['text'],
      description: 'The immediate parent heading text',
      moduleConfig: {
        'text2vec-cohere': {
          skip: true,
        },
      },
    },
    {
      name: 'top_level_section',
      dataType: ['text'],
      description: 'The highest-level section heading',
      moduleConfig: {
        'text2vec-cohere': {
          skip: true,
        },
      },
    },
    {
      name: 'section_path',
      dataType: ['text'],
      description: 'Structural path identifier (e.g., "1.2.3")',
      moduleConfig: {
        'text2vec-cohere': {
          skip: true,
        },
      },
    },
    {
      name: 'source_page',
      dataType: ['int'],
      description: 'Page number in the original document',
    },
  ],
});
