# Blog CMS Admin Dashboard - Rich Text Editor Implementation Plan

## Overview
This document details the implementation of an advanced block-based rich text editor for the Blog CMS Admin Dashboard, combining the best features of Notion, Medium, and WordPress Gutenberg.

## Editor Architecture

### 1. Core Editor Stack
```
┌─────────────────────────────────────┐
│         Editor Interface            │
├─────────────────────────────────────┤
│      TipTap Editor Core             │
│  (ProseMirror + Extensions)         │
├─────────────────────────────────────┤
│      Custom Block System            │
│  (Drag & Drop, Nested Blocks)       │
├─────────────────────────────────────┤
│      State Management               │
│  (React Query + Zustand)            │
└─────────────────────────────────────┘
```

### 2. Technology Stack
- **Editor Core**: TipTap 2.0 (ProseMirror-based)
- **React Integration**: `@tiptap/react`
- **Extensions**: Custom extensions for block system
- **Drag & Drop**: `@atlaskit/pragmatic-drag-and-drop`
- **Syntax Highlighting**: `prismjs`
- **Image Upload**: Custom upload handler with compression
- **Video Embed**: `react-player` integration
- **Markdown Support**: `turndown` + `remark`

## Editor Features Implementation

### 1. Block System Architecture

#### Block Types Definition
```typescript
interface EditorBlock {
  id: string;
  type: BlockType;
  content: any;
  attributes?: Record<string, any>;
  children?: EditorBlock[];
  parentId?: string;
  position: number;
}

type BlockType = 
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'video'
  | 'code'
  | 'quote'
  | 'list'
  | 'button'
  | 'table'
  | 'divider'
  | 'columns'
  | 'callout'
  | 'embed';
```

#### Block Registry System
```typescript
class BlockRegistry {
  private blocks: Map<BlockType, BlockDefinition> = new Map();
  
  register(definition: BlockDefinition): void {
    this.blocks.set(definition.type, definition);
  }
  
  getBlock(type: BlockType): BlockDefinition {
    const block = this.blocks.get(type);
    if (!block) {
      throw new Error(`Block type ${type} not registered`);
    }
    return block;
  }
  
  getAllBlocks(): BlockDefinition[] {
    return Array.from(this.blocks.values());
  }
}

interface BlockDefinition {
  type: BlockType;
  name: string;
  icon: React.ReactNode;
  component: React.ComponentType<BlockProps>;
  schema: ProseMirrorNodeSpec;
  serializer: (node: ProseMirrorNode) => EditorBlock;
  deserializer: (block: EditorBlock) => ProseMirrorNode;
  defaultAttributes?: Record<string, any>;
}
```

### 2. Editor Components Structure

#### Main Editor Component
```typescript
const RichTextEditor: React.FC<EditorProps> = ({
  content,
  onChange,
  onSave,
  autoSaveInterval = 30000,
  readOnly = false
}) => {
  const [editor] = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      // Custom block extensions
      HeadingBlockExtension,
      ImageBlockExtension,
      VideoBlockExtension,
      // Formatting extensions
      Bold,
      Italic,
      Underline,
      Strike,
      Link,
      Highlight,
      // Utility extensions
      History,
      Placeholder.configure({
        placeholder: 'Start writing or type / for commands...'
      })
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange(json);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px]',
        'data-testid': 'editor-content'
      }
    }
  });
  
  return (
    <div className="editor-container">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
      <EditorSidebar editor={editor} />
      <EditorStatusBar editor={editor} />
    </div>
  );
};
```

#### Editor Toolbar Component
```typescript
const EditorToolbar: React.FC<ToolbarProps> = ({ editor }) => {
  if (!editor) return null;
  
  return (
    <div className="editor-toolbar">
      {/* Block type selector */}
      <BlockTypeSelector editor={editor} />
      
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        icon={<BoldIcon />}
        tooltip="Bold (Ctrl+B)"
      />
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        icon={<ItalicIcon />}
        tooltip="Italic (Ctrl+I)"
      />
      
      {/* More formatting buttons */}
      <Divider />
      
      {/* Insert block buttons */}
      <InsertBlockMenu editor={editor} />
    </div>
  );
};
```

### 3. Block Components Implementation

