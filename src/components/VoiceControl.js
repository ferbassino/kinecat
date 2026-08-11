import React from "react";
import CommandCueBar from "./CommandCueBar";

/** @deprecated Usar useEvaluationCommands + CommandCueBar/CommandCueOverlay */
const VoiceControl = ({ message, accentColor = "#00ffff" }) => (
  <CommandCueBar
    cue={message ? { visual: "banner", text: message } : null}
    accentColor={accentColor}
  />
);

export default VoiceControl;
