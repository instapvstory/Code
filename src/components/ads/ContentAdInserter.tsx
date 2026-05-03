'use client';

import { useEffect, useState } from 'react';
import AdInserter from './AdInserter';

interface ContentAdInserterProps {
  content: string;
  categoryId?: string;
  tagIds?: string[];
  adFrequency?: number; // Insert ad after every N paragraphs
  className?: string;
  hideAds?: boolean;
}

export default function ContentAdInserter({
  content,
  categoryId,
  tagIds = [],
  adFrequency = 3,
  className = '',
  hideAds = false
}: ContentAdInserterProps) {
  const [processedContent, setProcessedContent] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    // Split content into paragraphs
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    const processed: React.ReactNode[] = [];
    
    paragraphs.forEach((paragraph, index) => {
      // Add the paragraph
      processed.push(
        <div 
          key={`para-${index}`}
          className="content-paragraph mb-4"
          dangerouslySetInnerHTML={{ __html: paragraph.replace(/\n/g, '<br />') }}
        />
      );

      // Insert ad after specified number of paragraphs
      if (!hideAds && (index + 1) % adFrequency === 0 && index < paragraphs.length - 1) {
        const adPlacement = `after_p${index + 1}`;
        processed.push(
          <div key={`ad-${index}`} className="my-8">
            <AdInserter
              placement={adPlacement}
              categoryId={categoryId}
              tagIds={tagIds}
              fallbackContent={
                <div className="ad-placeholder text-center py-4 px-6 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                  <span className="text-sm text-gray-500">Advertisement</span>
                </div>
              }
            />
          </div>
        );
      }
    });

    setProcessedContent(processed);
  }, [content, categoryId, tagIds, adFrequency, hideAds]);

  return (
    <div className={`content-with-ads ${className}`}>
      {hideAds ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <>
          {/* Ad before content */}
          {!hideAds && (
            <div className="mb-8">
              <AdInserter
                placement="before_content"
                categoryId={categoryId}
                tagIds={tagIds}
                fallbackContent={
                  <div className="ad-placeholder text-center py-4 px-6 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                    <span className="text-sm text-gray-500">Advertisement</span>
                  </div>
                }
              />
            </div>
          )}

          {/* Processed content with ads */}
          {processedContent}

          {/* Ad after content */}
          {!hideAds && (
            <div className="mt-8">
              <AdInserter
                placement="after_content"
                categoryId={categoryId}
                tagIds={tagIds}
                fallbackContent={
                  <div className="ad-placeholder text-center py-4 px-6 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                    <span className="text-sm text-gray-500">Advertisement</span>
                  </div>
                }
              />
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .content-with-ads {
          line-height: 1.7;
        }
        .content-paragraph {
          font-size: 16px;
          color: #374151;
        }
        .content-paragraph :global(p) {
          margin-bottom: 1rem;
        }
        .content-paragraph :global(h1),
        .content-paragraph :global(h2),
        .content-paragraph :global(h3),
        .content-paragraph :global(h4) {
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          font-weight: 600;
          color: #111827;
        }
        .content-paragraph :global(h1) {
          font-size: 1.875rem;
        }
        .content-paragraph :global(h2) {
          font-size: 1.5rem;
        }
        .content-paragraph :global(h3) {
          font-size: 1.25rem;
        }
        .content-paragraph :global(ul),
        .content-paragraph :global(ol) {
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .content-paragraph :global(li) {
          margin-bottom: 0.5rem;
        }
        .content-paragraph :global(a) {
          color: #3b82f6;
          text-decoration: underline;
        }
        .content-paragraph :global(a:hover) {
          color: #2563eb;
        }
        .ad-placeholder {
          min-height: 90px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        @media (max-width: 768px) {
          .content-paragraph {
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  );
}