#### Heading Block
```typescript
const HeadingBlock: React.FC<BlockProps> = ({
  node,
  editor,
  updateAttributes
}) => {
  const level = node.attrs.level || 1;
  const content = node.content;
  
  const handleLevelChange = (newLevel: number) => {
    updateAttributes({ level: newLevel });
  };
  
  return (
    <div className="heading-block" data-level={level}>
      <div className="block-toolbar">
        <LevelSelector
          currentLevel={level}
          onChange={handleLevelChange}
        />
        <BlockActions node={node} editor={editor} />
      </div>
      
      {level === 1 && (
        <h1 className="text-4xl font-bold">
          <NodeViewContent />
        </h1>
      )}
      {level === 2 && (
        <h2 className="text-3xl font-bold">
          <NodeViewContent />
        </h2>
      )}
      {/* More heading levels */}
    </div>
  );
};
```

#### Image Block
```typescript
const ImageBlock: React.FC<BlockProps> = ({
  node,
  editor,
  updateAttributes
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(node.attrs.src);
  
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await uploadImage(file, {
        optimize: true,
        convertToWebP: true,
        maxWidth: 1920
      });
      
      updateAttributes({
        src: result.url,
        alt: result.altText || file.name,
        width: result.width,
        height: result.height
      });
      
      setPreviewUrl(result.url);
    } catch (error) {
      showToast('Image upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="image-block">
      <div className="block-toolbar">
        <ImageUploadButton onUpload={handleFileUpload} />
        <ImageSettings
          alt={node.attrs.alt}
          caption={node.attrs.caption}
          onAltChange={(alt) => updateAttributes({ alt })}
          onCaptionChange={(caption) => updateAttributes({ caption })}
        />
        <BlockActions node={node} editor={editor} />
      </div>
      
      <div className="image-container">
        {isUploading ? (
          <div className="uploading-overlay">
            <Spinner />
            <span>Uploading...</span>
          </div>
        ) : (
          <img
            src={previewUrl}
            alt={node.attrs.alt}
            className="rounded-lg shadow-md"
          />
        )}
        
        {node.attrs.caption && (
          <figcaption className="text-center text-gray-600 mt-2">
            {node.attrs.caption}
          </figcaption>
        )}
      </div>
    </div>
  );
};
```

#### Code Block
```typescript
const CodeBlock: React.FC<BlockProps> = ({
  node,
  editor,
  updateAttributes
}) => {
  const [language, setLanguage] = useState(node.attrs.language || 'javascript');
  const code = node.textContent;
  
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    updateAttributes({ language: newLanguage });
  };
  
  const highlightedCode = useMemo(() => {
    return Prism.highlight(
      code,
      Prism.languages[language] || Prism.languages.javascript,
      language
    );
  }, [code, language]);
  
  return (
    <div className="code-block">
      <div className="block-toolbar">
        <LanguageSelector
          currentLanguage={language}
          onChange={handleLanguageChange}
        />
        <CopyButton code={code} />
        <BlockActions node={node} editor={editor} />
      </div>
      
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code
          className={`language-${language}`}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </pre>
    </div>
  );
};
```

### 4. Drag & Drop Implementation

#### Drag Handle Component
```typescript
const DragHandle: React.FC<DragHandleProps> = ({ nodeId, editor }) => {
  const dragRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const el = dragRef.current;
    if (!el) return;
    
    const dragState = makeDraggable({
      element: el,
      getInitialData: () => ({
        type: 'block',
        blockId: nodeId,
        editorId: editor.options.element.id
      }),
      onDragStart: () => {
        el.classList.add('dragging');
      },
      onDrop: () => {
        el.classList.remove('dragging');
      }
    });
    
    return () => dragState.abort();
  }, [nodeId, editor]);
  
  return (
    <div
      ref={dragRef}
      className="drag-handle"
      data-testid={`drag-handle-${nodeId}`}
    >
      <DragIcon />
    </div>
  );
};
```

