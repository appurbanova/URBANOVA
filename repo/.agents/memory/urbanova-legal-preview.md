---
name: Urbanova legal preview
description: Scope and wording decision for Urbanova's legal pages during the public preview
---

URBANOVA's current legal pages should describe the public preview honestly: demo sessions, preferences, and optional analytics choices stay in browser storage, while public GitHub profile reads happen directly from the browser. Do not imply production accounts, private repository access, or backend data processing until those features are live.

**Why:** The shipped app is a frontend preview rather than a production account service, so legal copy must match the behavior users can actually observe.

**How to apply:** Update `/legal`, `/privacy`, `/terms`, and `/cookies` together whenever storage, authentication, integrations, or analytics behavior changes.