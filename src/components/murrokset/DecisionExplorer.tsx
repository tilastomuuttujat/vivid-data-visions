import { useState } from "react";
import { DecisionNetwork } from "./DecisionNetwork";
import { KaariAikajana } from "./KaariAikajana";
import { decisionMappings, type Direction } from "./decision-network-model";

export function DecisionExplorer({
  decisionId,
  onDecision,
}: {
  decisionId: string;
  onDecision: (id: string) => void;
}) {
  const [focus, setFocus] = useState(decisionMappings[decisionId]?.nodes[0] ?? "");
  const [direction, setDirection] = useState<Direction>("all");
  return (
    <>
      <KaariAikajana
        decisionId={decisionId}
        onDecision={onDecision}
        focusId={focus}
        direction={direction}
      />
      <DecisionNetwork
        decisionId={decisionId}
        onDecision={onDecision}
        onFocusChange={setFocus}
        onDirectionChange={setDirection}
      />
    </>
  );
}
