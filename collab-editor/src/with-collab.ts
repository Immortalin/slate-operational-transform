import { Editor } from 'slate';
import { ReactEditor } from 'slate-react';

export const withCollab = (editor: Editor & ReactEditor) => {
  const e = editor;
  const { apply } = e;

  e.apply = (op) => {
    console.log(op);
    apply(op);
  };

  return editor;
};
