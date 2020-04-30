
import CursorComponent from './cursor';
import { Range } from 'slate';

const CursorIndicator = (options) => {

  const markName = options.markName || 'cursor';
  function addCursorIndicator(change) {
    change.operations.forEach((operation) => {
      if (operation.type === 'set_selection') {
        console.log('DONENENENENE ################################', markName)
        change.addMark(markName);
      }
    })
  }

  return {
      addCursorIndicator
  }
}

export const Cursor = CursorComponent;
export default CursorIndicator;