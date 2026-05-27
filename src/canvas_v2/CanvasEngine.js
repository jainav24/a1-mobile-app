import React, { useState } from 'react';
import Svg, { Line, Rect, Circle, Defs, Pattern, Path, Text as SvgText, G, Image as SvgImage } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';

// ─── Canvas color palette — light canvas ──────────────────────────────────────
const CANVAS_BG   = '#F8F6F1';          // matches CanvasScreen canvasWrap bg
const GOLD        = '#D4AF37';
const GOLD_DIM    = 'rgba(212,175,55,0.5)';
const DRAFT_CLR   = '#7B6EF6';           // indigo (visible on light)
const SNAP_CLR    = '#0097A7';           // teal (visible on light)
const SHAPE_DARK  = '#2D2D2D';           // stroke for lines/rects/circles on white
const SHAPE_SEL   = GOLD;
const LABEL_CLR   = 'rgba(60,50,20,0.65)'; // warm dark for labels on white

// ─── Grid ─────────────────────────────────────────────────────────────────────
export const Grid = React.memo(({ center = { x: 0, y: 0 } }) => {
    const minor = 25;
    const major = 100;
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width="100%" height="100%">
                <Defs>
                    {/* Minor grid: soft warm gray lines */}
                    <Pattern id="minorGrid" width={minor} height={minor} patternUnits="userSpaceOnUse">
                        <Path d={`M ${minor} 0 L 0 0 0 ${minor}`} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="0.6" />
                    </Pattern>
                    {/* Major grid: slightly stronger warm gray */}
                    <Pattern id="majorGrid" width={major} height={major} patternUnits="userSpaceOnUse">
                        <Rect width={major} height={major} fill="url(#minorGrid)" />
                        <Path d={`M ${major} 0 L 0 0 0 ${major}`} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.8" />
                    </Pattern>
                </Defs>
                {/* Canvas fill */}
                <Rect width="100%" height="100%" fill={CANVAS_BG} />
                {/* Grid overlay */}
                <Rect width="100%" height="100%" fill="url(#majorGrid)" />
                {/* Axis lines */}
                <Line x1={center.x} y1="0%" x2={center.x} y2="100%" stroke="rgba(212,175,55,0.35)" strokeWidth="1.2" />
                <Line x1="0%" y1={center.y} x2="100%" y2={center.y} stroke="rgba(212,175,55,0.35)" strokeWidth="1.2" />
                {/* Origin crosshair */}
                <G transform={`translate(${center.x},${center.y})`}>
                    <Circle r="5" fill="none" stroke={GOLD} strokeWidth="1.5" opacity={0.7} />
                    <Path d="M -10 0 L 10 0 M 0 -10 L 0 10" stroke={GOLD} strokeWidth="1.5" opacity={0.7} />
                </G>
            </Svg>
        </View>
    );
}, (prev, next) => prev.center.x === next.center.x && prev.center.y === next.center.y);

// ─── Snap Indicator ────────────────────────────────────────────────────────────
export const SnapIndicator = ({ position }) => {
    if (!position) return null;
    return (
        <G transform={`translate(${position.x},${position.y})`}>
            <Circle r="5" fill="none" stroke={SNAP_CLR} strokeWidth="1.8" opacity={0.9} />
            <Path d="M -10 0 L 10 0 M 0 -10 L 0 10" stroke={SNAP_CLR} strokeWidth="1.2" opacity={0.9} />
        </G>
    );
};

