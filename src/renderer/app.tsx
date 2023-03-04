import React, {useEffect} from "react";
import { appHooks } from "@typisch/eui/euiApp";

export function App() {

    const me = "App";
    const app = appHooks();

    useEffect(() => {
        console.log(`${me} mounting`);
        return () => console.log(`${me} unmounting`);
    }, []);


    return <p>HOI</p>;
}
