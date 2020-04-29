# Slate Collab 

Slate plugin adding collaboration via JSON1 OT and ShareDB.

## Running Example

Need to `yarn link` both `react` and `react-dom` from root to `/example/web`.

Run web:

```shell
yarn
cd node_modules/react
yarn link
cd ../react-dom
yarn link
cd ../example/web
yarn
yarn link react
yarn link react-dom
yarn dev
```

Run server:

```shell
cd example/server 
yarn
yarn start
```

Open two different browsers and navigate to `localhost:3000`. All changes in one browser are mirrored in the other.

## Caveat Emptor

- This is a demo, there are a lot of optimizations and features missing.
- Invoking JSON0-ot-diff on every edit [is not very efficient](https://github.com/ottypes/json1/issues/13).
- A better way would be to either [manually annotate the various slate operations](https://github.com/qqwee/slate-ottype) or to add a debounce of some sort. A debounce would trade off between granularity (important for good UX) versus performance. Of course there are other ways such as separate thread of computing operations using WebWorkers, or perhaps rewrite the core algorithm in WebAssembly. If you paste a large body of text there is a second or two of lag as diff function has to catch up. The holy grail would be to implement the transformation function using Slate's [native Operation type](https://github.com/ianstormtaylor/slate/blob/master/packages/slate/src/interfaces/operation.ts). (there are 9 operations, but that takes a lot of time to build and debug so it is faster to piggy back off ShareDB unless you have a team of engineers willing to build a solution from ground up.)
- Multi-cursors, presence, live chat etc. are left as an exercise to the reader.
## Literature

https://www.tiny.cloud/blog/real-time-collaborative-editing-slate-js/
https://blog.aha.io/text-editor/
https://ckeditor.com/blog/Lessons-learned-from-creating-a-rich-text-editor-with-real-time-collaboration/

https://medium.com/@david.roegiers/building-a-real-time-collaborative-text-editor-for-the-web-draftjs-sharedb-1dd8e8826295
https://hackernoon.com/operational-transformation-the-real-time-collaborative-editing-algorithm-bf8756683f66
https://hackernoon.com/analysing-different-operational-transformation-algorithms-for-collaborative-editing-60fcc49ef24b
https://medium.com/@srijancse/how-real-time-collaborative-editing-work-operational-transformation-ac4902d75682
https://medium.com/coinmonks/operational-transformations-as-an-algorithm-for-automatic-conflict-resolution-3bf8920ea447
https://github.com/qqwee/slate-ottype
https://github.com/ksimons/ot-slatejs
https://github.com/quilljs/delta/blob/e5517726f6665e293e851457b1cc0c7a17576e50/src/Delta.ts#L390

