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

// ShareDB does not have types
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

    // TODO: Selection is not handled correctly
    switch (slateOp.type) {
      case 'insert_text':
        const { path, offset, text } = slateOp
        const inserTextJson1Op = [
          json1.editOp(CollabEditor.pathToJson1Path(path).concat(['text']), 'text-unicode', [offset, text]),
        ]
        return e.doc.data && sendOp(inserTextJson1Op)
      case 'insert_node':
      case 'move_node':
      case 'remove_node':
      case 'remove_text':
      case 'set_node':
      case 'set_selection':
      case 'merge_node':
      case 'split_node':
        console.log('before transform:', draftEditor.children?.[0]?.children, draftEditor.selection)
        Editor.transform(draftEditor, slateOp)
        console.log('after transform:', draftEditor.children?.[0]?.children, draftEditor.selection)
        const json1Op = [
          json1.replaceOp(['value'], editor.children, draftEditor.children),
          json1.replaceOp(['selection'], editor.selection, draftEditor.selection),
        ]
        return e.doc.data && sendOp(json1Op)
    }
  }

  return e
}
