import "./style.css";
import { SmartCompose } from "smart-compose";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Document from "@tiptap/extension-document";
import Text from "@tiptap/extension-text";
import Paragraph from "@tiptap/extension-paragraph";

new Editor({
  element: document.querySelector("#editor"),
  extensions: [Document, Text, Paragraph],
  content: "<p>Hello World!<span>123</span></p>",
});

const textarea = document.querySelector("#editor .tiptap");
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
        return res.completion;
      }),
});
