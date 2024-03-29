import "./style.css";
import smartCompose from "smart-compose";

let i = 0;
const textList = [
  " 1我们是否提到您可以完全控制编辑器的渲染？\n这是一个没有任何样式的准系统示例，\n但包含一整套常见的扩展。",
  " 2我们是否提到您可以完全控制编辑器的渲染？\n这是一个没有任何样式的准系统示例，",
  " 3我们是否提到您可以完全控制编辑器的渲染？",
  " 4我们是否提到您可以完全控制编辑器的渲染？\n这是一个没有任\n何样式的准系统示例，\n但包含一整套常见的扩展。",
];

const getSmartCompose = text => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      i++;
      resolve(textList[i % 4]);
    }, 1000);
  });
};

smartCompose({
  offset: [0, -2],
  el: document.querySelector('#editor1 div[contenteditable="true"]'),
  getCompletionValue: getSmartCompose,
});
smartCompose({
  offset: [0, 0],
  clearLine: true,
  el: document.querySelector('#editor2 div[contenteditable="true"]'),
  getCompletionValue: getSmartCompose,
});
