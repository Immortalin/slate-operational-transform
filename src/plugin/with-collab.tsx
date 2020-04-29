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
  const e: CollabEditor & T = {
    ...editor,
    doc: new ShareDB.Connection(webSocket).get(collectionName, documentId),
    syncMutex: false,
  }
  const { apply } = e

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

    const { type } = slateOp
    if (type === 'insert_text') {
      const { path, offset, text } = slateOp
      const json1Op = [json1.editOp(CollabEditor.pathToJson1Path(path), 'text-unicode', [offset, text])]
      // return sendOp(json1Op)
    }
    apply(slateOp)
  }

  return e
}

// Empty placeholder for initial load, editor will fetch ground truth from server
