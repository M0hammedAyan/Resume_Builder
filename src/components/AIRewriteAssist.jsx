import AISuggestionCard from "./resumeStudio/AISuggestionCard.jsx";

function AIRewriteAssist({ text, context, onAccept }) {
  return <AISuggestionCard text={text} context={context} onAccept={onAccept} />;
}

export default AIRewriteAssist;
