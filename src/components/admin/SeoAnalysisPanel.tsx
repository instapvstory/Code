'use client';

import { useState, useEffect } from 'react';
import styles from './SeoAnalysisPanel.module.css';

interface SeoAnalysisData {
  focusKeyword?: string;
  seoScore: number;
  readabilityScore: number;
  wordCount: number;
  headingCount: number;
  imageCount: number;
  internalLinkCount: number;
  externalLinkCount: number;
  keywordAnalysis: {
    keywordInTitle: boolean;
    keywordInMetaDescription: boolean;
    keywordInFirstParagraph: boolean;
    keywordInUrl: boolean;
    keywordInH1: boolean;
    keywordInH2: boolean;
    keywordDensity: string | number;
  };
  nlpEntities: {
    people: string[];
    organizations: string[];
    locations: string[];
    dates: string[];
    products: string[];
    concepts: string[];
  };
  semanticTopics: string[];
  eeatScores: {
    experience: number;
    expertise: number;
    authoritativeness: number;
    trustworthiness: number;
    overall: number;
  };
  internalLinkingSuggestions: Array<{
    postId: string;
    title: string;
    relevance: number;
  }>;
  recommendations: string[];
  warnings: string[];
  improvements: string[];
  lastAnalyzedAt?: string;
}

interface SeoAnalysisPanelProps {
  postId?: string;
  title: string;
  content: string;
  metaDescription: string;
  slug: string;
  onAnalysisUpdate?: (analysis: SeoAnalysisData) => void;
}