// ─── Asset Image Node ─────────────────────────────────────────────────────────
// Renders a Firestore asset (SVG or PNG) on the light-background canvas.
// A white backing rect ensures no color bleed from the canvas tint.
const AssetImageNode = React.memo(({ shape, sel }) => {
    const [hasError, setHasError] = useState(false);
    const w  = shape.width  || 80;
    const h  = shape.height || 80;
    const sc = shape.scale  || 1;
    const rot = shape.rotation || 0;

    // Top-left corner of the bounding box (asset centered on shape.x/y)
    const hw = (w * sc) / 2;
    const hh = (h * sc) / 2;
    const bx = (shape.x || 0) - hw;
    const by = (shape.y || 0) - hh;
    const cx = shape.x || 0;
    const cy = shape.y || 0;
    const bw = w * sc;
    const bh = h * sc;

    return (
        <G transform={`rotate(${rot},${cx},${cy})`}>

            {/* ── White backing rect — prevents canvas tint from mixing with SVG ── */}
            <Rect
                x={bx}
                y={by}
                width={bw}
                height={bh}
                fill="#FFFFFF"
                rx={4}
            />

            {/* ── Image (SVG or PNG via SvgImage, handles both) ── */}
            {shape.fileUrl && !hasError ? (
                <SvgImage
                    href={shape.fileUrl}
                    x={bx}
                    y={by}
                    width={bw}
                    height={bh}
                    preserveAspectRatio="xMidYMid meet"
                    onError={() => setHasError(true)}
                />
            ) : (
                /* Error fallback */
                <G>
                    <Rect
                        x={bx} y={by} width={bw} height={bh}
                        rx={8}
                        fill="rgba(180,170,150,0.3)"
                        stroke="rgba(0,0,0,0.12)"
                        strokeWidth={1}
                    />
                    <SvgText
                        x={cx} y={cy + 4}
                        textAnchor="middle"
                        fill="rgba(60,50,20,0.5)"
                        fontSize={10}
                        fontWeight="bold"
                    >
                        {(shape.assetName || 'Asset').toUpperCase()}
                    </SvgText>
                </G>
            )}

            {/* ── Selection ring + dashed border ── */}
            {sel && (
                <Rect
                    x={bx - 4}
                    y={by - 4}
                    width={bw + 8}
                    height={bh + 8}
                    rx={6}
                    fill="none"
                    stroke={GOLD}
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    opacity={0.9}
                />
            )}

            {/* ── Asset name label below image ── */}
            <SvgText
                x={cx}
                y={by + bh + 13}
                textAnchor="middle"
                fill={sel ? GOLD : LABEL_CLR}
                fontSize={8}
                fontWeight="700"
            >
                {(shape.assetName || '').toUpperCase()}
            </SvgText>

            {/* ── Corner resize handles (when selected) ── */}
            {sel && (
                <>
                    {[
                        [bx,      by     ],
                        [bx + bw, by     ],
                        [bx,      by + bh],
                        [bx + bw, by + bh],
                    ].map(([hx, hy], i) => (
                        <G key={i}>
                            <Circle cx={hx} cy={hy} r={8} fill="rgba(212,175,55,0.18)" />
                            <Rect
                                x={hx - 4} y={hy - 4}
                                width={8} height={8}
                                fill={GOLD}
                                stroke="#FFF"
                                strokeWidth={1}
                                rx={2}
                            />
                        </G>
                    ))}
                </>
            )}
        </G>
    );
}, (prev, next) => prev.shape === next.shape && prev.sel === next.sel);

// ─── Selection Handles (for lines, rects, circles) ────────────────────────────
const Handles = ({ shape }) => {
    const H = 8;
    const dot = (x, y, key) => (
        <G key={key}>
            <Circle cx={x} cy={y} r={7} fill="rgba(212,175,55,0.2)" />
            <Rect x={x - H / 2} y={y - H / 2} width={H} height={H} fill={GOLD} stroke="#FFF" strokeWidth={1} rx={2} />
        </G>
    );
    if (shape.type === 'line' || shape.type === 'rect' || shape.type === 'circle') {
        return <>{dot(shape.x1, shape.y1, 'h1')}{dot(shape.x2 ?? shape.x1, shape.y2 ?? shape.y1, 'h2')}</>;
    }
    return null;
};

// ─── Shape Node ───────────────────────────────────────────────────────────────
const ShapeNode = React.memo(({ shape, sel }) => {
    // On light canvas use dark strokes; gold when selected
    const stroke = sel ? SHAPE_SEL : SHAPE_DARK;
    const sw = sel ? 2 : 1.5;

    if (shape.type === 'asset') {
        return <AssetImageNode shape={shape} sel={sel} />;
    }

    if (shape.type === 'line') {
        const len = Math.hypot(shape.x2 - shape.x1, shape.y2 - shape.y1).toFixed(0);
        return (
            <G>
                <Line x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} stroke={stroke} strokeWidth={sw} />
                {sel && <>
                    <Handles shape={shape} />
                    <SvgText
                        x={(shape.x1 + shape.x2) / 2} y={(shape.y1 + shape.y2) / 2 - 10}
                        fill={GOLD} fontSize={11} fontWeight="bold" textAnchor="middle"
                    >{len}px</SvgText>
                </>}
            </G>
        );
    }

    if (shape.type === 'rect') {
        const x = Math.min(shape.x1, shape.x2);
        const y = Math.min(shape.y1, shape.y2);
        const w = Math.abs(shape.x2 - shape.x1);
        const h = Math.abs(shape.y2 - shape.y1);
        return (
            <G>
                <Rect
                    x={x} y={y} width={w} height={h}
                    stroke={stroke} strokeWidth={sw}
                    fill={sel ? 'rgba(212,175,55,0.05)' : 'rgba(0,0,0,0.03)'}
                />
                {sel && <>
                    <Handles shape={shape} />
                    <SvgText x={x + w / 2} y={y - 8} fill={GOLD} fontSize={11} fontWeight="bold" textAnchor="middle">
                        {w.toFixed(0)} × {h.toFixed(0)}
                    </SvgText>
                </>}
            </G>
        );
    }

    if (shape.type === 'circle') {
        const r = Math.hypot(shape.x2 - shape.x1, shape.y2 - shape.y1);
        return (
            <G>
                <Circle
                    cx={shape.x1} cy={shape.y1} r={r}
                    stroke={stroke} strokeWidth={sw}
                    fill={sel ? 'rgba(212,175,55,0.05)' : 'rgba(0,0,0,0.03)'}
                />
                {sel && <>
                    <Handles shape={shape} />
                    <SvgText x={shape.x1} y={shape.y1 - r - 8} fill={GOLD} fontSize={11} fontWeight="bold" textAnchor="middle">
                        R: {r.toFixed(0)}
                    </SvgText>
                </>}
            </G>
        );
    }
    return null;
}, (prev, next) => prev.shape === next.shape && prev.sel === next.sel);