#### Drop Zone Component
```typescript
const DropZone: React.FC<DropZoneProps> = ({ editor, targetPosition }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  useEffect(() => {
    const el = editor.view.dom;
    
    const dropTarget = makeDropTarget({
      element: el,
      onDragEnter: () => setIsDraggingOver(true),
      onDragLeave: () => setIsDraggingOver(false),
      onDrop: (event) => {
        setIsDraggingOver(false);
        const data = event.source.data;
        
        if (data.type === 'block' && data.editorId === editor.options.element.id) {
          // Move block to new position
          moveBlock(editor, data.blockId, targetPosition);
        }
      }
    });
    
    return () => dropTarget.abort();
  }, [editor, targetPosition]);
  
  return (
    <div
      className={`drop-zone ${isDraggingOver ? 'dragging-over' : ''}`}
      data-position={targetPosition}
    />
  );
};
```

### 5. Auto-save System

#### Auto-save Manager
```typescript
class AutoSaveManager {
  private timer: NodeJS.Timeout | null = null;
  private lastSaveTime: number = 0;
  private isSaving: boolean = false;
  
  constructor(
    private saveFn: (content: any) => Promise<void>,
    private interval: number = 30000,
    private onSaveSuccess?: () => void,
    private onSaveError?: (error: Error) => void
  ) {}
  
  start(content: any): void {
    this.stop();
    
    this.timer = setInterval(() => {
      this.save(content);
    }, this.interval);
    
    // Initial save
    this.save(content);
  }
  
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  
  async save(content: any): Promise<void> {
    if (this.isSaving) return;
    
    const now = Date.now();
    if (now - this.lastSaveTime < 1000) {
      // Throttle saves to at most once per second
      return;
    }
    
    this.isSaving = true;
    
    try {
      await this.saveFn(content);
      this.lastSaveTime = Date.now();
      this.onSaveSuccess?.();
    } catch (error) {
      this.onSaveError?.(error as Error);
    } finally {
      this.isSaving = false;
    }
  }
  
  forceSave(content: any): Promise<void> {
    return this.save(content);
  }
}
```

#### Auto-save Indicator
```typescript
const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  lastSaved,
  isSaving,
  error
}) => {
  const [timeAgo, setTimeAgo] = useState('');
  
  useEffect(() => {
    const updateTime = () => {
      if (!lastSaved) {
        setTimeAgo('Never saved');
        return;
      }
      
      const seconds = Math.floor((Date.now() - lastSaved) / 1000);
      
      if (seconds < 60) {
        setTimeAgo('Just now');
      } else if (seconds < 3600) {
        setTimeAgo(`${Math.floor(seconds / 60)} minutes ago`);
      } else if (seconds < 86400) {
        setTimeAgo(`${Math.floor(seconds / 3600)} hours ago`);
      } else {
        setTimeAgo(`${Math.floor(seconds / 86400)} days ago`);
      }
    };
    
    updateTime();
    const interval = setInterval(updateTime, 30000);
    
    return () => clearInterval(interval);
  }, [lastSaved]);
  
  return (
    <div className="auto-save-indicator">
      {isSaving ? (
        <div className="saving">
          <Spinner size="sm" />
          <span>Saving...</span>
        </div>
      ) : error ? (
        <div className="error">
          <AlertIcon />
          <span>Save failed. Retrying...</span>
        </div>
      ) : (
        <div className="saved">
          <CheckIcon />
          <span>Saved {timeAgo}</span>
        </div>
      )}
    </div>
  );
};
```

### 6. Markdown Support

#### Markdown Import/Export
```typescript
class MarkdownConverter {
  private turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });
  
  private remark = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeStringify);
  
  // Convert TipTap JSON to Markdown
  toMarkdown(doc: any): string {
    // Convert TipTap JSON to HTML
    const html = this.tiptapToHtml(doc);
    // Convert HTML to Markdown
    return this.turndown.turndown(html);
  }
  
  // Convert Markdown to TipTap JSON
  async fromMarkdown(markdown: string): Promise<any> {
    // Convert Markdown to HTML
    const html = await this.remark.process(markdown);
    // Convert HTML to TipTap JSON
    return this.htmlToTiptap(html.toString());
  }
  
  private tiptapToHtml(doc: any): string {
    // Implementation using TipTap's HTML serializer
  }
  
  private htmlToTiptap(html: string): any {
    // Implementation using TipTap's HTML parser
  }
}
```

### 7. Keyboard Shortcuts

