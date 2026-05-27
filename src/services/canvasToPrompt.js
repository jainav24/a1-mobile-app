/**
 * canvasToPrompt.js
 * Converts canvas state (elements array) + material into a rich
 * architectural text prompt for the Gemini image-generation API.
 */

const MATERIAL_DESCRIPTORS = {
    Marble:    'pristine white marble with subtle grey veining, polished surfaces gleaming',
    Granite:   'rough-hewn dark granite with silver and black speckles, textured facades',
    Rock:      'natural rough-cut stone with earthy brown and grey tones, rustic masonry',
    Sandstone: 'warm golden sandstone with layered texture, sun-kissed desert tones',
    Brick:     'rich red-brown hand-laid brick with precise mortar joints, aged patina',
    Wood:      'rich dark teak wood with prominent grain, carved ornamental details',
    Concrete:  'smooth exposed concrete with fine aggregate finish, modern brutalist aesthetic',
};

const ASSET_LABEL_MAP = {
    // Pillars
    pillar:        'classical pillar',
    corner_pillar: 'corner pillar',
    twin_pillar:   'twin-columned pillar set',
    // Structure
    main_hall:     'grand main hall',
    mandapa:       'open mandapa pavilion',
    antarala:      'antarala vestibule',
    // Roofing
    shikhara:      'soaring shikhara tower dome',
    flat_roof:     'flat ceremonial roof',
    pyramid_roof:  'stepped pyramid roof',
    // Gates / Entrances
    torana:        'ornate torana gateway arch',
    main_gate:     'grand main entrance gate',
    side_entry:    'side entry archway',
    // Walls
    thick_wall:    'thick perimeter wall',
    partition:     'interior partition wall',
    compound_wall: 'compound boundary wall',
};

/**
 * Derive a high-level style description from the elements present.
 */
function deriveStyle(assetIds, shapeTypes) {
    const hasDome    = assetIds.some(id => ['shikhara', 'pyramid_roof'].includes(id));
    const hasPillar  = assetIds.some(id => ['pillar', 'corner_pillar', 'twin_pillar'].includes(id));
    const hasEntrance = assetIds.some(id => ['torana', 'main_gate', 'side_entry'].includes(id));
    const hasMandapa  = assetIds.includes('mandapa');
    const hasRect     = shapeTypes.includes('rect');
    const hasLine     = shapeTypes.includes('line');

    const styleParts = [];
    if (hasDome)     styleParts.push('domed temple');
    if (hasPillar)   styleParts.push('columned');
    if (hasEntrance) styleParts.push('gateway-flanked');
    if (hasMandapa)  styleParts.push('mandapa-style');
    if (hasRect || hasLine) styleParts.push('structured');
    if (styleParts.length === 0) styleParts.push('classical architectural');

    return styleParts.join(', ');
}

/**
 * Main export — builds a photorealistic architectural prompt.
 *
 * @param {Object} canvasState  - Output of canvas.getCanvasState()
 * @param {string} material     - One of: Marble | Granite | Rock | Sandstone | Brick | Wood | Concrete
 * @returns {string}            - Full prompt string
 */
export function generateArchitecturalPrompt(canvasState, material) {
    const elements = canvasState?.elements || [];

    const assetElements  = elements.filter(el => el.type === 'asset');
    const shapeElements  = elements.filter(el => el.type === 'shape');

    const assetIds    = assetElements.map(el => el.assetId || '').filter(Boolean);
    const shapeTypes  = shapeElements.map(el => el.shapeType || '').filter(Boolean);

    // Collect readable names from assets
    const assetNames = [...new Set(
        assetIds.map(id => ASSET_LABEL_MAP[id] || id.replace(/_/g, ' '))
    )];

    // Shape description
    const shapeDesc = [];
    const rectCount   = shapeTypes.filter(t => t === 'rectangle').length;
    const lineCount   = shapeTypes.filter(t => t === 'line').length;
    const circleCount = shapeTypes.filter(t => t === 'circle').length;
    if (rectCount   > 0) shapeDesc.push(`${rectCount} rectangular structural section${rectCount > 1 ? 's' : ''}`);
    if (lineCount   > 0) shapeDesc.push(`${lineCount} linear boundary element${lineCount > 1 ? 's' : ''}`);
    if (circleCount > 0) shapeDesc.push(`${circleCount} circular element${circleCount > 1 ? 's' : ''}`);

    const allFeatures = [...assetNames, ...shapeDesc];
    const featuresStr = allFeatures.length > 0
        ? allFeatures.join(', ')
        : 'traditional architectural elements';

    const style           = deriveStyle(assetIds, shapeTypes);
    const materialDesc    = MATERIAL_DESCRIPTORS[material] || material;

    // Special structural hints
    const hasDome     = assetIds.some(id => ['shikhara', 'pyramid_roof'].includes(id));
    const hasPillar   = assetIds.some(id => ['pillar', 'corner_pillar', 'twin_pillar'].includes(id));
    const hasEntrance = assetIds.some(id => ['torana', 'main_gate', 'side_entry'].includes(id));

    const specialHints = [];
    if (hasDome)     specialHints.push('crowned by an imposing temple dome that rises into the sky');
    if (hasPillar)   specialHints.push('featuring a majestic columned facade with ornately carved pillars');
    if (hasEntrance) specialHints.push('approached through a grand entrance archway with intricate detailing');

    const specialStr = specialHints.length > 0 ? ` The structure is ${specialHints.join(', ')}.` : '';

    const prompt = [
        `A breathtaking photorealistic architectural rendering of a ${style} structure featuring ${featuresStr}.`,
        `${specialStr}`,
        `The entire structure is crafted from ${materialDesc}.`,
        `Shot as professional architectural photography during the golden hour with warm ambient lighting,`,
        `dramatic shadows, cinematic depth of field, perfectly composed wide-angle perspective.`,
        `Ultra high detail, 8K resolution, hyperrealistic textures, award-winning architectural visualization.`,
        `No people, no vegetation, pure architectural grandeur.`,
    ].join(' ').replace(/\s+/g, ' ').trim();

    return prompt;
}
