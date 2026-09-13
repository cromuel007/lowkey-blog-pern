import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import Underline from "@tiptap/extension-underline";
import { Markdown } from "@tiptap/markdown";
import {
  Bold,
  Code,
  Italic,
  List,
  ListOrdered,
  Underline as UnderlineIcon,
} from "lucide-react";

export type TiptapEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  editorClassName?: string;
};

export default function TiptapEditor({
  value,
  onChange,
  disabled = false,
  placeholder = "Start writing...",
  ariaLabel,
  className = "",
  editorClassName = "",
}: TiptapEditorProps) {
  const [showCode, setShowCode] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Markdown,
      Placeholder.configure({
        placeholder,
      }),
    ],

    content: value || "",

    editable: !disabled,

    editorProps: {
      attributes: {
        role: "textbox",
        "aria-label":
          ariaLabel ?? placeholder ?? "Rich text editor",
        "aria-placeholder": placeholder ?? "",
        placeholder: placeholder ?? "",
      },
    },

    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },

    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor || showCode) {
      return;
    }

    const current = editor.getHTML();
    const next = value || "";

    if (current !== next) {
      editor.commands.setContent(next);
    }
  }, [value, editor, showCode]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) {
    return null;
  }

  const toggleCodeView = () => {
    if (showCode) {
      editor.commands.setContent(value || "");
    } else {
      onChange(editor.getHTML());
    }

    setShowCode((current) => !current);
  };

  const toolbarItems = [
    {
      label: "Bold",
      icon: Bold,
      active: editor.isActive("bold"),
      onClick: () =>
        editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      icon: Italic,
      active: editor.isActive("italic"),
      onClick: () =>
        editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Underline",
      icon: UnderlineIcon,
      active: editor.isActive("underline"),
      onClick: () =>
        editor.chain().focus().toggleUnderline().run(),
    },
    {
      label: "Bulleted list",
      icon: List,
      active: editor.isActive("bulletList"),
      onClick: () =>
        editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numbered list",
      icon: ListOrdered,
      active: editor.isActive("orderedList"),
      onClick: () =>
        editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Code block",
      icon: Code,
      active: editor.isActive("codeBlock"),
      onClick: () =>
        editor.chain().focus().toggleCodeBlock().run(),
    },
  ];

  return (
    <div
      className={`overflow-hidden rounded-[10px] border border-line bg-white text-sm ${className}`}
    >
      {!disabled && (
        <div className="flex flex-wrap items-center gap-1 border-b border-line bg-white px-2 py-1.5">
          {!showCode &&
            toolbarItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  title={item.label}
                  aria-label={item.label}
                  onClick={item.onClick}
                  className={`flex h-8 w-8 items-center justify-center rounded-md text-slate transition-colors hover:bg-surface-alt ${
                    item.active
                      ? "bg-accent-soft text-accent"
                      : ""
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}

          <div className="ml-auto">
            <button
              type="button"
              onClick={toggleCodeView}
              className={`flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors hover:bg-surface-alt ${
                showCode
                  ? "bg-accent-soft text-accent"
                  : "text-slate"
              }`}
              title={showCode ? "Visual editor" : "View HTML code"}
            >
              <Code className="h-4 w-4" />
              {showCode ? "Visual" : "Code"}
            </button>
          </div>
        </div>
      )}

      {showCode ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          aria-label={ariaLabel ?? "HTML code editor"}
          placeholder={placeholder}
          className={`
            min-h-[350px]
            w-full
            resize-y
            border-0
            bg-white
            px-4
            py-3
            font-mono
            text-sm
            leading-relaxed
            text-ink
            outline-none
            ${editorClassName}
          `}
        />
      ) : (
        <EditorContent
          editor={editor}
          className={`
            tiptap-editor
            min-h-[350px]
            px-4
            py-3
            text-base
            text-ink
            ${editorClassName}

            [&_.ProseMirror]:min-h-[326px]
            [&_.ProseMirror]:outline-none

            [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]

            [&_.ProseMirror_p]:my-2

            [&_.ProseMirror_ul]:my-2
            [&_.ProseMirror_ul]:list-disc
            [&_.ProseMirror_ul]:pl-6

            [&_.ProseMirror_ol]:my-2
            [&_.ProseMirror_ol]:list-decimal
            [&_.ProseMirror_ol]:pl-6

            [&_.ProseMirror_li]:pl-1

            [&_.ProseMirror_h1]:my-4
            [&_.ProseMirror_h1]:text-3xl
            [&_.ProseMirror_h1]:font-extrabold

            [&_.ProseMirror_h2]:my-3
            [&_.ProseMirror_h2]:text-2xl
            [&_.ProseMirror_h2]:font-bold

            [&_.ProseMirror_h3]:my-3
            [&_.ProseMirror_h3]:text-xl
            [&_.ProseMirror_h3]:font-bold

            [&_.ProseMirror_blockquote]:my-4
            [&_.ProseMirror_blockquote]:border-l-4
            [&_.ProseMirror_blockquote]:border-line
            [&_.ProseMirror_blockquote]:pl-4
            [&_.ProseMirror_blockquote]:italic
            [&_.ProseMirror_blockquote]:text-slate

            [&_.ProseMirror_code]:rounded
            [&_.ProseMirror_code]:bg-surface-alt
            [&_.ProseMirror_code]:px-1
            [&_.ProseMirror_code]:py-0.5
            [&_.ProseMirror_code]:font-mono
            [&_.ProseMirror_code]:text-sm
            [&_.ProseMirror_code]:text-ink

            [&_.ProseMirror_pre]:my-4
            [&_.ProseMirror_pre]:overflow-x-auto
            [&_.ProseMirror_pre]:rounded-lg
            [&_.ProseMirror_pre]:border
            [&_.ProseMirror_pre]:border-line
            [&_.ProseMirror_pre]:bg-surface-alt
            [&_.ProseMirror_pre]:p-4
            [&_.ProseMirror_pre]:font-mono
            [&_.ProseMirror_pre]:text-sm
            [&_.ProseMirror_pre]:leading-relaxed
            [&_.ProseMirror_pre]:text-ink

            [&_.ProseMirror_hr]:my-6
            [&_.ProseMirror_hr]:border-line
          `}
        />
      )}
    </div>
  );
}