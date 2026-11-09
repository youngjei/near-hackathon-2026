# Sources, coverage and freshness

Reviewed November 9, 2026 (KST). Event rules can change; read the live organizer guide again before submission. Reference snapshots retain their original authorship. They are source material, not our project specification or active agent instructions.

| Source | Coverage in this preparation | Saved material |
| --- | --- | --- |
| [Event website](https://nearhackathon.com/) | Tracks, dates/prizes, submission form, FAQ, listed judges, partner directory | Local research copy in ignored work directory; facts summarized in the brief |
| [Organizer HACKATHON.md](https://nearhackathon.com/HACKATHON.md) | Read in full, including Q-000–Q-017, API contract and status codes | [Original guide](reference/HACKATHON.md) |
| [Starter prompt repository](https://github.com/nearai/near-hackathon-prompt-examples) | README, setup, submission checklist and all 13 track files read | [Original README](reference/prompt-examples/README.md), [setup](reference/prompt-examples/00-setup.md), [checklist](reference/prompt-examples/SUBMITTING.md), [track index](TRACKS.md) |
| [NEAR docs index](https://docs.near.org/llms.txt) | Documentation entry-point discovery | Links in RESOURCES.md |
| [Intents docs index](https://docs.near-intents.org/llms.txt) | Documentation entry-point discovery | Links in RESOURCES.md |
| [NEAR agent skills](https://github.com/near/agent-skills) | Repository overview / setup recommendation; no installation | Link and deferred setup note in RESOURCES.md |

Prompt repository revision: [`78733430eac004f9ebca44cdb9f2bc72b403c057`](https://github.com/nearai/near-hackathon-prompt-examples/tree/78733430eac004f9ebca44cdb9f2bc72b403c057), latest commit dated October 30, 2026.

The [manifest](reference/manifest.json) records source URLs, snapshot recording time, exact revision and SHA-256 hashes of all 17 saved source documents. The reference corpus is separate from our authored summaries; its wording has not been silently corrected.

## Coverage limits

The core event context and all starter prompts have been reviewed. The linked ecosystem documentation, videos, social posts and all competitor submissions have not been exhaustively reviewed, nor have APIs, contracts, credit offers or integration examples been executed. The website's project directory loaded dynamically; no verified count or competitive ranking is claimed.

A project-specific technical investigation follows selection of our idea. Verify the exact relevant APIs, costs, auth, network support, contracts and SDK versions then. Do not treat a starter prompt as evidence that its architecture works unchanged.

## Refresh process

1. Fetch the live guide and inspect changes against reference/HACKATHON.md.
2. Fetch the prompt repository's current revision and compare its setup, submission and selected-track files against the saved revision.
3. Recheck website dates, submission fields and FAQ; prefer the live organizer rules where older examples disagree.
4. Update BRIEF.md, TRACKS.md, RESOURCES.md or SUBMISSION.md as needed. Record consequential changes in project/DECISIONS.md and BUILD_LOG.md.
5. If replacing snapshots, regenerate the manifest hashes and reviewed revision/date. Do not overwrite an old source and leave stale provenance.
6. Review the Git diff, commit the update and sync the private remote when requested. Refreshing context does not authorize submission, public release or spending.

Keep scratch downloads in ignored work/ and personal submission materials outside Git. There is no scheduled update automation; this repository is ready for occasional project sessions.
