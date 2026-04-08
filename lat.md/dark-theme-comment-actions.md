# Dark Theme Comment Actions

Draft comment edit and delete controls stay readable in dark mode by forcing white action icons on read-only comment cards.

The read-only action buttons are rendered by [[frontend/src/components/ui/wysiwyg.tsx#WYSIWYGEditor]] and used for draft comment controls from [[frontend/src/components/diff/ReviewCommentRenderer.tsx#ReviewCommentRenderer]].