#### Shortcut Manager
```typescript
class KeyboardShortcutManager {
  private shortcuts: Map<string, ShortcutHandler> = new Map();
  
  register(shortcut: string, handler: ShortcutHandler): void {
    this.shortcuts.set(this.normalizeShortcut(shortcut), handler);
  }
  
  handleKeyDown(event: KeyboardEvent, editor: Editor): boolean {
    const shortcut = this.getShortcutString(event);
    
    if (this.shortcuts.has(shortcut)) {
      event.preventDefault();
      const handler = this.shortcuts.get(shortcut)!;
      handler(event, editor);
      return true;
    }
    
    return false;
  }
  
  private getShortcutString(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    
    parts.push(event.key.toUpperCase());
    
    return parts.join('+');
  }
}

// Default shortcuts
const DEFAULT_SHORTCUTS = [
  { key: 'Ctrl+B', action: 'toggleBold' },
  { key: 'Ctrl+I', action: 'toggleItalic' },
  { key: 'Ctrl+U', action: 'toggleUnderline' },
  { key: 'Ctrl+K', action: 'toggleLink' },
  { key: 'Ctrl+S', action: 'save' },
  { key: 'Ctrl+Z', action: 'undo' },
  { key: 'Ctrl+Shift+Z', action: 'redo' },
  { key: 'Ctrl+/', action: 'showKeyboardShortcuts' }
];
```

### 8. Image Optimization Pipeline

#### Image Processing Service
```typescript
class ImageProcessingService {
  async processImage(file: File, options: ImageOptions): Promise<ProcessedImage> {
    // 1. Validate file
    this.validateImage(file);
    
    // 2. Create preview
    const preview = await this.createPreview(file);
    
    // 3. Optimize image
    const optimized = await this.optimizeImage(file, options);
    
    // 4. Generate WebP version
    const webp = await this.convertToWebP(optimized);
    
    // 5. Upload to CDN
    const uploadResult = await this.uploadToCDN(webp);
    
    return {
      original: file,
      preview: preview.url,
      optimized: optimized.url,
      webp: webp.url,
      cdnUrl: uploadResult.url,
      metadata: {
        width: optimized.width,
        height: optimized.height,
        size: optimized.size,
        format: webp.format
      }
    };
  }
  
  private async optimizeImage(file: File, options: ImageOptions): Promise<OptimizedImage> {
    // Implement image compression
    // Resize if needed
    // Adjust quality
  }
  
  private async convertToWebP(image: OptimizedImage): Promise<WebPImage> {
    // Convert to WebP format
    // Maintain transparency
  }
}
```

### 9. Editor State Management

#### Editor Store (Zustand)
```typescript
interface EditorStore {
  // State
  content: any;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: number | null;
  selectedBlockId: string | null;
  
  // Actions
  setContent: (content: any) => void;
  markAsDirty: () => void;
  markAsSaved: () => void;
  setSaving: (saving: boolean) => void;
  selectBlock: (blockId: string | null) => void;
  updateBlock: (blockId: string, attributes: any) => void;
  moveBlock: (blockId: string, newPosition: number) => void;
  deleteBlock: (blockId: string) => void;
}

const useEditorStore = create<EditorStore>((set, get) => ({
  content: null,
  isDirty: false,
  isSaving: false,
  lastSaved: null,
  selectedBlockId: null,
  
  setContent: (content) => set({ content, isDirty: true }),
  
  markAsDirty: () => set({ isDirty: true }),
  
  markAsSaved: () => set({ 
    isDirty: false, 
    lastSaved: Date.now(),
    isSaving: false 
  }),
  
  setSaving: (saving) => set({ isSaving: saving }),
  
  selectBlock: (blockId) => set({ selectedBlockId: blockId }),
  
  updateBlock: (blockId, attributes) => {
    const { content } = get();
    const updated = updateBlockInContent(content, blockId, attributes);
    set({ content: updated, isDirty: true });
  },
  
  moveBlock: (blockId, newPosition) => {
    const { content } = get();
    const updated = moveBlockInContent(content, blockId, newPosition);
    set({ content: updated, isDirty: true });
  },
  
  deleteBlock: (blockId) => {
    const { content } = get();
    const updated = deleteBlockFromContent(content, blockId);
    set({ content: updated, isDirty: true });
  }
}));
```

### 10. Editor Extensions System

