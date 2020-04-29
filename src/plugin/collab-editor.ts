import { Path, Editor } from 'slate'
import sharedb from 'sharedb'

export interface CollabEditor extends Editor {
  doc: sharedb.Doc
  syncMutex: boolean
}

export const CollabEditor = {
  pathToJson1Path: (path: Path) => {
    let json1Path: Array<string | number> = ['value']
    for (let i = 0; i < path.length; i++) {
      const p = path[i]
      json1Path = json1Path.concat(i === 0 ? [p] : ['children', p])
    }
    return json1Path
  },
}
