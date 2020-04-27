import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import isHotkey from 'is-hotkey'
import { Editable, withReact, useSlate, Slate } from 'slate-react'
import { Editor, Transforms, createEditor } from 'slate'
import { withHistory } from 'slate-history'

import { Button, Icon, Toolbar } from './Components'
import ReconnectingWebSocket from 'reconnecting-websocket';
import * as sharedb from 'sharedb/lib/client'
import * as jsondiff from 'json0-ot-diff'

const ws_client = new ReconnectingWebSocket("ws://localhost:9080")
const connection = new sharedb.Connection(ws_client)
const doc = connection.get('my_documents', 'hello_world')

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
}

const LIST_TYPES = ['numbered-list', 'bulleted-list']

const RichTextExample = () => {
  // const [transmitQueue, enQueue] = useState([])
  // const [oldValue, setOldValue] = useState()
  const oldValue = useRef()
  useEffect(() => {
    doc.subscribe(() => {
      console.log("Subscribed:")
      console.log(doc.data)
      syncMutex.current = true
      // editor.selection = doc.data.selection
      setValue(doc.data.children)
      syncMutex.current = false
    })

    doc.on('op', () => {
      console.log("Op:")
      console.log(doc.data)
      syncMutex.current = true
      editor.selection = doc.data.selection
      setValue(doc.data.children)
      syncMutex.current = false
    })

  }, [])

  // useEffect(() => {
  //   ws_client.onmessage = msg => {
  //     // console.log(msg.data)
  //     const ops = JSON.parse(msg.data)

  //     // ops.forEach(op => {
  //     //   console.log("Received:")
  //     //   console.log(op)
  //     //   editor.apply(op)
  //     // });
  //     syncMutex.current = true
  //     Editor.withoutNormalizing(editor, () => {
  //       ops.forEach(op => {
  //         console.log("Received:")
  //         console.log(op)
  //         editor.apply(op)
  //       });
  //     })
  //     syncMutex.current = true
  //   }
  // })



  const [value, setValue] = useState(initialValue)
  const oldSelection = useRef({ anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: 0 } })
  // const [value, setValue] = useState([])
  const renderElement = useCallback(props => <Element {...props} />, [])
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])
  // See also: https://github.com/ianstormtaylor/slate/issues/3493
  const syncMutex = useRef(false) // prevents infinite loops due to onchange firing
  const sendOp = (...args) => {
    return new Promise((resolve, reject) => {
      doc.submitOp(...args, () => {
        resolve()
      })
    })
  }

  return (
    <Slate editor={editor} value={value} onChange={newChildren => {
      oldValue.current = { selection: oldSelection.current, children: value }
      const diff = jsondiff(oldValue, { selection: editor.selection, children: newChildren })
      // setValue(newValue)
      oldSelection.current = editor.selection
      if (oldValue !== undefined) {
      }
      // console.log(editor.value)
      if (!syncMutex.current) {
        // if (diff.length > 0) {
        if (Array.isArray(diff) && diff.length) {
          console.log("diff:")
          console.log(diff)
          sendOp(diff)
        }
        // ws_client.send(JSON.stringify(editor.operations))
        // ws_client.send(JSON.stringify(editor.operations.filter((op) => op.type !== "set_selection")))
      }
    }
    }>
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
            if (isHotkey(hotkey, event)) {
              event.preventDefault()
              const mark = HOTKEYS[hotkey]
              toggleMark(editor, mark)
            }
          }
        }}
      />
    </Slate>
  )
}

const toggleBlock = (editor, format) => {
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

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format)

  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

const isBlockActive = (editor, format) => {
  const [match] = Editor.nodes(editor, {
    match: n => n.type === format,
  })

  return !!match
}

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor)
  return marks ? marks[format] === true : false
}

const Element = ({ attributes, children, element }) => {
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

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.code) {
    children = <code>{children}</code>
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.underline) {
    children = <u>{children}</u>
  }

  return <span {...attributes}>{children}</span>
}

const BlockButton = ({ format, icon }) => {
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

const MarkButton = ({ format, icon }) => {
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

const initialValue = [
  {
    type: 'paragraph',
    children: [{ text: '' }]
  }

  // {
  //   type: 'paragraph',
  //   children: [
  //     { text: 'This is editable ' },
  //     { text: 'rich', bold: true },
  //     { text: ' text, ' },
  //     { text: 'much', italic: true },
  //     { text: ' better than a ' },
  //     { text: '<textarea>', code: true },
  //     { text: '!' },
  //   ],
  // },
  // {
  //   type: 'paragraph',
  //   children: [
  //     {
  //       text:
  //         "Since it's rich text, you can do things like turn a selection of text ",
  //     },
  //     { text: 'bold', bold: true },
  //     {
  //       text:
  //         ', or add a semantically rendered block quote in the middle of the page, like this:',
  //     },
  //   ],
  // },
  // {
  //   type: 'block-quote',
  //   children: [{ text: 'A wise quote.' }],
  // },
  // {
  //   type: 'paragraph',
  //   children: [{ text: 'Try it out for yourself!' }],
  // },
]

export default RichTextExample