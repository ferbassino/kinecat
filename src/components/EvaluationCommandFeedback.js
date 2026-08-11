import React from "react";
import CommandCueBar from "./CommandCueBar";
import CommandCueOverlay from "./CommandCueOverlay";

const EvaluationCommandFeedback = ({ cue, accentColor = "#00ffff" }) => (
  <>
    <CommandCueBar cue={cue} accentColor={accentColor} />
    <CommandCueOverlay cue={cue} accentColor={accentColor} />
  </>
);

export default EvaluationCommandFeedback;
