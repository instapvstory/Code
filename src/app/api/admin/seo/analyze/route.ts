import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Simple NLP entity extraction (in production, use a proper NLP service)
function extractNlpEntities(text: string) {
  const entities = {
    people: [] as string[],
    organizations: [] as string[],
    locations: [] as string[],
    dates: [] as string[],
    products: [] as string[],
    concepts: [] as string[],
  };

  // Simple keyword extraction (in production, use proper NLP)
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const commonConcepts = ['seo', 'marketing', 'content', 'blog', 'website', 'optimization', 'search', 'google'];
  
  words.forEach(word => {
    if (commonConcepts.includes(word)) {
      entities.concepts.push(word);
    }
  });

  return entities;
}

// Calculate SEO score based on various factors
function calculateSeoScore(analysis: any) {
  let score = 0;
  const maxScore = 100;

  // Title optimization (15 points)
  if (analysis.titleLength >= 40 && analysis.titleLength <= 60) score += 15;
  else if (analysis.titleLength >= 30 && analysis.titleLength <= 70) score += 10;
  else score += 5;

  // Meta description (10 points)
  if (analysis.metaDescriptionLength >= 120 && analysis.metaDescriptionLength <= 160) score += 10;
  else if (analysis.metaDescriptionLength >= 100 && analysis.metaDescriptionLength <= 180) score += 7;
  else score += 3;

  // Content length (20 points)
  if (analysis.wordCount >= 1500) score += 20;
  else if (analysis.wordCount >= 1000) score += 15;
  else if (analysis.wordCount >= 500) score += 10;
  else if (analysis.wordCount >= 300) score += 5;

  // Headings (10 points)
  if (analysis.headingCount >= 3) score += 10;
  else if (analysis.headingCount >= 2) score += 7;
  else if (analysis.headingCount >= 1) score += 5;

  // Images (10 points)
  if (analysis.imageCount >= 3) score += 10;
  else if (analysis.imageCount >= 1) score += 5;

  // Internal links (10 points)
  if (analysis.internalLinkCount >= 3) score += 10;
  else if (analysis.internalLinkCount >= 1) score += 5;

  // External links (5 points)
  if (analysis.externalLinkCount >= 1) score += 5;

  // Keyword optimization (20 points)
  let keywordScore = 0;
  if (analysis.keywordInTitle) keywordScore += 5;
  if (analysis.keywordInMetaDescription) keywordScore += 5;
  if (analysis.keywordInFirstParagraph) keywordScore += 5;
  if (analysis.keywordInH1) keywordScore += 5;
  score += Math.min(keywordScore, 20);

  return Math.min(score, maxScore);
}

// Calculate readability score
function calculateReadabilityScore(text: string) {
  const words = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).length;
  const paragraphs = text.split(/\n\s*\n/).length;
  
  if (words === 0 || sentences === 0) return 50;
  
  const avgSentenceLength = words / sentences;
  const avgParagraphLength = sentences / paragraphs;
  
  let score = 50;
  
  // Adjust based on sentence length
  if (avgSentenceLength <= 20) score += 20;
  else if (avgSentenceLength <= 25) score += 10;
  else if (avgSentenceLength > 35) score -= 10;
  
  // Adjust based on paragraph length
  if (avgParagraphLength <= 5) score += 10;
  else if (avgParagraphLength <= 8) score += 5;
  else if (avgParagraphLength > 12) score -= 5;
  
  return Math.max(0, Math.min(100, score));
}

// Calculate EEAT scores
function calculateEeatScores(content: string, authorData: any = {}) {
  const baseScores = {
    experience: 60,
    expertise: 60,
    authoritativeness: 50,
    trustworthiness: 50,
  };

  // Adjust based on content quality
  const wordCount = content.split(/\s+/).length;
  if (wordCount > 1000) {
    baseScores.experience += 10;
    baseScores.expertise += 10;
  }

  // Adjust based on author data
  if (authorData.credentials && authorData.credentials.length > 0) {
    baseScores.expertise += 15;
    baseScores.authoritativeness += 10;
  }

  if (authorData.socialProfiles && Object.keys(authorData.socialProfiles).length > 0) {
    baseScores.trustworthiness += 10;
  }

  // Cap scores at 100
  Object.keys(baseScores).forEach(key => {
    baseScores[key as keyof typeof baseScores] = Math.min(100, baseScores[key as keyof typeof baseScores]);
  });

  const overall = Math.round(
    (baseScores.experience + baseScores.expertise + baseScores.authoritativeness + baseScores.trustworthiness) / 4
  );

  return {
    ...baseScores,
    overall,
  };
}

