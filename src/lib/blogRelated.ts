/**
 * Topical authority internal link map.
 * Each slug maps to 3 related post slugs that are topically relevant.
 * This drives both the "Related Reading" in-article section and
 * Google's understanding of site topical clusters.
 */
export const relatedPostsMap: Record<string, string[]> = {
  'how-to-view-instagram-stories-anonymously': [
    'how-instagram-story-views-work',
    'instagram-business-vs-creator-vs-personal-account',
    'instagram-seen-receipts-browse-without-leaving-trace',
  ],
  'protecting-your-privacy-on-instagram': [
    'instagram-data-collection-what-does-instagram-know',
    'instagram-seen-receipts-browse-without-leaving-trace',
    'how-to-view-instagram-stories-anonymously',
  ],
  'benefits-of-anonymous-competitor-research': [
    'instagram-competitor-research-guide-for-marketers',
    'influencer-vetting-guide-brand-partnerships',
    'how-to-view-instagram-stories-anonymously',
  ],
  'instagram-business-vs-creator-vs-personal-account': [
    'how-instagram-story-views-work',
    'how-to-view-instagram-stories-anonymously',
    'instagram-highlights-explained',
  ],
  'how-instagram-story-views-work': [
    'how-to-view-instagram-stories-anonymously',
    'instagram-seen-receipts-browse-without-leaving-trace',
    'instagram-highlights-explained',
  ],
  'is-it-legal-to-view-public-instagram-profiles': [
    'ethics-of-viewing-public-social-media-content',
    'how-to-view-instagram-stories-anonymously',
    'protecting-your-privacy-on-instagram',
  ],
  'instagram-competitor-research-guide-for-marketers': [
    'benefits-of-anonymous-competitor-research',
    'influencer-vetting-guide-brand-partnerships',
    'understanding-instagram-algorithm-public-posts',
  ],
  'parents-guide-monitoring-public-instagram-accounts': [
    'how-to-view-instagram-stories-anonymously',
    'instagram-highlights-explained',
    'is-it-legal-to-view-public-instagram-profiles',
  ],
  'instagram-research-methods-for-academics': [
    'is-it-legal-to-view-public-instagram-profiles',
    'ethics-of-viewing-public-social-media-content',
    'research-instagram-trends-without-account',
  ],
  'instagram-seen-receipts-browse-without-leaving-trace': [
    'how-instagram-story-views-work',
    'protecting-your-privacy-on-instagram',
    'how-to-view-instagram-stories-anonymously',
  ],
  'understanding-instagram-algorithm-public-posts': [
    'instagram-competitor-research-guide-for-marketers',
    'instagram-business-vs-creator-vs-personal-account',
    'research-instagram-trends-without-account',
  ],
  'influencer-vetting-guide-brand-partnerships': [
    'instagram-competitor-research-guide-for-marketers',
    'benefits-of-anonymous-competitor-research',
    'understanding-instagram-algorithm-public-posts',
  ],
  'ethics-of-viewing-public-social-media-content': [
    'is-it-legal-to-view-public-instagram-profiles',
    'protecting-your-privacy-on-instagram',
    'instagram-research-methods-for-academics',
  ],
  'research-instagram-trends-without-account': [
    'instagram-competitor-research-guide-for-marketers',
    'understanding-instagram-algorithm-public-posts',
    'how-to-view-instagram-stories-anonymously',
  ],
  'instagram-highlights-explained': [
    'how-instagram-story-views-work',
    'instagram-seen-receipts-browse-without-leaving-trace',
    'instagram-business-vs-creator-vs-personal-account',
  ],
  'instagram-data-collection-what-does-instagram-know': [
    'protecting-your-privacy-on-instagram',
    'instagram-seen-receipts-browse-without-leaving-trace',
    'ethics-of-viewing-public-social-media-content',
  ],
};