export default function SeoAnalysisPanel({
  postId,
  title,
  content,
  metaDescription,
  slug,
  onAnalysisUpdate,
}: SeoAnalysisPanelProps) {
  const [focusKeyword, setFocusKeyword] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SeoAnalysisData | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Load existing analysis on mount
  useEffect(() => {
    if (postId) {
      loadExistingAnalysis();
    }
  }, [postId]);

  const loadExistingAnalysis = async () => {
    try {
      const response = await fetch(`/api/admin/seo/analyze?postId=${postId}`);
      const data = await response.json();
      
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
        if (data.analysis.focus_keyword) {
          setFocusKeyword(data.analysis.focus_keyword);
        }
        if (onAnalysisUpdate) {
          onAnalysisUpdate(data.analysis);
        }
      }
    } catch (error) {
      console.error('Error loading SEO analysis:', error);
    }
  };

  const performAnalysis = async () => {
    if (!content.trim()) {
      alert('Please add some content before analyzing SEO');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/admin/seo/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          title,
          content,
          metaDescription,
          focusKeyword,
          slug,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.analysis);
        if (onAnalysisUpdate) {
          onAnalysisUpdate(data.analysis);
        }
      } else {
        alert('SEO analysis failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('SEO analysis error:', error);
      alert('Failed to perform SEO analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Needs Improvement';
    return 'Poor';
  };

  const renderScoreCircle = (score: number, label: string, size = 'medium') => {
    const color = getScoreColor(score);
    const circleSize = size === 'large' ? 120 : 80;
    const strokeWidth = size === 'large' ? 10 : 8;
    const radius = (circleSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className={styles.scoreCircleContainer}>
        <svg width={circleSize} height={circleSize} className={styles.scoreCircle}>
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${circleSize / 2} ${circleSize / 2})`}
          />
          <text
            x="50%"
            y="45%"
            textAnchor="middle"
            className={styles.scoreText}
            fontSize={size === 'large' ? '24' : '20'}
            fontWeight="bold"
            fill={color}
          >
            {score}
          </text>
          <text
            x="50%"
            y="60%"
            textAnchor="middle"
            className={styles.scoreLabel}
            fontSize={size === 'large' ? '14' : '12'}
            fill="#6b7280"
          >
            {label}
          </text>
        </svg>
      </div>
    );
  };

  const renderKeywordChecklist = () => {
    if (!analysis?.keywordAnalysis) return null;

    const checks = [
      { label: 'In Title', value: analysis.keywordAnalysis.keywordInTitle },
      { label: 'In Meta Description', value: analysis.keywordAnalysis.keywordInMetaDescription },
      { label: 'In First Paragraph', value: analysis.keywordAnalysis.keywordInFirstParagraph },
      { label: 'In URL', value: analysis.keywordAnalysis.keywordInUrl },
      { label: 'In H1', value: analysis.keywordAnalysis.keywordInH1 },
      { label: 'In H2', value: analysis.keywordAnalysis.keywordInH2 },
    ];

    return (
      <div className={styles.keywordChecklist}>
        <h4>Keyword Placement</h4>
        {checks.map((check, index) => (
          <div key={index} className={styles.checkItem}>
            <span className={check.value ? styles.checkGood : styles.checkBad}>
              {check.value ? '✓' : '✗'}
            </span>
            <span>{check.label}</span>
          </div>
        ))}
        {analysis.keywordAnalysis.keywordDensity && (
          <div className={styles.densityInfo}>
            <span>Keyword Density: </span>
            <strong>{analysis.keywordAnalysis.keywordDensity}%</strong>
          </div>
        )}
      </div>
    );
  };

  const renderRecommendations = () => {
    if (!analysis) return null;

    return (
      <div className={styles.recommendationsSection}>
        {analysis.warnings && analysis.warnings.length > 0 && (
          <div className={styles.recommendationGroup}>
            <h4 className={styles.warningTitle}>
              <span className={styles.warningIcon}>⚠️</span> Warnings
            </h4>
            <ul>
              {analysis.warnings.map((warning, index) => (
                <li key={index} className={styles.warningItem}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div className={styles.recommendationGroup}>
            <h4 className={styles.recommendationTitle}>
              <span className={styles.recommendationIcon}>✅</span> Recommendations
            </h4>
            <ul>
              {analysis.recommendations.map((rec, index) => (
                <li key={index} className={styles.recommendationItem}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {analysis.improvements && analysis.improvements.length > 0 && (
          <div className={styles.recommendationGroup}>
            <h4 className={styles.improvementTitle}>
              <span className={styles.improvementIcon}>💡</span> Improvements
            </h4>
            <ul>
              {analysis.improvements.map((improvement, index) => (
                <li key={index} className={styles.improvementItem}>{improvement}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderEeatScores = () => {
    if (!analysis?.eeatScores) return null;

    const eeatItems = [
      { label: 'Experience', score: analysis.eeatScores.experience },
      { label: 'Expertise', score: analysis.eeatScores.expertise },
      { label: 'Authoritativeness', score: analysis.eeatScores.authoritativeness },
      { label: 'Trustworthiness', score: analysis.eeatScores.trustworthiness },
    ];

    return (
      <div className={styles.eeatSection}>
        <h4>EEAT Scores</h4>
        <div className={styles.eeatGrid}>
          {eeatItems.map((item, index) => (
            <div key={index} className={styles.eeatItem}>
              <div className={styles.eeatLabel}>{item.label}</div>
              <div 
                className={styles.eeatScore}
                style={{ color: getScoreColor(item.score) }}
              >
                {item.score}
              </div>
              <div className={styles.eeatBar}>
                <div 
                  className={styles.eeatBarFill}
                  style={{ 
                    width: `${item.score}%`,
                    backgroundColor: getScoreColor(item.score)
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderNlpEntities = () => {
    if (!analysis?.nlpEntities) return null;

    const hasEntities = Object.values(analysis.nlpEntities).some(arr => arr.length > 0);
    if (!hasEntities) return null;

    return (
      <div className={styles.nlpSection}>
        <h4>NLP Entities Detected</h4>
        <div className={styles.nlpGrid}>
          {Object.entries(analysis.nlpEntities).map(([key, values]) => {
            if (values.length === 0) return null;
            return (
              <div key={key} className={styles.nlpCategory}>
                <div className={styles.nlpCategoryTitle}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </div>
                <div className={styles.nlpTags}>
                  {values.slice(0, 5).map((value, idx) => (
                    <span key={idx} className={styles.nlpTag}>
                      {value}
                    </span>
                  ))}
                  {values.length > 5 && (
                    <span className={styles.nlpMore}>+{values.length - 5} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>SEO Analysis</h3>
        <p className={styles.subtitle}>Get RankMath-like SEO insights for your content</p>
      </div>

      <div className={styles.controls}>
        <div className={styles.keywordInput}>
          <label htmlFor="focusKeyword">Focus Keyword</label>
          <input
            id="focusKeyword"
            type="text"
            placeholder="Enter primary keyword (e.g., 'SEO optimization')"
            value={focusKeyword}
            onChange={(e) => setFocusKeyword(e.target.value)}
            className={styles.keywordField}
          />
        </div>
        <button
          onClick={performAnalysis}
          disabled={isAnalyzing || !content.trim()}
          className={styles.analyzeButton}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze SEO'}
        </button>
        {analysis && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={styles.toggleDetailsButton}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        )}
      </div>

      {analysis && (
        <div className={styles.analysisResults}>
          {/* Main Scores */}
          <div className={styles.mainScores}>
            <div className={styles.scoreCard}>
              <h4>SEO Score</h4>
              {renderScoreCircle(analysis.seoScore, getScoreLabel(analysis.seoScore), 'large')}
              <div className={styles.scoreDescription}>
                {analysis.seoScore >= 80 
                  ? 'Excellent! Your content is well-optimized for SEO.'
                  : analysis.seoScore >= 60
                  ? 'Good, but there are areas for improvement.'
                  : 'Needs significant optimization for better search rankings.'}
              </div>
            </div>

            <div className={styles.scoreCard}>
              <h4>Readability</h4>
              {renderScoreCircle(analysis.readabilityScore, getScoreLabel(analysis.readabilityScore))}
              <div className={styles.scoreDescription}>
                {analysis.readabilityScore >= 80 
                  ? 'Very readable! Easy for users to understand.'
                  : analysis.readabilityScore >= 60
                  ? 'Moderately readable. Consider simplifying some sentences.'
                  : 'Difficult to read. Simplify language and sentence structure.'}
              </div>
            </div>

            <div className={styles.scoreCard}>
              <h4>Content Stats</h4>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{analysis.wordCount}</div>
                  <div className={styles.statLabel}>Words</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{analysis.headingCount}</div>
                  <div className={styles.statLabel}>Headings</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{analysis.imageCount}</div>
                  <div className={styles.statLabel}>Images</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{analysis.internalLinkCount}</div>
                  <div className={styles.statLabel}>Internal Links</div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Analysis (Collapsible) */}
          {showDetails && (
            <div className={styles.detailedAnalysis}>
              {/* Keyword Analysis */}
              {focusKeyword && renderKeywordChecklist()}

              {/* EEAT Scores */}
              {renderEeatScores()}

              {/* NLP Entities */}
              {renderNlpEntities()}

              {/* Semantic Topics */}
              {analysis.semanticTopics && analysis.semanticTopics.length > 0 && (
                <div className={styles.topicsSection}>
                  <h4>Semantic Topics</h4>
                  <div className={styles.topicsList}>
                    {analysis.semanticTopics.map((topic, index) => (
                      <span key={index} className={styles.topicTag}>
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Internal Linking Suggestions */}
              {analysis.internalLinkingSuggestions && analysis.internalLinkingSuggestions.length > 0 && (
                <div className={styles.linkingSection}>
                  <h4>Internal Linking Suggestions</h4>
                  <div className={styles.linkingList}>
                    {analysis.internalLinkingSuggestions.map((suggestion, index) => (
                      <div key={index} className={styles.linkingItem}>
                        <div className={styles.linkingTitle}>{suggestion.title}</div>
                        <div className={styles.linkingRelevance}>
                          Relevance: {suggestion.relevance}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {renderRecommendations()}

              {/* Last Analyzed */}
              {analysis.lastAnalyzedAt && (
                <div className={styles.lastAnalyzed}>
                  Last analyzed: {new Date(analysis.lastAnalyzedAt).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!analysis && (
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>📊</div>
          <h4>No SEO Analysis Yet</h4>
          <p>Enter your content and click "Analyze SEO" to get detailed SEO insights, keyword analysis, and optimization recommendations.</p>
          <div className={styles.placeholderTips}>
            <div className={styles.tip}>
              <strong>Focus Keyword:</strong> Enter your primary target keyword for better analysis
            </div>
            <div className={styles.tip}>
              <strong>Content Length:</strong> Aim for 1000+ words for comprehensive articles
            </div>
            <div className={styles.tip}>
              <strong>Readability:</strong> Use clear language and proper headings
            </div>
          </div>
        </div>
      )}
    </div>
  );
}