#### Custom Extension Registry
```typescript
class ExtensionRegistry {
  private extensions: Map<string, Extension> = new Map();
  
  register(name: string, extension: Extension): void {
    this.extensions.set(name, extension);
  }
  
  getExtension(name: string): Extension {
    const extension = this.extensions.get(name);
    if (!extension) {
      throw new Error(`Extension ${name} not found`);
    }
    return extension;
  }
  
  getAllExtensions(): Extension[] {
    return Array.from(this.extensions.values());
  }
  
  // Register default extensions
  registerDefaults(): void {
    this.register('heading', HeadingExtension);
    this.register('image', ImageExtension);
    this.register('code', CodeExtension);
    this.register('table', TableExtension);
    this.register('columns', ColumnsExtension);
  }
}
```

### 11. Performance Optimization

#### Lazy Loading Blocks
```typescript
const LazyBlockLoader: React.FC<LazyBlockLoaderProps> = ({ blockType, ...props }) => {
  const BlockComponent = useMemo(() => {
    return lazy(() => import(`./blocks/${blockType}Block`));
  }, [blockType]);
  
  return (
    <Suspense fallback={<BlockSkeleton type={blockType} />}>
      <BlockComponent {...props} />
    </Suspense>
  );
};
```

#### Virtualized Block List
```typescript
const VirtualizedEditor: React.FC<VirtualizedEditorProps> = ({ blocks }) => {
  const rowVirtualizer = useVirtualizer({
    count: blocks.length,
    getScrollElement: () => document.querySelector('.editor-scroll-container'),
    estimateSize: () => 100,
    overscan: 5
  });
  
  return (
    <div className="editor-scroll-container">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative'
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            <BlockRenderer block={blocks[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 12. Testing Strategy

#### Editor Test Suite
```typescript
describe('RichTextEditor', () => {
  test('renders empty editor', () => {
    render(<RichTextEditor content={null} onChange={jest.fn()} />);
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
  });
  
  test('handles text input', async () => {
    const onChange = jest.fn();
    render(<RichTextEditor content={null} onChange={onChange} />);
    
    const editor = screen.getByTestId('editor-content');
    await userEvent.type(editor, 'Hello World');
    
    expect(onChange).toHaveBeenCalled();
  });
  
  test('inserts image block', async () => {
    // Test image block insertion
  });
  
  test('supports drag and drop', async () => {
    // Test block reordering
  });
  
  test('auto-saves content', async () => {
    // Test auto-save functionality
  });
});
```

### 13. Implementation Timeline

#### Week 1: Core Editor Setup
- TipTap editor integration
- Basic text editing
- Toolbar implementation
- State management setup

#### Week 2: Block System Foundation
- Block registry system
- Heading and paragraph blocks
- Basic formatting
- Markdown import/export

#### Week 3: Advanced Blocks
- Image block with upload
- Code block with syntax highlighting
- Quote and list blocks
- Table block

#### Week 4: Editor Enhancements
- Drag & drop implementation
- Auto-save system
- Keyboard shortcuts
- Block settings sidebar

#### Week 5: Media & Embed Blocks
- Video embed block
- Social media embeds
- Custom embed blocks
- Media optimization pipeline

#### Week 6: Advanced Features
- Nested blocks support
- Columns layout
- Callout blocks
- Revision history

#### Week 7: Performance & Polish
- Lazy loading blocks
- Virtualized rendering
- Performance optimization
- Mobile responsiveness

#### Week 8: Testing & Documentation
- Unit and integration tests
- E2E testing
- User documentation
- Performance benchmarking

### 14. Success Metrics

#### Editor Performance
- Time to first render: < 500ms
- Block insertion time: < 100ms
- Auto-save success rate: > 99.9%
- Memory usage: < 100MB for 10k words

#### User Experience
- Editor responsiveness: < 50ms latency
- Image upload success: > 99%
- Markdown conversion accuracy: > 99.5%
- User satisfaction: > 4.5/5

#### Development Metrics
- Code coverage: > 90%
- Bundle size: < 500KB gzipped
- Load time: < 2 seconds
- Accessibility score: 100%

## Conclusion
This comprehensive rich text editor implementation plan provides a robust framework for building a modern, block-based editor that combines the best features of leading content editing platforms. By following this plan, we'll create an editor that empowers content creators with powerful tools while maintaining excellent performance and user experience.