// Generate recommendations
function generateRecommendations(analysis: any) {
  const recommendations = [];
  const warnings = [];
  const improvements = [];

  // Title recommendations
  if (analysis.titleLength < 40) {
    recommendations.push('Increase title length to at least 40 characters');
  } else if (analysis.titleLength > 60) {
    recommendations.push('Reduce title length to under 60 characters');
  }

  // Meta description recommendations
  if (analysis.metaDescriptionLength < 120) {
    recommendations.push('Increase meta description length to at least 120 characters');
  } else if (analysis.metaDescriptionLength > 160) {
    recommendations.push('Reduce meta description length to under 160 characters');
  }

  // Content length recommendations
  if (analysis.wordCount < 300) {
    warnings.push('Content is too short. Aim for at least 300 words for better SEO');
  } else if (analysis.wordCount < 1000) {
    improvements.push('Consider expanding content to 1000+ words for comprehensive coverage');
  }

  // Heading recommendations
  if (analysis.headingCount === 0) {
    warnings.push('Add headings to improve content structure and SEO');
  } else if (analysis.headingCount < 3) {
    improvements.push('Add more subheadings to break up content');
  }

  // Image recommendations
  if (analysis.imageCount === 0) {
    recommendations.push('Add at least one relevant image to improve engagement');
  }

  // Internal linking recommendations
  if (analysis.internalLinkCount === 0) {
    recommendations.push('Add internal links to related content');
  }

  // Keyword recommendations
  if (!analysis.keywordInTitle) {
    warnings.push('Focus keyword not found in title');
  }
  if (!analysis.keywordInMetaDescription) {
    improvements.push('Include focus keyword in meta description');
  }
  if (!analysis.keywordInFirstParagraph) {
    improvements.push('Include focus keyword in first paragraph');
  }

  return { recommendations, warnings, improvements };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      postId,
      title,
      content,
      metaDescription,
      focusKeyword,
      slug,
      authorId,
    } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required for SEO analysis' },
        { status: 400 }
      );
    }

    // Basic analysis
    const wordCount = content.split(/\s+/).length;
    const titleLength = title?.length || 0;
    const metaDescriptionLength = metaDescription?.length || 0;
    
    // Count headings
    const headingCount = (content.match(/<h[1-6][^>]*>/gi) || []).length;
    
    // Count images
    const imageCount = (content.match(/<img[^>]*>/gi) || []).length;
    
    // Count links
    const internalLinkCount = (content.match(/href="[^"]*\/[^"]*"/gi) || []).length;
    const externalLinkCount = (content.match(/href="https?:\/\/(?!yourdomain)/gi) || []).length;
    
    // Keyword analysis
    const keyword = focusKeyword?.toLowerCase() || '';
    const contentLower = content.toLowerCase();
    const titleLower = title?.toLowerCase() || '';
    const metaDescriptionLower = metaDescription?.toLowerCase() || '';
    
    const keywordAnalysis = {
      keywordInTitle: keyword && titleLower.includes(keyword),
      keywordInMetaDescription: keyword && metaDescriptionLower.includes(keyword),
      keywordInFirstParagraph: keyword && contentLower.substring(0, 500).includes(keyword),
      keywordInUrl: keyword && slug?.toLowerCase().includes(keyword.replace(/\s+/g, '-')),
      keywordInH1: keyword && (content.match(/<h1[^>]*>.*?<\/h1>/gi) || []).some((h1: string) =>
        h1.toLowerCase().includes(keyword)
      ),
      keywordInH2: keyword && (content.match(/<h2[^>]*>.*?<\/h2>/gi) || []).some((h2: string) =>
        h2.toLowerCase().includes(keyword)
      ),
      keywordDensity: keyword ?
        ((contentLower.split(keyword).length - 1) / wordCount * 100).toFixed(2) : 0,
    };

    // Extract NLP entities
    const nlpEntities = extractNlpEntities(content);
    
    // Extract semantic topics (simplified)
    const semanticTopics = Array.from(
      new Set(
        content
          .toLowerCase()
          .match(/\b[a-z]{4,}\b/g)
          ?.filter((word: string) => !['that', 'this', 'with', 'from', 'have', 'were'].includes(word))
          .slice(0, 10) || []
      )
    );

    // Calculate scores
    const analysis = {
      titleLength,
      metaDescriptionLength,
      wordCount,
      headingCount,
      imageCount,
      internalLinkCount,
      externalLinkCount,
      ...keywordAnalysis,
    };

    const seoScore = calculateSeoScore(analysis);
    const readabilityScore = calculateReadabilityScore(content);
    
    // Get author data (simplified)
    const authorData = authorId ? {} : {};
    const eeatScores = calculateEeatScores(content, authorData);
    
    // Generate recommendations
    const { recommendations, warnings, improvements } = generateRecommendations(analysis);

    // Prepare internal linking suggestions (simplified)
    const internalLinkingSuggestions = [
      { postId: 'example-1', title: 'Related Post 1', relevance: 85 },
      { postId: 'example-2', title: 'Related Post 2', relevance: 72 },
    ];

    // Prepare response
    const seoAnalysis = {
      focusKeyword: keyword,
      seoScore,
      readabilityScore,
      wordCount,
      paragraphCount: content.split(/\n\s*\n/).length,
      headingCount,
      imageCount,
      internalLinkCount,
      externalLinkCount,
      keywordAnalysis,
      nlpEntities,
      semanticTopics,
      eeatScores,
      internalLinkingSuggestions,
      recommendations,
      warnings,
      improvements,
      lastAnalyzedAt: new Date().toISOString(),
    };

    // Save to database if postId is provided
    if (postId) {
      const { error } = await supabase
        .from('seo_analysis')
        .upsert({
          post_id: postId,
          focus_keyword: keyword,
          seo_score: seoScore,
          readability_score: readabilityScore,
          word_count: wordCount,
          heading_count: headingCount,
          image_count: imageCount,
          internal_link_count: internalLinkCount,
          external_link_count: externalLinkCount,
          keyword_density: parseFloat(keywordAnalysis.keywordDensity as string),
          keyword_in_title: keywordAnalysis.keywordInTitle,
          keyword_in_meta_description: keywordAnalysis.keywordInMetaDescription,
          keyword_in_first_paragraph: keywordAnalysis.keywordInFirstParagraph,
          keyword_in_url: keywordAnalysis.keywordInUrl,
          keyword_in_h1: keywordAnalysis.keywordInH1,
          keyword_in_h2: keywordAnalysis.keywordInH2,
          nlp_entities: nlpEntities,
          semantic_topics: semanticTopics,
          experience_score: eeatScores.experience,
          expertise_score: eeatScores.expertise,
          authoritativeness_score: eeatScores.authoritativeness,
          trustworthiness_score: eeatScores.trustworthiness,
          overall_eeat_score: eeatScores.overall,
          internal_linking_suggestions: internalLinkingSuggestions,
          recommendations,
          warnings,
          improvements,
          last_analyzed_at: new Date().toISOString(),
        }, {
          onConflict: 'post_id',
        });

      if (error) {
        console.error('Error saving SEO analysis:', error);
      }
    }

    return NextResponse.json({
      success: true,
      analysis: seoAnalysis,
      message: 'SEO analysis completed successfully',
    });

  } catch (error) {
    console.error('SEO analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform SEO analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve existing analysis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('seo_analysis')
      .select('*')
      .eq('post_id', postId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          analysis: null,
          message: 'No SEO analysis found for this post',
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      analysis: data,
    });

  } catch (error) {
    console.error('Error fetching SEO analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SEO analysis' },
      { status: 500 }
    );
  }
}