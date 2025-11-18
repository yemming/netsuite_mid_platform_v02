'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { useCallback, useEffect, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      TextStyle,
      Color,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
      },
    },
  }, [mounted]);

  // 當 value 改變時更新編輯器內容
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const addTable = useCallback(() => {
    if (!editor) return;
    
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const addRowBefore = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().addRowBefore().run();
  }, [editor]);

  const addRowAfter = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().addRowAfter().run();
  }, [editor]);

  const deleteRow = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().deleteRow().run();
  }, [editor]);

  const addColumnBefore = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().addColumnBefore().run();
  }, [editor]);

  const addColumnAfter = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().addColumnAfter().run();
  }, [editor]);

  const deleteColumn = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().deleteColumn().run();
  }, [editor]);

  const deleteTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().deleteTable().run();
  }, [editor]);

  const mergeCells = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().mergeCells().run();
  }, [editor]);

  const splitCell = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().splitCell().run();
  }, [editor]);

  const setColor = useCallback((color: string) => {
    if (!editor) return;
    editor.chain().focus().setColor(color).run();
    setShowColorPicker(false);
  }, [editor]);

  const colors = [
    '#000000', '#d32f2f', '#1976d2', '#388e3c', '#f57c00',
    '#7b1fa2', '#c2185b', '#0288d1', '#00796b', '#fbc02d',
    '#5d4037', '#455a64', '#e64a19', '#303f9f', '#007a3d',
  ];

  if (!mounted || !editor) {
    return (
      <div className={className}>
        <div className="border border-input rounded-md p-4 min-h-[300px] bg-background">
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="border border-input rounded-md">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-input bg-muted/50">
          {/* Text Formatting */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-accent ${editor.isActive('bold') ? 'bg-accent' : ''}`}
            title="粗體"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-accent ${editor.isActive('italic') ? 'bg-accent' : ''}`}
            title="斜體"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-accent ${editor.isActive('underline') ? 'bg-accent' : ''}`}
            title="底線"
          >
            <u>U</u>
          </button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          {/* Color Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 rounded hover:bg-accent"
              title="文字顏色"
            >
              <span style={{ color: editor.getAttributes('textStyle').color || '#000000' }}>A</span>
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-background border border-input rounded-md shadow-lg z-50">
                <div className="grid grid-cols-5 gap-1">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setColor(color)}
                      className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  onChange={(e) => setColor(e.target.value)}
                  className="mt-2 w-full h-8 cursor-pointer"
                  title="自訂顏色"
                />
              </div>
            )}
          </div>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          {/* Lists */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-accent ${editor.isActive('bulletList') ? 'bg-accent' : ''}`}
            title="項目符號"
          >
            •
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-accent ${editor.isActive('orderedList') ? 'bg-accent' : ''}`}
            title="編號清單"
          >
            1.
          </button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          {/* Table Controls */}
          <button
            type="button"
            onClick={addTable}
            className="p-2 rounded hover:bg-accent"
            title="插入表格"
          >
            ⧉
          </button>
          <button
            type="button"
            onClick={addRowBefore}
            className="p-2 rounded hover:bg-accent"
            title="在上方插入列"
          >
            ⬆
          </button>
          <button
            type="button"
            onClick={addRowAfter}
            className="p-2 rounded hover:bg-accent"
            title="在下方插入列"
          >
            ⬇
          </button>
          <button
            type="button"
            onClick={deleteRow}
            className="p-2 rounded hover:bg-accent"
            title="刪除列"
          >
            🗑
          </button>
          <button
            type="button"
            onClick={addColumnBefore}
            className="p-2 rounded hover:bg-accent"
            title="在左側插入欄"
          >
            ⬅
          </button>
          <button
            type="button"
            onClick={addColumnAfter}
            className="p-2 rounded hover:bg-accent"
            title="在右側插入欄"
          >
            ➡
          </button>
          <button
            type="button"
            onClick={deleteColumn}
            className="p-2 rounded hover:bg-accent"
            title="刪除欄"
          >
            🗑
          </button>
          <button
            type="button"
            onClick={mergeCells}
            className="p-2 rounded hover:bg-accent"
            title="合併儲存格"
          >
            ⧈
          </button>
          <button
            type="button"
            onClick={splitCell}
            className="p-2 rounded hover:bg-accent"
            title="分割儲存格"
          >
            ⧇
          </button>
          <button
            type="button"
            onClick={deleteTable}
            className="p-2 rounded hover:bg-accent"
            title="刪除表格"
          >
            ✕
          </button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          {/* Link & Image */}
          <button
            type="button"
            onClick={() => {
              const url = window.prompt('請輸入連結網址：');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            className={`p-2 rounded hover:bg-accent ${editor.isActive('link') ? 'bg-accent' : ''}`}
            title="插入連結"
          >
            🔗
          </button>
          <button
            type="button"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const base64 = event.target?.result as string;
                    editor.chain().focus().setImage({ src: base64, alt: '圖片' }).run();
                  };
                  reader.readAsDataURL(file);
                }
              };
              input.click();
            }}
            className="p-2 rounded hover:bg-accent"
            title="插入圖片"
          >
            🖼
          </button>
        </div>
        
        {/* Editor */}
        <EditorContent editor={editor} />
      </div>
      
      <style jsx global>{`
        .ProseMirror {
          outline: none;
          min-height: 300px;
        }
        .ProseMirror table {
          border-collapse: collapse;
          margin: 0;
          overflow: hidden;
          table-layout: fixed;
          width: 100%;
        }
        .ProseMirror table td,
        .ProseMirror table th {
          border: 1px solid #000;
          box-sizing: border-box;
          min-width: 1em;
          padding: 8px;
          position: relative;
          vertical-align: top;
        }
        .ProseMirror table th {
          background-color: #f0f0f0;
          font-weight: 600;
        }
        .ProseMirror table .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(200, 200, 255, 0.4);
          pointer-events: none;
        }
        .ProseMirror table .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: -2px;
          width: 4px;
          background-color: #adf;
          pointer-events: none;
        }
        .ProseMirror table p {
          margin: 0;
        }
      `}</style>
    </div>
  );
}
