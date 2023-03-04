import React from "react";
import {EuiRange} from "@elastic/eui";

export function HUD(props: {
    windAngle: number;
    setWindAngle: (angle: number) => void;
}) {
    return <EuiRange value={props.windAngle} onChange={e => props.setWindAngle(parseFloat(e.currentTarget.value))}
                     min={0} max={360} step={1}
    />;
}
