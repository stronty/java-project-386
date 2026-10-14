# Russian UI strings only, English everywhere else

The app is built for Russian-speaking guests, so we decided that every user-visible string is
Russian, while code, identifiers, comments, commit messages, and documentation stay in English.

## Consequences

The boundary is drawn at the UI layer: domain vocabulary in `GLOSSARY.md` and the API stay English
so the codebase is greppable by anyone, and only what a guest reads is translated. The cost is that
no other locale is reachable without extracting strings, which should be an explicit later decision
rather than an accident of scattered literals.
