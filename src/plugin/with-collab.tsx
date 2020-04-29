import * as ShareDB from 'sharedb/lib/client'

import { CollabEditor } from './collab-editor'
import { Editor } from 'slate'
import { ReactEditor } from 'slate-react'
import json1 from 'ot-json1'

type CollabConfig = {
  collectionName: string
  documentId: string
  webSocket: WebSocket
}

// @ts-ignore
ShareDB.types.register(json1.type)

export const withCollab = <T extends Editor & ReactEditor>(editor: T, config: CollabConfig) => {
  const { collectionName, documentId, webSocket } = config

  const e = editor as T & CollabEditor
  const { apply } = e

  e.doc = new ShareDB.Connection(webSocket).get(collectionName, documentId)
  e.syncMutex = false

  const sendOp = (ops: json1.JSONOp[]) => {
    // TODO: @types/sharedb does not allow different OTType in submitOp
    // @ts-ignore
    e.doc.submitOp(ops)
  }

  /**
   * Overrides
   */

  e.apply = slateOp => {
    const { operations } = e
    const [editorNode] = Editor.node(e, [])
    operations.length === 0 && console.log('---', { value: editorNode.children })
    console.log('>', operations.length, slateOp)

    const draftEditor = { ...e }

    const { type } = slateOp

    // TODO: Selection is not handled correctly
    switch (type) {
      case 'insert_node':
      case 'insert_text':
      case 'move_node':
      case 'remove_node':
      case 'remove_text':
      case 'set_node':
      case 'merge_node':
      case 'split_node':
        console.log('before transform:', draftEditor.children?.[0]?.children)
        Editor.transform(draftEditor, slateOp)
        console.log('after transform:', draftEditor.children?.[0]?.children)
        const json1Op = [
          json1.replaceOp(['value'], editor.children, draftEditor.children),
          json1.replaceOp(['selection'], editor.selection, draftEditor.selection),
        ]
        return sendOp(json1Op)
    }
    apply(slateOp)
  }

  return e
}

// Empty placeholder for initial load, editor will fetch ground truth from server
