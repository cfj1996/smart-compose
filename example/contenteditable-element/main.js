import "./style.css";
import { SmartCompose } from "smart-compose";

new SmartCompose({
  el: document.querySelector('#editor1 div[contenteditable="true"]'),
  getCompletionValue: value =>
    fetch("/api/smartCompose", {
      headers: {
        "content-type": "application/json",
      },
      method: "post",
      body: JSON.stringify({
        text: value,
      }),
    })
      .then(response => response.json())
      .then(res => {
        return res.completion;
      }),
});
new SmartCompose({
  el: document.querySelector('#editor—wrapper div[contenteditable="true"]'),
  getCompletionValue: value =>
    fetch("/api/smartCompose", {
      headers: {
        "content-type": "application/json",
      },
      method: "post",
      body: JSON.stringify({
        text: value,
      }),
    })
      .then(response => response.json())
      .then(res => {
        return res.completion;
      }),
});
