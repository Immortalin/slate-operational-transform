import React, { FC, useEffect, useRef, useState } from 'react'
import { Node, Range } from 'slate'

import { CollabEditor } from '../plugin/collab-editor'
import { Slate, ReactEditor } from 'slate-react'

type SlateCollabProps = {
  [key: string]: any
  editor: CollabEditor & ReactEditor
  onChange?: (value: Node[]) => void
}

export const SlateCollab: FC<SlateCollabProps> = ({ editor, children, onChange }) => {
  const [value, setValue] = useState<Node[]>(initialValue)

  const oldSelection = useRef<Range | null>({
    anchor: { path: [0, 0], offset: 0 },
    focus: { path: [0, 0], offset: 0 },
  })

  useEffect(() => {
    const { doc } = editor
    doc.subscribe(() => {
      console.log('Subscribed:', doc.data)
      editor.syncMutex = true
      setValue(doc.data.value)
      editor.syncMutex = false
    })

    doc.on('op', () => {
      console.log('Op:', doc.data)
      editor.syncMutex = true
      editor.selection = doc.data.selection
      setValue(doc.data.value)
      editor.syncMutex = false
    })
  }, [])

  return (
    <Slate
      editor={editor}
      value={value}
      onChange={newValue => {
        oldSelection.current = editor.selection
        // setValue(newValue)
        onChange && onChange(newValue)
      }}
    >
      {children}
    </Slate>
  )
}

const initialValue = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
] as Node[]
