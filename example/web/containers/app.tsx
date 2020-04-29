import React, { useCallback, useMemo } from 'react'
import { Editor, Transforms, createEditor } from 'slate'
import { Editable, RenderElementProps, RenderLeafProps, useSlate, withReact } from 'slate-react'
import { withHistory } from 'slate-history'
import isHotkey from 'is-hotkey'

import { withCollab, SlateCollab } from '../../../src'

import { Button, Icon, Toolbar } from '../components'
import { cx, css } from 'emotion'

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
} as Record<string, string>

const LIST_TYPES = ['numbered-list', 'bulleted-list']

const RichTextExample = () => {
  const editor = useMemo(
    () =>
      withCollab(withHistory(withReact(createEditor())), {
        collectionName: 'my_documents',
        documentId: 'hello_world',
        webSocket: new WebSocket('ws://localhost:9080'),
      }),
    []
  )

  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, [])
  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, [])

  return (
    <SlateCollab editor={editor}>
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
        onKeyDown={event => {
          for (const hotkey in HOTKEYS) {
            // @ts-ignore
            if (isHotkey(hotkey)(event)) {
              event.preventDefault()
              const mark = HOTKEYS[hotkey]
              toggleMark(editor, mark)
            }
          }
        }}
        className={cx(css`
          padding: 1rem;
        `)}
      />
    </SlateCollab>
  )
}

const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(editor, format)
  const isList = LIST_TYPES.includes(format)

  Transforms.unwrapNodes(editor, {
    match: n => LIST_TYPES.includes(n.type),
    split: true,
  })

  Transforms.setNodes(editor, {
    type: isActive ? 'paragraph' : isList ? 'list-item' : format,
  })

  if (!isActive && isList) {
    const block = { type: format, children: [] }
    Transforms.wrapNodes(editor, block)
  }
}

const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format)

  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

const isBlockActive = (editor: Editor, format: string) => {
  const [match] = Editor.nodes(editor, {
    match: n => n.type === format,
  })

  return !!match
}

const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor)
  return marks ? marks[format] === true : false
}

const Element = ({ attributes, children, element }: RenderElementProps) => {
  switch (element.type) {
    case 'block-quote':
      return <blockquote {...attributes}>{children}</blockquote>
    case 'bulleted-list':
      return <ul {...attributes}>{children}</ul>
    case 'heading-one':
      return <h1 {...attributes}>{children}</h1>
    case 'heading-two':
      return <h2 {...attributes}>{children}</h2>
    case 'list-item':
      return <li {...attributes}>{children}</li>
    case 'numbered-list':
      return <ol {...attributes}>{children}</ol>
    default:
      return <p {...attributes}>{children}</p>
  }
}

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  if (leaf.bold) {
    children = <strong {...attributes}>{children}</strong>
  }

  if (leaf.code) {
    children = <code {...attributes}>{children}</code>
  }

  if (leaf.italic) {
    children = <em {...attributes}>{children}</em>
  }

  if (leaf.underline) {
    children = <u {...attributes}>{children}</u>
  }

  return <span {...attributes}>{children}</span>
}

type BlockButtonProps = {
  format: string
  icon: string
}

const BlockButton = ({ format, icon }: BlockButtonProps) => {
  const editor = useSlate()
  return (
    <Button
      active={isBlockActive(editor, format)}
      onMouseDown={event => {
        event.preventDefault()
        toggleBlock(editor, format)
      }}
    >
      <Icon>{icon}</Icon>
    </Button>
  )
}

type MarkButtonProps = BlockButtonProps

const MarkButton = ({ format, icon }: MarkButtonProps) => {
  const editor = useSlate()
  return (
    <Button
      active={isMarkActive(editor, format)}
      onMouseDown={event => {
        event.preventDefault()
        toggleMark(editor, format)
      }}
    >
      <Icon>{icon}</Icon>
    </Button>
  )
}

export default RichTextExample
