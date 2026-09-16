# Design references

The user requested a style informed by the top 200 most visited websites. This is a focused selection of relevant sites within that set, not an audit or recreation of all 200 sites.

The published [Semrush global traffic ranking](https://www.semrush.com/trending-websites/global/all) inspected on September 15, 2026 was labeled July 2026. Google appeared first and Wikipedia seventh. Traffic rankings are estimates and change; they are a selection aid, not evidence that popularity alone makes a design usable.

| Reference inspected | Observed pattern | Applied in Twofold |
| :--- | :--- | :--- |
| [Google](https://www.google.com/) | A focused input with a clear primary action and little competing navigation | One question, two answer inputs, and one prominent Compare answers action |
| [Wikipedia article](https://en.wikipedia.org/wiki/Percentage) | Readable text, horizontal article navigation, contents links, and nearby numbered references | Verdict, Reasoning, Claims, and Sources navigation; explicit claim references; readable report sections |
| [GitHub repository creation](https://github.com/new) | Clear field labels, section grouping, restrained borders, and explicit primary action | Distinct answer groups, optional author fields, precise control labels, and neutral editor surfaces |

Google and Wikipedia were selected from the verified top traffic set. GitHub was an additional interaction reference observed during repository creation; its exact global rank was not verified in this design pass.

The resulting design uses white surfaces, a restrained blue primary action, blue and violet answer identities, neutral system typography, and simple borders. It does not copy third party logos, assets, account interfaces, or imply affiliation. No remote fonts or tracking assets are loaded.

## Concept and implementation

The current [design reference](design-reference.png) supersedes the original green editorial concept after the user's requested design change. It describes the input flow and result preview. The running app includes the complete expanded evidence report beyond that preview.

Image generated labels and fake character counts were corrected to match the real product. Author names start empty, web checking starts off, and no example result is displayed until a live comparison succeeds. The inputs support 4,000 question characters and 12,000 per answer. Those functional requirements take precedence over the concept's invented counts and filled provider names.

The final visual comparison and responsive checks are recorded in [verification evidence](VERIFICATION.md).
