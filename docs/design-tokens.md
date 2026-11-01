# Authenticated design tokens and typography

Initial anonymous inspection used approximate JPEG samples converted from Display P3 to sRGB and inferred white Arial score text. Authenticated Figma inspection disproved those assumptions. The delivered tokens below supersede that approximation; no screenshot-derived value is presented as exact node metadata.

| Token                          | Authenticated value |
| ------------------------------ | ------------------- |
| Primary/Primary                | `#6324c6`           |
| Feedback/Danger                | `#e92151`           |
| Feedback/Warning               | `#ffb800`           |
| Feedback/Success               | `#01ada6`           |
| Genre Square/Hover/Medium fill | `#774dc5`           |
| Genre and numeric score text   | `#e2e5e9`           |
| Search border                  | `#c4cad4`           |
| Placeholder Gray/Gray          | `#a7b0be`           |

Mulish, identified from authenticated Figma text nodes, is bundled locally under SIL OFL1.1. [Asset provenance, hash and license](../public/fonts/README.md) document Fontsource5.3.0 and the unmodified variable Latin WOFF2. No runtime CDN is used. The variable axis200–1000 includes the required400/600/700 weights; non-Latin live titles may use sans-serif fallback.

Header/footer and compact control labels use cap-height trimming when supported. The fallback uses controlled line boxes without scaling the font or changing its zero letter spacing. Load-more, title, genre and score nodes have natural line boxes despite confusing panel line-height values; browser geometry is tested against observed node bounds. Header width235.5px versus Figma237px is within the recorded1.5px font/layout rounding tolerance; its observed position differs less than0.35px. No artificial horizontal stretching is applied.

Written challenge score rules remain authoritative: below50 red,50–80 yellow,above80 turquoise/green. Missing scores keep dark neutral text and Sem avaliação. The mockup's green80 does not override the written requirement.

Light gray score text on the authenticated bright badge backgrounds has limited contrast, especially yellow. This visual-reference trade-off is recorded explicitly; it is not a WCAG contrast compliance claim. Numeric text and accessible labels convey values independently of color.

The brand ANIME span shares Warning yellow by visual inference: its rich-text hex was not exposed separately. Overlay endpoint alphas85%/17% are authenticated;180deg direction and0%/100% positions follow visible top-dark/bottom-light behavior, not exposed numeric angle/positions. Crop remains cover/center because source crop mode was unavailable.
