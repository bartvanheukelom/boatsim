import React from "react";
import {EuiRange} from "@elastic/eui";
import {SimInput} from "./types";
import {EuiFlexGroup, EuiFlexItem} from "@elastic/eui/src/components/flex";

export function HUD(props: {
    input: SimInput;
    updateInput: (u: (i: SimInput) => void) => void;
}) {
    return <EuiFlexGroup direction={"column"}>
        <EuiFlexItem grow={false}>
            <EuiRange value={props.input.windAngle} onChange={e => props.updateInput(i => i.windAngle = parseFloat(e.currentTarget.value))}
                      min={0} max={360} step={1}
            />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
            <EuiRange value={props.input.sailAngle} onChange={e => props.updateInput(i => i.sailAngle = parseFloat(e.currentTarget.value))}
                      min={-80} max={80} step={1}
            />
        </EuiFlexItem>
    </EuiFlexGroup>;
}