export const RenderShapes = React.memo(({ shapes, selectedShapeId }) => {
    if (!shapes?.length) return null;
    return (
        <>
            {shapes.map((shape) => {
                if (!shape?.id) return null;
                return <ShapeNode key={shape.id} shape={shape} sel={shape.id === selectedShapeId} />;
            })}
        </>
    );
});

// ─── Draft Shape ──────────────────────────────────────────────────────────────
export const DraftShape = ({ type, startPoint, currentPoint }) => {
    if (!startPoint || !currentPoint) return null;
    const dx = currentPoint.x - startPoint.x;
    const dy = currentPoint.y - startPoint.y;

    if (type === 'line') {
        const len = Math.hypot(dx, dy).toFixed(0);
        return (
            <G>
                <Line
                    x1={startPoint.x} y1={startPoint.y}
                    x2={currentPoint.x} y2={currentPoint.y}
                    stroke={DRAFT_CLR} strokeWidth={1.8} strokeDasharray="5 4"
                />
                <SvgText
                    x={(startPoint.x + currentPoint.x) / 2}
                    y={(startPoint.y + currentPoint.y) / 2 - 10}
                    fill={DRAFT_CLR} fontSize={11} fontWeight="bold" textAnchor="middle"
                >{len}px</SvgText>
            </G>
        );
    }
    if (type === 'rect') {
        const x = Math.min(startPoint.x, currentPoint.x);
        const y = Math.min(startPoint.y, currentPoint.y);
        const w = Math.abs(dx);
        const h = Math.abs(dy);
        return (
            <G>
                <Rect
                    x={x} y={y} width={w} height={h}
                    stroke={DRAFT_CLR} strokeWidth={1.8} strokeDasharray="5 4"
                    fill="rgba(123,110,246,0.07)"
                />
                <SvgText x={x + w / 2} y={y - 8} fill={DRAFT_CLR} fontSize={11} fontWeight="bold" textAnchor="middle">
                    {w.toFixed(0)} × {h.toFixed(0)}
                </SvgText>
            </G>
        );
    }
    if (type === 'circle') {
        const r = Math.hypot(dx, dy);
        return (
            <G>
                <Circle
                    cx={startPoint.x} cy={startPoint.y} r={r}
                    stroke={DRAFT_CLR} strokeWidth={1.8} strokeDasharray="5 4"
                    fill="rgba(123,110,246,0.07)"
                />
                <SvgText x={startPoint.x} y={startPoint.y - r - 8} fill={DRAFT_CLR} fontSize={11} fontWeight="bold" textAnchor="middle">
                    R: {r.toFixed(0)}
                </SvgText>
            </G>
        );
    }
    return null;
};

// ─── Asset Ghost (hover preview stub) ────────────────────────────────────────
export const AssetGhost = ({ asset, position }) => {
    if (!asset || !position) return null;
    return (
        <G transform={`translate(${position.x},${position.y})`} opacity={0.5}>
            <Rect x={-40} y={-40} width={80} height={80} rx={8} fill="rgba(212,175,55,0.1)" stroke={GOLD} strokeWidth={1.5} strokeDasharray="4 3" />
            <Path d="M -10 0 L 10 0 M 0 -10 L 0 10" stroke={GOLD} strokeWidth={1.2} />
        </G>
    );
};
