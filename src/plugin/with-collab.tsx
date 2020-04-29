import * as Sharedb from 'sharedb/lib/client'

import { CollabEditor } from './collab-editor'
import { Editor } from 'slate'
import { ReactEditor } from 'slate-react'
import json1 from 'ot-json1'
import * as WS from 'ws'

type CollabConfig = {
  collectionName: string
  documentId: string
  webSocket: WebSocket | WS
}

export const withCollab = <T extends Editor & ReactEditor>(editor: T, config: CollabConfig) => {
  const e = editor as T & CollabEditor
  const { apply } = e

  const { collectionName, documentId, webSocket } = config
  e.doc = new Sharedb.Connection(webSocket).get(collectionName, documentId)

  const sendOp = (ops: json1.JSONOp[]) => {
    // Ignore: @types/sharedb does not allow different OTType in submitOp
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

    const { type } = slateOp
    if (type === 'insert_text') {
      const { path, offset, text } = slateOp
      const json1Op = [json1.editOp(CollabEditor.pathToJson1Path(path), 'text-unicode', [offset, text])]
      return sendOp(json1Op)
    }
    apply(slateOp)
  }

  return e
}

// Empty placeholder for initial load, editor will fetch ground truth from server
