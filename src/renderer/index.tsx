import ReactOrg from "react";
import ReactDOM from "react-dom"
// import {sendLogsToRenderer} from "@typisch/electron/utils";
import {App} from "./app";
// import {fillIconCache} from "./importIcons";

export { RenderFunction, Consumer, ToastShow, AppContext } from "@typisch/eui/euiApp";

// TODO make the module work with ipcRenderer shim (not to send logs, but to not crash)
// TODO rename sendLogsToMain
// sendLogsToRenderer();

// let progress: Progress = {};

const React = ReactOrg;
// const React = {
//     ...ReactOrg,
//     createElement: (...args: any) => {
//         console.log("createElement", args);
//         return (ReactOrg.createElement as any)(...args);
//     }
// }

// fillIconCache();

function render() {
    ReactDOM.render(<App />, document.getElementById("root"));
}
render()
