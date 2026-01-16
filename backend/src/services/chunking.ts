import { Section, DocumentChunk, ChunkMetadata } from '../types';

/**
 * Structural/Recursive Chunking Engine
 * Parses hierarchical documents and creates chunks with rich metadata
 */
export class StructuralChunker {
  private readonly HEADING_PATTERNS = {
    h1: /^#\s+(.+)$/gm,
    h2: /^##\s+(.+)$/gm,
    h3: /^###\s+(.+)$/gm,
    numbered: /^(\d+(?:\.\d+)*)\.\s+(.+)$/gm,
  };

  /**
   * Parse document into hierarchical sections
   */
  parseDocument(content: string): Section[] {
    const lines = content.split('\n');
    const sections: Section[] = [];
    let currentSection: Section | null = null;
    let currentContent: string[] = [];
    let sectionCounter = { h1: 0, h2: 0, h3: 0 };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for headings
      const h1Match = line.match(/^#\s+(.+)$/);
      const h2Match = line.match(/^##\s+(.+)$/);
      const h3Match = line.match(/^###\s+(.+)$/);
      const numberedMatch = line.match(/^(\d+(?:\.\d+)*)\.\s+(.+)$/);

      if (h1Match || h2Match || h3Match || numberedMatch) {
        // Save previous section
        if (currentSection) {
          currentSection.content = currentContent.join('\n').trim();
          sections.push(currentSection);
        }

        // Determine heading level and text
        let level = 1;
        let heading = '';
        let path = '';

        if (h1Match) {
          level = 1;
          heading = h1Match[1];
          sectionCounter.h1++;
          sectionCounter.h2 = 0;
          sectionCounter.h3 = 0;
          path = `${sectionCounter.h1}`;
        } else if (h2Match) {
          level = 2;
          heading = h2Match[1];
          sectionCounter.h2++;
          sectionCounter.h3 = 0;
          path = `${sectionCounter.h1}.${sectionCounter.h2}`;
        } else if (h3Match) {
          level = 3;
          heading = h3Match[1];
          sectionCounter.h3++;
          path = `${sectionCounter.h1}.${sectionCounter.h2}.${sectionCounter.h3}`;
        } else if (numberedMatch) {
          path = numberedMatch[1];
          heading = numberedMatch[2];
          level = path.split('.').length;
        }

        currentSection = {
          heading,
          level,
          content: '',
          children: [],
          path,
        };
        currentContent = [];
      } else if (line.length > 0) {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentSection) {
      currentSection.content = currentContent.join('\n').trim();
      sections.push(currentSection);
    }

    return this.buildHierarchy(sections);
  }

  /**
   * Build hierarchical structure from flat sections
   */
  private buildHierarchy(sections: Section[]): Section[] {
    const root: Section[] = [];
    const stack: Section[] = [];

    for (const section of sections) {
      // Pop stack until we find the right parent
      while (stack.length > 0 && stack[stack.length - 1].level >= section.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        root.push(section);
      } else {
        stack[stack.length - 1].children.push(section);
      }

      stack.push(section);
    }

    return root;
  }

  /**
   * Create chunks with structural metadata
   */
  createStructuralChunks(sections: Section[], sourcePage: number = 1): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];

    const processSection = (
      section: Section,
      topLevelSection: string,
      parentHeading: string = ''
    ) => {
      const currentTopLevel = topLevelSection || section.heading;
      const currentParent = parentHeading || section.heading;

      // Split content into paragraphs
      const paragraphs = this.splitIntoParagraphs(section.content);

      // Create chunks for each paragraph
      paragraphs.forEach((paragraph) => {
        if (paragraph.length > 20) {
          // Skip very short paragraphs
          chunks.push({
            content: paragraph,
            metadata: {
              parent_heading: currentParent,
              top_level_section: currentTopLevel,
              section_path: section.path,
              source_page: sourcePage,
            },
          });
        }
      });

      // Process children recursively
      section.children.forEach((child) => {
        processSection(child, currentTopLevel, section.heading);
      });
    };

    sections.forEach((section) => {
      processSection(section, section.heading);
    });

    return chunks;
  }

  /**
   * Split content into meaningful paragraphs
   */
  private splitIntoParagraphs(content: string): string[] {
    if (!content || content.trim().length === 0) {
      return [];
    }

    // Split by double newlines or sentence groups
    const paragraphs = content
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // If paragraphs are too long, split by sentences (3-5 sentences per chunk)
    const result: string[] = [];
    for (const paragraph of paragraphs) {
      if (paragraph.length > 800) {
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
        let currentChunk: string[] = [];

        for (const sentence of sentences) {
          currentChunk.push(sentence.trim());

          if (currentChunk.length >= 3) {
            result.push(currentChunk.join(' '));
            currentChunk = [];
          }
        }

        if (currentChunk.length > 0) {
          result.push(currentChunk.join(' '));
        }
      } else {
        result.push(paragraph);
      }
    }

    return result;
  }

  /**
   * Main entry point for chunking
   */
  chunkDocument(content: string, sourcePage: number = 1): DocumentChunk[] {
    console.log('📄 Parsing document structure...');
    const sections = this.parseDocument(content);
    console.log(`   Found ${sections.length} top-level sections`);

    console.log('✂️  Creating structural chunks...');
    let chunks = this.createStructuralChunks(sections, sourcePage);

    // Fallback: if no sections found (no headings), chunk entire document by paragraphs
    if (chunks.length === 0 && content.trim().length > 0) {
      console.log('   No structured sections found. Using paragraph-based chunking...');
      chunks = this.chunkByParagraphs(content, sourcePage);
    }

    console.log(`   Created ${chunks.length} chunks with metadata\n`);

    return chunks;
  }

  /**
   * Fallback chunking for documents without structured headings
   * Splits document into paragraph-based chunks
   */
  private chunkByParagraphs(content: string, sourcePage: number = 1): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const paragraphs = this.splitIntoParagraphs(content);

    paragraphs.forEach((paragraph, index) => {
      if (paragraph.length > 20) {
        chunks.push({
          content: paragraph,
          metadata: {
            parent_heading: 'Document',
            top_level_section: 'Document',
            section_path: `${index + 1}`,
            source_page: sourcePage,
          },
        });
      }
    });

    return chunks;
  }
}
