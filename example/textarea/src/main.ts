import "./style.css";
import { SmartCompose } from "smart-compose";

const textarea = document.querySelector(".textarea") as HTMLTextAreaElement;
new SmartCompose({
  el: textarea,
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
        return res.completion as string;
      }),
});
