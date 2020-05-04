import * as ShareDB from 'sharedb/lib/client'

import { CollabEditor } from './collab-editor'
import { Editor, Node, Path, Text } from 'slate'
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

    apply(slateOp)

    if (e.doc.data) {
      switch (slateOp.type) {
        case 'insert_node': {
          const { path, node } = slateOp
          const insertNodeJson1Op = [json1.insertOp(CollabEditor.pathToJson1Path(path), node)]
          sendOp(insertNodeJson1Op)
          break
        }
        case 'insert_text': {
          const { path, offset, text } = slateOp
          const inserTextJson1Op = [
            json1.editOp(CollabEditor.pathToJson1Path(path).concat(['text']), 'text-unicode', [offset, text]),
          ]
          sendOp(inserTextJson1Op)
          break
        }
        case 'merge_node': {
          const { path } = slateOp
          const node = Node.get(editor, path)
          const prevPath = Path.previous(path)
          const prev = Node.get(editor, prevPath)
          let mergeNodeJson1Op: json1.JSONOp[] = []
          if (Text.isText(node) && Text.isText(prev)) {
            mergeNodeJson1Op.push(
              json1.editOp(CollabEditor.pathToJson1Path(prevPath).concat(['text']), 'text-unicode', [
                prev.text.length,
                node.text,
              ])
            )
          } else if (!Text.isText(node) && !Text.isText(prev)) {
            mergeNodeJson1Op.push(
              json1.insertOp(
                CollabEditor.pathToJson1Path(prevPath).concat(['children', prev.children.length]),
                node.children
              )
            )
          }
          mergeNodeJson1Op.push(json1.removeOp(CollabEditor.pathToJson1Path(path)))
          console.log(slateOp.type, mergeNodeJson1Op)
          sendOp(mergeNodeJson1Op)
          break
        }
        case 'move_node': {
          const { path, newPath } = slateOp
          const moveNodeJson1Op = [
            json1.moveOp(CollabEditor.pathToJson1Path(path), CollabEditor.pathToJson1Path(newPath)),
          ]
          console.log('move_node', moveNodeJson1Op)
          sendOp(moveNodeJson1Op)
          break
        }
        case 'remove_node': {
          const { path } = slateOp
          const removeNodeJson1Op = [json1.removeOp(CollabEditor.pathToJson1Path(path))]
          console.log('remove_node', removeNodeJson1Op)
          sendOp(removeNodeJson1Op)
          break
        }
        case 'remove_text': {
          const { path, offset, text } = slateOp
          const removeTextJson1Op = [
            json1.editOp(CollabEditor.pathToJson1Path(path).concat(['text']), 'text-unicode', [
              offset,
              { d: text.length },
            ]),
          ]
          console.log('remove_text', removeTextJson1Op)
          sendOp(removeTextJson1Op)
          break
        }
        case 'set_node': {
          const { path, newProperties } = slateOp
          const json1Path = CollabEditor.pathToJson1Path(path)
          const setNodeJson1Op = Object.keys(newProperties).map(key => {
            const value = newProperties[key]
            return value === null
              ? json1.removeOp(json1Path.concat([key]))
              : json1.insertOp(json1Path.concat([key]), value)
          })
          console.log('set_node', setNodeJson1Op)
          sendOp(setNodeJson1Op)
          break
        }
        case 'set_selection': {
          const { newProperties } = slateOp
          const setSelectionJson1Op = [json1.replaceOp(['selection'], editor.selection, newProperties)]
          console.log('set_selection', setSelectionJson1Op)
          return e.doc.data && sendOp(setSelectionJson1Op)
        }
        case 'split_node':
          const { path, position, properties } = slateOp

          const node = Node.get(editor, path)

          let newPath = path.map((p, i) => (i === path.length - 1 ? p + 1 : p))

          let splitNodeJson1Op: json1.JSONOp[] = []
          if (Text.isText(node)) {
            const textBefore = node.text.slice(0, position)
            const textAfter = node.text.slice(position)
            const newNode = {
              ...node,
              text: textBefore,
            }
            const splitNode = {
              ...newNode,
              ...(properties as Partial<Text>),
              text: textAfter,
            }
            console.log('splitNode - text', { textBefore, textAfter, splitNode })

            splitNodeJson1Op.push(json1.insertOp(CollabEditor.pathToJson1Path(newPath), splitNode))
          } else {
            const nodesBefore = node.children.slice(0, position)
            const nodesAfter = node.children.slice(position)
            const newNode = {
              ...node,
              children: nodesBefore,
            }
            const splitNode = {
              ...newNode,
              ...(properties as Partial<Element>),
              children: nodesAfter.length === 0 ? [{ text: '' }] : nodesAfter,
            }

            console.log('splitNode - element', { nodesBefore, nodesAfter, splitNode })

            splitNodeJson1Op.push(json1.insertOp(CollabEditor.pathToJson1Path(newPath), splitNode))
          }

          console.log(slateOp.type, splitNodeJson1Op)
          sendOp(splitNodeJson1Op)
          break
      }
    }
  }

  return e
}
