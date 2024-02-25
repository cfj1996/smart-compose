import "./style.css";
import { smartCompose } from "smart-compose";

const sum = smartCompose(1, 1);

// fetch('/api/smartCompose', {
//   headers: {
//     'content-type': 'application/json'
//   },
//   method: 'post',
//   body: JSON.stringify({
//     text: 'What\'s up with you？'
//   })
// }).then(res => res.json()).then(res => {
//   console.log('res', res);
// });
document.querySelector("#textarea").innerHTML = `<div>${sum.toString()}</div>`;
