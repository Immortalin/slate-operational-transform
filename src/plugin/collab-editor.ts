import { Path } from 'slate'
import { ReactEditor } from 'slate-react'
import sharedb from 'sharedb'

export type CollabEditor = {
  doc: sharedb.Doc
  syncMutex: boolean
} & ReactEditor

export const CollabEditor = {
  pathToJson1Path: (path: Path) => {
    let json1Path: Array<string | number> = []
    for (let i = 0; i < path.length; i++) {
      const p = path[i]
      json1Path = json1Path.concat(['children', p])
    }
    return json1Path
  },
}
