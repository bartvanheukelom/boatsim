import ReactOrg, {useEffect} from "react";

import ReactDOM from "react-dom"
import './importIcons'
// import {sendLogsToRenderer} from "@typisch/electron/utils";
import {appHooks} from "@typisch/eui/euiApp";
import {Tab} from "./context";
import {fillIconCache} from "./importIcons";

export { RenderFunction, Consumer, ToastShow, AppContext } from "@typisch/eui/euiApp";

// TODO make the module work with ipcRenderer shim (not to send logs, but to not crash)
// TODO rename sendLogsToMain
// sendLogsToRenderer()

// let progress: Progress = {};

const React = ReactOrg;
// const React = {
//     ...ReactOrg,
//     createElement: (...args: any) => {
//         console.log("createElement", args);
//         return (ReactOrg.createElement as any)(...args);
//     }
// }

fillIconCache();

function render() {
    ReactDOM.render(<App />, document.getElementById("root"));
}
render()

type TabsObj = { [n: string]: Tab };

function App() {

    const me = "App";
    const app = appHooks();

    useEffect(() => {
        console.log(`${me} mounting`);
        return () => console.log(`${me} unmounting`);
    }, []);


    return <p>HOI</p>;
}
