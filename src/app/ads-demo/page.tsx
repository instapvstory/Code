import AdInserter from '@/components/ads/AdInserter';
import ContentAdInserter from '@/components/ads/ContentAdInserter';

export default function AdsDemoPage() {
  const sampleContent = `
    <h1>Understanding Modern Web Development</h1>
    
    <p>Web development has evolved significantly over the past decade. From simple static HTML pages to complex single-page applications, the landscape continues to change rapidly.</p>
    
    <p>One of the most significant shifts has been the move towards component-based architectures. Frameworks like React, Vue, and Angular have revolutionized how we build user interfaces.</p>
    
    <h2>The Rise of JavaScript Frameworks</h2>
    
    <p>JavaScript frameworks have become essential tools for modern web developers. They provide structure, efficiency, and maintainability to complex applications.</p>
    
    <p>React, developed by Facebook, introduced the concept of virtual DOM and component reusability. This approach has been widely adopted across the industry.</p>
    
    <p>Vue.js offers a progressive framework that can be adopted incrementally. Its gentle learning curve makes it popular among beginners and experts alike.</p>
    
    <h2>Server-Side Rendering and Next.js</h2>
    
    <p>Next.js has emerged as a leading framework for React applications, offering server-side rendering, static site generation, and API routes out of the box.</p>
    
    <p>This approach improves SEO performance and provides better user experience through faster initial page loads.</p>
    
    <p>The framework's file-based routing system simplifies navigation and makes code organization more intuitive.</p>
    
    <h2>Conclusion</h2>
    
    <p>Modern web development continues to evolve, with new tools and techniques emerging regularly. Staying current with these changes is essential for any web developer.</p>
    
    <p>By understanding the core principles and keeping up with industry trends, developers can build better, faster, and more maintainable web applications.</p>
  `;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Ad Inserter Demo</h1>
      <p className="text-gray-600 mb-8">
        This page demonstrates the ad inserter system for Google AdSense and other ad networks.
        Ads can be inserted anywhere on the site or within content.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Ad Examples */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Content with Automatic Ad Insertion</h2>
            <div className="prose max-w-none">
              <ContentAdInserter
                content={sampleContent}
                adFrequency={2}
                className="mt-4"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Individual Ad Placements</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Header Ad</h3>
                <AdInserter 
                  placement="header"
                  className="border border-gray-200 rounded p-4"
                />
              </div>

              <div>
                <h3 className="font-medium mb-2">Sidebar Ad</h3>
                <AdInserter 
                  placement="sidebar"
                  className="border border-gray-200 rounded p-4"
                />
              </div>

              <div>
                <h3 className="font-medium mb-2">Footer Ad</h3>
                <AdInserter 
                  placement="footer"
                  className="border border-gray-200 rounded p-4"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Documentation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Ad Inserter Documentation</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-blue-600">AdInserter Component</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Use this component to insert ads anywhere in your site:
                </p>
                <pre className="bg-gray-50 p-3 rounded text-xs mt-2 overflow-x-auto">
{`<AdInserter
  placement="after_content"
  categoryId="category-uuid"
  tagIds={["tag1-uuid", "tag2-uuid"]}
  device="desktop"
/>`}
                </pre>
              </div>

              <div>
                <h3 className="font-medium text-blue-600">ContentAdInserter Component</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Automatically inserts ads between paragraphs in content:
                </p>
                <pre className="bg-gray-50 p-3 rounded text-xs mt-2 overflow-x-auto">
{`<ContentAdInserter
  content={htmlContent}
  categoryId="category-uuid"
  adFrequency={3}
/>`}
                </pre>
              </div>

              <div>
                <h3 className="font-medium text-blue-600">Available Placements</h3>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  <li>• header - Site header</li>
                  <li>• footer - Site footer</li>
                  <li>• sidebar - Sidebar area</li>
                  <li>• before_content - Before article</li>
                  <li>• after_content - After article</li>
                  <li>• after_p1, after_p2, etc. - After specific paragraphs</li>
                  <li>• between_blocks - Between content blocks</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-blue-600">Ad Types Supported</h3>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  <li>• adsense - Google AdSense</li>
                  <li>• custom - Custom HTML ads</li>
                  <li>• html - HTML banner ads</li>
                  <li>• script - JavaScript-based ads</li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium text-green-600">Admin Panel</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Manage ads from the admin dashboard at <code>/admin/ads</code>
                </p>
                <a 
                  href="/admin/ads"
                  className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Go to Ad Management
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">How It Works</h3>
        <ul className="text-blue-700 space-y-2">
          <li>• Ads are stored in the database with targeting options (category, tags, devices)</li>
          <li>• The AdInserter component fetches relevant ads based on placement and context</li>
          <li>• Ad views and clicks are automatically tracked for analytics</li>
          <li>• Ads can be scheduled with start/end dates and impression limits</li>
          <li>• Multiple ad networks supported (AdSense, custom HTML, scripts, etc.)</li>
        </ul>
      </div>
    </div>
  );
}