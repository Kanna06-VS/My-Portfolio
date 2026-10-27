# Portfolio illustration generation

Mode: built-in `image_gen` tool, new image generation with transparent backgrounds.

The supplied example was used only as general style context. These are original ERP consulting scenes and do not reuse the example or the profile photo.

Saved project assets (1536 × 1024 PNG, original alpha preserved):
- `erp-consulting.png` — Original About section illustration, retained as an unused asset.
- `erp-consulting-male.png` — Current About section introduction; solo consultant represents the portfolio owner.
- `erp-collaboration.png` — Contact section.

## Male consultant edit

Mode: built-in `image_gen` tool, precise edit of `erp-consulting.png` with a transparent background. The current About asset is `erp-consulting-male.png` (1536 × 1024 PNG, alpha preserved). Keep solo consultants representing the portfolio owner male; mixed groups may include female colleagues. The existing Contact group already shows a male colleague explaining the workflow.

Final edit prompt:

Use case: precise-object-edit.
Asset type: transparent About-section illustration for a Microsoft Dynamics 365 Business Central functional analyst portfolio.
Input image: the local erp-consulting.png is the edit target.
Primary request: Replace only the solo female business analyst with an adult male business analyst. He represents the portfolio owner explaining business processes, so give him short neatly styled dark hair, a masculine face, and professional navy business attire over a light shirt. Keep him holding and using the tablet in the same position and pose, with natural hands and anatomy.
Invariants: Preserve the original polished soft-shaded illustration style, the cyan/blue/violet/navy palette, 1536 by 1024 landscape composition, subject scale and placement, and all dashboard, charts, finance, inventory boxes, workflow symbols, connecting lines, lighting, and surrounding spacing. Preserve the genuinely transparent background and alpha edges so the image works on both light and dark page backgrounds. Do not add any other people. This is a fictional illustrated consultant, not a recreation of a real portrait. No text, logo, watermark, border, or opaque background.

## Original ERP consulting prompt

Use case: stylized-concept.
Asset type: original section illustration for a Microsoft Dynamics 365 Business Central functional analyst portfolio.
Primary request: A polished, contemporary flat editorial illustration about understanding business processes before configuring an ERP system. An adult business analyst stands with a tablet beside a floating business dashboard containing a small bar chart, a finance ledger icon, inventory boxes, and a short connected workflow. Business consulting, not software coding.
Style/medium: crisp vector-like raster illustration, clean geometric forms, restrained soft shading, rounded forms, professional enterprise tone. Palette drawn from the website: cyan #41e3f2, blue #3c98ff, violet #8268ff, deep navy, and pale neutral dashboard surfaces. Friendly human figure with natural anatomy; modest detail that remains readable at 280 pixels wide.
Composition/framing: compact balanced landscape composition, complete figure and objects visible, content fills most of the canvas with a little breathing room. Genuinely transparent background with clean alpha edges; no opaque rectangle, scenery, giant color blob, or ground plane. This cutout must work on both a pale glass panel and a dark navy page.
Constraints: Create a new original composition. No words, letters, numbers, logos, code brackets, watermarks, or border. Do not imitate a supplied developer-at-a-desk image or any real person's portrait.

## ERP collaboration prompt

Use case: stylized-concept.
Asset type: original contact-section illustration for a Microsoft Dynamics 365 Business Central functional analyst portfolio.
Primary request: A polished flat editorial illustration of two adult business colleagues collaborating on a successful ERP delivery. They stand beside a compact shared workflow board with a few connected process cards, a checkmark, and small finance and inventory symbols; one colleague gestures to the board while the other holds a checklist. Convey requirements discussion, user acceptance testing, and practical business improvement.
Style/medium: crisp vector-like raster illustration with clean geometric forms, restrained soft shading, rounded forms, professional enterprise tone. Match a portfolio palette of cyan #41e3f2, blue #3c98ff, violet #8268ff, deep navy, and pale neutral board surfaces. Natural hands and anatomy, expressive but understated figures.
Composition/framing: compact balanced landscape composition; figures and board fully visible, clear silhouette and limited details that stay readable at 300 pixels wide. Genuinely transparent background with clean alpha edges. No opaque rectangle, room scene, large blob, or decorative empty ground. Suitable on both light glass and dark navy.
Constraints: An original business consulting scene, not a programmer at a desk. No text, letters, numbers, logos, code symbols, watermarks, or borders. No resemblance to an actual portrait.

