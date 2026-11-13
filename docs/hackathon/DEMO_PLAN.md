# Demo video plan — split/d/bill

Use the local demo flow from [app setup](../../app-web/README.md#run-locally) or the owner-only pilot. Record a fresh sample bill with synthetic data. The sample journey is **a simulation**; do not narrate its simulated success as a funded payment. Do not show an owner password, partner key, recovery link, private share token, real receiving account, or wallet balance in the recording.

## Recorded 72-second submission cut

| Time | Screen action | Voiceover point |
| --- | --- | --- |
| 0–7 s | Home screen → **Try a sample bill** | A shared meal should be easy to reimburse across borders. |
| 7–18 s | Synthetic 200 AED sample bill and diner count; receiver field uses a visibly labeled omitted placeholder | Confirm the bill and review the split. No real receiving account is shown. |
| 18–26 s | **Review split** with USDC amounts | The app calculates shares and prepares individual requests. |
| 26–40 s | Organizer progress and share action | Each friend gets a separate checkout link; the organizer can follow progress. |
| 40–59 s | One friend’s share → Zcash demo → simulated success | The checkout and success state are simulations; no funds move. |
| 59–73 s | Organizer view shows one of three shares paid in the demo; final synthetic/no-funds disclaimer | Live request testing remains owner-only; funded acceptance, wallet handoff, refunds and confidential credit are pending. |

The video is included in the repository at [`assets/demo.mp4`](assets/demo.mp4) (1280×720 H.264/AAC, 72.56 s). The ignored review artifacts are `.context/splitdbill-submission.mp4` and `.context/submission-contact-sheet.png`. The exported cut has English narration and burned-in captions. It uses a synthetic bill, masks the synthetic receiving-field value, and shows the app’s persistent **Demo · No real payments** label and a closing **SYNTHETIC DEMO · NO FUNDS MOVED** message. The user still publishes the public X post themselves.

The user also pointed to [`latent-spaces/brag`](https://github.com/latent-spaces/brag). Its official README describes a Hyperframes-based launch-video workflow with a 15–25 second target; that format does not fit this 60–90 second product walkthrough. The workspace already had an `ffmpeg-static` binary, so the video was produced from actual local app footage with captions and narration instead. No Brag plugin or external service was installed or used.

Keep the persistent **Demo · No real payments** label visible when showing simulated settlement. Show a real wallet or transaction only after the user approves a bounded payment and the receiving credit is independently checked; label that footage with the actual observed result. Do not splice a real request and a simulated success into one apparently completed payment.

## Recording and release

1. Start from a clean browser profile and a fresh synthetic bill. Verify that the title, amount, and labels are readable at the final video size.
2. On macOS, press **Shift–Command–5**, select **Record Selected Portion**, capture the browser, and stop from the menu bar. Trim setup/waiting time and keep one continuous user journey where practical.
3. Watch the exported file once with audio on and once muted. Confirm no private URLs, account identifiers, notifications, credentials, or personal details appear.
4. The human publishes the video with a public X post. The [live organizer guide](https://nearhackathon.com/HACKATHON.md) requires the human’s post to mention NEAR HACKATHON, `@NEARProtocol`, and `#NEARHackathon`. Add the public repository and demo links only after they are accessible.

Suggested post draft for the human to edit and publish with the video attached. X's current help permits a 140-second video for non-Premium accounts, so this 73-second MP4 fits. The text below uses 253 characters before the link; X currently counts a link as 23 characters, keeping the post within the ordinary 280-character limit ([video help](https://help.x.com/en/using-x/premium-longer-videos), [link count](https://help.x.com/en/business-and-advertising/creative-ad-specifications)).

> Split/d/bill turns a dinner receipt into USDC shares and private pay links for friends abroad. NEAR Intents routes supported payments to confidential USDC. Built at NEAR HACKATHON. This video is a simulation; no funds moved. @NEARProtocol #NEARHackathon https://github.com/youngjei/near-hackathon-2026
