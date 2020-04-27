import * as jsondiff from 'json0-ot-diff';
import * as sharedb from 'sharedb/lib/client';

import { Button, Icon, Toolbar } from './components';
import {
  Editable,
  RenderElementProps,
  RenderLeafProps,
  Slate,
  useSlate,
  withReact,
} from 'slate-react';
import { Editor, Node, Range, Transforms, createEditor } from 'slate';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import isHotkey from 'is-hotkey';
import { withCollab } from './with-collab';
import { withHistory } from 'slate-history';

const ws_client = new WebSocket('ws://localhost:9080');
const connection = new sharedb.Connection(ws_client);
const doc = connection.get('my_documents', 'hello_world');

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
} as Record<string, string>;

const LIST_TYPES = ['numbered-list', 'bulleted-list'];

type OTValue = {
  value: Node[];
  selection: Range | null;
};

const RichTextExample = () => {
  useEffect(() => {
    doc.subscribe(() => {
      console.log('Subscribed:');
      console.log(doc.data);
      syncMutex.current = true;
      setValue(doc.data.value as Node[]);
      syncMutex.current = false;
    });

    doc.on('op', () => {
      console.log('Op:');
      console.log(doc.data);
      syncMutex.current = true;
      editor.selection = doc.data.selection;
      setValue(doc.data.value as Node[]);
      syncMutex.current = false;
    });
  }, []);

  const [value, setValue] = useState<Node[]>(initialValue);
  const oldValue = useRef<OTValue>();
  const oldSelection = useRef<Range | null>({
    anchor: { path: [0, 0], offset: 0 },
    focus: { path: [0, 0], offset: 0 },
  });
  // const [value, setValue] = useState([])
  const renderElement = useCallback(
    (props: RenderElementProps) => <Element {...props} />,
    []
  );
  const renderLeaf = useCallback(
    (props: RenderLeafProps) => <Leaf {...props} />,
    []
  );
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  // See also: https://github.com/ianstormtaylor/slate/issues/3493
  const syncMutex = useRef(false); // prevents infinite loops due to onchange firing
  const sendOp = (...args: any[]) => {
    return new Promise((resolve, _reject) => {
      // @ts-ignore
      doc.submitOp(...args, () => {
        resolve();
      });
    });
  };

  return (
    <Slate
      editor={editor}
      value={value}
      onChange={(newValue) => {
        // setValue(newValue);
        oldValue.current = { selection: oldSelection.current, value: value };
        const diff = jsondiff(oldValue, {
          selection: editor.selection,
          value: newValue,
        });
        oldSelection.current = editor.selection;
        if (!syncMutex.current) {
          // a quick optimisation to only send if array is not empty
          if (Array.isArray(diff) && diff.length) {
            console.log('diff:');
            console.log(diff);
            sendOp(diff);
          }
        }
      }}>
      <Toolbar>
        <MarkButton format="bold" icon="format_bold" />
        <MarkButton format="italic" icon="format_italic" />
        <MarkButton format="underline" icon="format_underlined" />
        <MarkButton format="code" icon="code" />
        <BlockButton format="heading-one" icon="looks_one" />
        <BlockButton format="heading-two" icon="looks_two" />
        <BlockButton format="block-quote" icon="format_quote" />
        <BlockButton format="numbered-list" icon="format_list_numbered" />
        <BlockButton format="bulleted-list" icon="format_list_bulleted" />
      </Toolbar>
      <Editable
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        placeholder="Enter some rich text…"
        spellCheck
        autoFocus
        onKeyDown={(event) => {
          for (const hotkey in HOTKEYS) {
            // @ts-ignore
            if (isHotkey(hotkey)(event)) {
              event.preventDefault();
              const mark = HOTKEYS[hotkey];
              toggleMark(editor, mark);
            }
          }
        }}
      />
    </Slate>
  );
};

const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) => LIST_TYPES.includes(n.type),
    split: true,
  });

  Transforms.setNodes(editor, {
    type: isActive ? 'paragraph' : isList ? 'list-item' : format,
  });

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isBlockActive = (editor: Editor, format: string) => {
  const [match] = Editor.nodes(editor, {
    match: (n) => n.type === format,
  });

  return !!match;
};

const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const Element = ({ attributes, children, element }: RenderElementProps) => {
  switch (element.type) {
    case 'block-quote':
      return <blockquote {...attributes}>{children}</blockquote>;
    case 'bulleted-list':
      return <ul {...attributes}>{children}</ul>;
    case 'heading-one':
      return <h1 {...attributes}>{children}</h1>;
    case 'heading-two':
      return <h2 {...attributes}>{children}</h2>;
    case 'list-item':
      return <li {...attributes}>{children}</li>;
    case 'numbered-list':
      return <ol {...attributes}>{children}</ol>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  if (leaf.bold) {
    children = <strong {...attributes}>{children}</strong>;
  }

  if (leaf.code) {
    children = <code {...attributes}>{children}</code>;
  }

  if (leaf.italic) {
    children = <em {...attributes}>{children}</em>;
  }

  if (leaf.underline) {
    children = <u {...attributes}>{children}</u>;
  }

  return <span {...attributes}>{children}</span>;
};

type BlockButtonProps = {
  format: string;
  icon: string;
};

const BlockButton = ({ format, icon }: BlockButtonProps) => {
  const editor = useSlate();
  return (
    <Button
      active={isBlockActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleBlock(editor, format);
      }}>
      <Icon>{icon}</Icon>
    </Button>
  );
};

type MarkButtonProps = BlockButtonProps;

const MarkButton = ({ format, icon }: MarkButtonProps) => {
  const editor = useSlate();
  return (
    <Button
      active={isMarkActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleMark(editor, format);
      }}>
      <Icon>{icon}</Icon>
    </Button>
  );
};

// Empty placeholder for initial load, editor will fetch ground truth from server
const initialValue = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

export default RichTextExample;
