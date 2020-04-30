

const CursorIndicator = (options) => {

  const markName = options.markName || 'cursor';

  function addCursorIndicator(change) {
    change.operations.forEach((operation) => {
      if (operation.type === 'set_selection') {
        change.addMark(markName);
      }
    })
  }

  function removeCursorIndicator(change, node) {
    const { document, startKey } = change.value
    const startBlock = document.getClosestBlock(startKey)
    const parent = document.getParent(startBlock.key)
    const parentParent = document.getParent(parent.key)
    const index = parentParent.nodes.indexOf(parent)
    change.removeMarkByKey(parentParent.key, 0, index, markName)
  }

  return {
      addCursorIndicator,
      removeCursorIndicator
  }
}

module.exports = CursorIndicator;