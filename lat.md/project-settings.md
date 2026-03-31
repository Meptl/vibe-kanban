# Copy Files Selector Blur Behavior

The copy-files textarea closes its suggestion dropdown when the field loses focus so transient search suggestions are not left visible after blur.

This behavior is implemented in [[frontend/src/components/ui/multi-file-search-textarea.tsx#MultiFileSearchTextarea]] and used by [[frontend/src/components/projects/CopyFilesField.tsx#CopyFilesField]] in project settings. Suggestion click handling keeps focus long enough to apply the selected file before blur cleanup, and scroll events dismiss the dropdown.
