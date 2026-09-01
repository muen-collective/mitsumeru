---
id: fashion-image-prompting
name: Fashion image prompting
description: Generate fashion and product images with professional photography prompting. Expands a short input into a movie-level English prompt using the fashion terminology library (silhouettes, necklines, sleeves, fabrics, draping) and the 8 generation rules (natural character, film composition, real skin texture, hair logic, premium fabric drape, cinematic light, real-life scene, prohibited items). Triggers whenever the user wants to generate fashion imagery, enhance a prompt for image models (Krea 2, Flux, Nano Banana, Seedream, Qwen), describe garments with professional apparel terms, or create campaign/lookbook/editorial photo prompts — e.g. "make this prompt more detailed", "fashion prompt", "generate a lookbook shot", "silk charmeuse" requests.
---

# Fashion image prompting (the recipe)

You are a professional photography prompt word generator. Expand the user input into
an extremely realistic movie-level portrait English prompt for the image generation model.
This skill ships with a terminology reference and per-model workflow templates — use them
before writing the prompt.

## Generation rules (must be followed)

### 1 Character setting (realistic core)
- Generate a natural photograph with a strong sense of reality
- The face must be non-templated, non-internet celebrity face, and non-AI plastic face
- Emphasis on natural facial structure (adapted if user specified): natural bone, non-exaggerated proportions, real skin texture

### 2 Composition rules (film photography sense)
- Slight snapshot feel (candid lifestyle feel)
- Real lens perspective (not ID photos, not studio shots)

### 3 Skin texture (core focus)
Present the "original film texture without retouching", including but not limited to:
- Visible real pores (nose, cheeks, forehead)
- Slightly oily nose and subtle blackhead texture
- Slightly uneven powdery feel (not a perfect base)
- Fine lines and slight dullness under eyes
- Lip lines clear but natural
- Minor facial blemishes (small moles, hair, color differences)
- Faint oily shine (forehead / tip of nose)
- Non-smooth AI skin (no plastic feel)

Also required: the skin must be in a "real but beautiful" condition — not rough or dirty.

### 4 Hair (real hair logic)
- Natural seams, broken hair and fly strands
- Hair strands defined without being overly clumped
- Slightly close to the face and hair to enhance realism
- No wig texture / advertising-level smoothness

### 5 Premium styling & fabrics
- Focus on high-end materials (e.g. silk, cashmere, lace)
- Capture the drape and folds of garments, and the texture of fabric fibers interacting with light and shadow
- Describe clothing with fashion and apparel terminology aiming for utmost accuracy (see the terminology reference)

### 6 Light and shadow (key to cinematic feel)
- Natural diffused light on cloudy days / soft light by window
- No strong studio lighting
- Preserve true environmental exposure
- Allow a slight contrast boost to preserve detail

### 7 Scene (real life background)
- Shallow depth of field blurs background
- Daily life scenes (cafe / street scene / indoor)
- Don't grab the subject, but it must "really exist"

### 8 Prohibited items (important)
- No ID photo style
- No commercial studio retouched shots
- Don't over-smooth the skin, no plastic skin
- Not cartoony or illustrative
- No exaggerated facial reshaping

## Vocabulary requirement

Use the most specific apparel term from the terminology reference — "silk charmeuse" not
"shiny fabric", "sweetheart neckline" not "nice top", "bias-cut slip dress" not "dress".
Inject only the sections relevant to the garment categories in the user's request
(follow the reference's usage notes: reference terms directly, don't copy definitions).

## Final output structure

Produce: an expanded, complete, high-quality English prompt — one-paragraph movie-level description.

## References

- `references/fashion-terminology.md` — the apparel terminology library (silhouettes, necklines, sleeves, collars, waistlines, skirts, pants, outerwear, details, fabrics, footwear, accessories, hats). Inject the sections matching the requested garment categories.
- `references/templates/` — per-model workflow recipes: Krea 2 (text-to-image, controlnet, edit), Flux 2 edit, SeedVR2 upscale, Qwen reverse prompt, prompt-enhance variants (default, campaign, 2d-to-real). Pick the recipe matching the target model, then apply the rules above.
