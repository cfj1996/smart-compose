import "./style.css";
import { smartCompose } from "smart-compose";

const sum = smartCompose(1, 1);
const textarea = document.querySelector("#textarea") as HTMLInputElement;

textarea.value = sum.toString();
