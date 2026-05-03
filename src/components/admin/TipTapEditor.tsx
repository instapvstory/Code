'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, UnderlineIcon, Strikethrough, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Link2, ImageIcon, Heading1,
  Heading2, Heading3, Undo, Redo, Code, Quote,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface TipTapEditorProps {
  content: any;
  onChange: (json: any, html: string) => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        padding: '6px 8px',
        borderRadius: 6,
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active ? '#ede9fe' : 'transparent',
        color: active ? '#7c3aed' : '#475569',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 4px' }} />;
}

export default function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ allowBase64: true }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Start writing your post content here...' }),
    ],
    content: content || {},
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON(), editor.getHTML());
    },
    editorProps: {
      attributes: {
        style: 'min-height: 400px; outline: none; font-size: 15px; line-height: 1.7; color: #1e293b;',
        class: 'tiptap-editor',
      },
    },
  });

  if (!editor || !isClient) {
    // Render a placeholder during SSR
    return (
      <div style={{
        border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden',
        background: '#fff', minHeight: '400px'
      }}>
        <div style={{
          padding: '8px 12px', borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center',
          minHeight: '50px'
        }}>
          {/* Toolbar placeholder */}
        </div>
        <div style={{ padding: '16px', minHeight: '350px', background: '#f8fafc' }}>
          Loading editor...
        </div>
      </div>
    );
  }

  const addLink = () => {
    const url = window.prompt('Enter URL');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div style={{
      border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden',
      background: '#fff',
    }}>
      {/* Toolbar */}
      <div style={{
        padding: '8px 12px', borderBottom: '1px solid #e2e8f0',
        background: '#f8fafc', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center',
      }}>
        {/* History */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo size={15} />
        </ToolbarButton>

        <Divider />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        ><Heading1 size={15} /></ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        ><Heading2 size={15} /></ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        ><Heading3 size={15} /></ToolbarButton>

        <Divider />

        {/* Marks */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        ><Bold size={15} /></ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        ><Italic size={15} /></ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline"
        ><UnderlineIcon size={15} /></ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        ><Strikethrough size={15} /></ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="Inline Code"
        ><Code size={15} /></ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        ><List size={15} /></ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered List"
        ><ListOrdered size={15} /></ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Quote"
        ><Quote size={15} /></ToolbarButton>

        <Divider />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        ><AlignLeft size={15} /></ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        ><AlignCenter size={15} /></ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        ><AlignRight size={15} /></ToolbarButton>

        <Divider />

        {/* Media */}
        <ToolbarButton onClick={addLink} title="Insert Link" active={editor.isActive('link')}>
          <Link2 size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={addImage} title="Insert Image">
          <ImageIcon size={15} />
        </ToolbarButton>
      </div>

      {/* Editor Content */}
      <div style={{ padding: '16px 20px' }}>
        <EditorContent editor={editor} />
      </div>

      <style>{`
        .tiptap-editor h1 { font-size: 2em; font-weight: 700; margin: 0.5em 0; }
        .tiptap-editor h2 { font-size: 1.5em; font-weight: 700; margin: 0.5em 0; }
        .tiptap-editor h3 { font-size: 1.2em; font-weight: 700; margin: 0.5em 0; }
        .tiptap-editor p { margin: 0.5em 0; }
        .tiptap-editor ul, .tiptap-editor ol { margin: 0.5em 0 0.5em 1.5em; }
        .tiptap-editor li { margin: 0.25em 0; }
        .tiptap-editor blockquote { border-left: 3px solid #6366f1; padding-left: 16px; margin: 0.75em 0; color: #475569; font-style: italic; }
        .tiptap-editor code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
        .tiptap-editor pre { background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; overflow-x: auto; }
        .tiptap-editor a { color: #6366f1; text-decoration: underline; }
        .tiptap-editor img { max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; }
        .tiptap-editor p.is-empty:before { color: #94a3b8; content: attr(data-placeholder); float: left; height: 0; pointer-events: none; }
        .tiptap-editor:focus { outline: none; }
      `}</style>
    </div>
  );
}
