# Design color and score refinement

R13 uses colors sampled from the Figma reference screenshot displayed at 50%, converting its Display P3 ICC profile to sRGB. These are approximate JPEG samples, not values extracted from design nodes. Primary purple is `#6124c5`; score red `#ea2151`, yellow `#ffb800`, turquoise `#09ada6`.

Outlined formats share primary purple for text and border. Active filters keep white text on the primary fill. Primary branding shares the token. Numeric score text is white, 24px, regular 400 Arial/sans-serif, with no additional font download. Badge padding and layout are preserved. Missing scores retain dark neutral text and Sem avaliação.

Written challenge rules still determine categories: below 50 red, 50–80 yellow, above 80 turquoise/green. The mockup's green 80 does not override that rule. Browser computed-style regression checks 49/50/80/81/null and inactive/selected filters.

White text on these sampled badge backgrounds has limited contrast, especially yellow. This known trade-off follows the requested visual reference; it is not a WCAG contrast compliance claim. Numeric text and accessible labels continue conveying scores independently of color.
