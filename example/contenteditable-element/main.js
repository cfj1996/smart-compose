import "./style.css";
import { smartCompose } from "smart-compose";
const sum = smartCompose(1, 1);
alert(sum);
document.querySelector("#textarea").innerHTML = `<div>${sum.toString()}</div>`;
