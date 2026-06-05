---
name: Subagent JSX pitfalls
description: Known recurring bugs design subagents introduce in this proof-of-human React+Vite project, and how to fix them.
---

## Rule
After every design subagent run, grep for `React\.` and template-literal style props before restarting the workflow.

**Why:** Subagents consistently produce two classes of bugs:
1. `React.Fragment` used without importing React — fix by adding `Fragment` to the named import from `react` and replacing `React.Fragment` with `Fragment`.
2. Template literals containing backticks inside JSX attributes or `tickFormatter` callbacks — these terminate the code_execution task string early; fix by switching to string concatenation (`val + "%"`).

**How to apply:**
- After subagent completes, run: `grep -n "React\." artifacts/proof-of-human/src/pages/*.tsx`
- Also run: `grep -n "style={.*\`" artifacts/proof-of-human/src/pages/*.tsx`
- Fix before restarting workflow to avoid runtime errors showing to the user.
