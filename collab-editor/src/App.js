import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import isHotkey from 'is-hotkey'
import { Editable, withReact, useSlate, Slate } from 'slate-react'
import { Editor, Transforms, Text, createEditor } from 'slate'
import { withHistory } from 'slate-history'

import { Button, Icon, Toolbar } from './Components'
import ReconnectingWebSocket from 'reconnecting-websocket';
import * as sharedb from 'sharedb/lib/client'
import * as jsondiff from 'json0-ot-diff'
import { css } from 'emotion'

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
  useEffect(() => {
    doc.subscribe(() => {
      console.log("Subscribed:")
      console.log(doc.data)
      myId.current = Math.max(...Object.keys(doc.data.users))
      current_users.current = doc.data.users
      console.log("My ID:")
      console.log(myId.current)
      console.log("Total users:")
      console.log(current_users.current)
      syncMutex.current = true
      setValue(doc.data.children)
      syncMutex.current = false
    })

    doc.on('op', () => {
      console.log("Op:")
      console.log(doc.data)
      syncMutex.current = true
      // editor.selection = doc.data.selection
      setValue(doc.data.children)
      syncMutex.current = false
    })

  }, [])


  const [value, setValue] = useState(initialValue)
  const oldValue = useRef()
  const myId = useRef()
  // const users = useRef()
  // const oldSelection = useRef({ anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: 0 } })
  const current_users = useRef([])
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

  const decorate = useCallback(([node, path]) => {
    let ranges = []
    console.log(path)
    if (current_users.current.length !== 0 && Text.isText(node)) {
      // code needs refactoring, current code seems inefficient
      const selections = Object.values(doc.data.users).filter((entry) => !entry.hasOwnProperty("placeholder") && entry.hasOwnProperty("anchor") && entry.hasOwnProperty("focus"))
      // selections.forEach((entry) => {
      //     console.log(entry)
      //   if (entry.anchor.path === path || entry.focus.path === path) {
      //     ranges.push(entry)
      //   }
      // })
      console.log("decorating..")
      // console.log(current_selections.current)
      // console.log(doc.data.users)

      //  if (Text.isText(node)){}

      // console.log(ranges)
      ranges = selections
    }
    return ranges
  }, [current_users.current])

  return (
    <Slate editor={editor} value={value} onChange={newChildren => {
      oldValue.current = { users: current_users.current, children: value }
      if (typeof doc.data !== 'undefined') {
        doc.data.users[myId.current.toString()] = { ...editor.selection, is_selected: true }
        // current_users.current = doc.data.users
        // console.log(current_users.current)
        const diff = jsondiff(oldValue, { users: doc.data.users, children: newChildren })

        if (!syncMutex.current) {
          // a quick optimisation to only send if array is not empty
          if (Array.isArray(diff) && diff.length) {
            console.log("diff:")
            console.log(diff)
            sendOp(diff)
          }
        }
      }
      // oldSelection.current = editor.selection
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
        decorate={decorate}
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

const mystyle = {
  borderColor: 'red',
  padding: '5px',
}

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.is_selected) {
    console.log("I AM SELECTED!!!")
    children =
      <span
        {...attributes}
        className={css`
        background-color: ${leaf.is_selected && '#ffeeba'};
      `}
      >
        {children}
        <span style={mystyle}></span>
      </span>
  }

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

// Empty placeholder for initial load, editor will fetch ground truth from server
const initialValue = [
  {
    type: 'paragraph',
    children: [{ text: '' }]
  }
]

export default RichTextExample