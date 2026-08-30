import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton, MenuItem, Select, Skeleton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import CloseIcon from '@mui/icons-material/Close';
import { getBlobs, useBlobData, useBlobDetail } from '@api/blob';
import { getObjectPositions } from '@api/object';

const MIN_ZOOM = 1;
const MAX_ZOOM = 1500;
const NAME_PREFIX = 'ZeroVSum_';

export function ImageViewer({ analysisKey, fullscreen, onToggleFullscreen }: { analysisKey: string, fullscreen?: boolean, onToggleFullscreen?: () => void }) {
    const { data, isLoading: blobsLoading } = getBlobs({ analysis_key: analysisKey, source_table: 'Images' });
    const images = (data ?? []).filter((b) => b.image_name?.startsWith(NAME_PREFIX));

    const { data: objectPositions } = getObjectPositions(analysisKey);
    const [showMarks, setShowMarks] = useState(true);

    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    useEffect(() => {
        if (!selectedKey && images.length > 0) {
            setSelectedKey(images[0].natural_key);
        }
    }, [images, selectedKey]);

    // detail (stats/dtype) is only fetched for the one blob currently selected
    const { data: selected, isLoading: detailLoading } = useBlobDetail(selectedKey);
    const { data: pixels, isLoading: pixelsLoading } = useBlobData(selected?.natural_key);
    const isImageLoading = detailLoading || pixelsLoading;

    // null means "use the backend-computed zscale range"
    const [scaleOverride, setScaleOverride] = useState<{ vmin: number, vmax: number } | null>(null);
    const [scaleModalOpen, setScaleModalOpen] = useState(false);
    useEffect(() => {
        setScaleOverride(null);
    }, [selectedKey]);
    const effectiveVmin = scaleOverride?.vmin ?? selected?.vmin ?? 0;
    const effectiveVmax = scaleOverride?.vmax ?? selected?.vmax ?? 1;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // fitScale: source-px -> displayed-px ratio that fits the whole image in the container at zoom 1
    const [fitScale, setFitScale] = useState(1);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 }); // top-left of the image, container-relative px
    const zoomRef = useRef(zoom);
    const panRef = useRef(pan);
    zoomRef.current = zoom;
    panRef.current = pan;

    // recompute fit-to-container scale whenever the container or the selected image's size changes
    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el || !selected) return;
        function recompute() {
            const el2 = containerRef.current;
            if (!el2 || !selected) return;
            const scale = Math.min(el2.clientWidth / selected.width, el2.clientHeight / selected.height) || 1;
            setFitScale(scale);
            setZoom(1);
            setPan({
                x: (el2.clientWidth - selected.width * scale) / 2,
                y: (el2.clientHeight - selected.height * scale) / 2,
            });
        }
        recompute();
        const observer = new ResizeObserver(recompute);
        observer.observe(el);
        return () => observer.disconnect();
    }, [selected?.natural_key, selected?.width, selected?.height]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        function onWheel(e: WheelEvent) {
            e.preventDefault();
            const rect = el!.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const oldZoom = zoomRef.current;
            const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldZoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
            if (newZoom === oldZoom) return;

            const oldPan = panRef.current;
            // point in source-image space currently under the cursor, then re-anchor it under the cursor at the new zoom
            const imgX = (mouseX - oldPan.x) / (fitScale * oldZoom);
            const imgY = (mouseY - oldPan.y) / (fitScale * oldZoom);
            const newPan = {
                x: mouseX - imgX * fitScale * newZoom,
                y: mouseY - imgY * fitScale * newZoom,
            };

            zoomRef.current = newZoom;
            panRef.current = newPan;
            setZoom(newZoom);
            setPan(newPan);
        }
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [fitScale]);

    const [hover, setHover] = useState<{ x: number, y: number, value: number } | null>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el || !selected || !pixels) return;
        function onMouseMove(e: MouseEvent) {
            const rect = el!.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const totalScale = fitScale * zoomRef.current;
            const pan = panRef.current;

            const col = Math.floor((mouseX - pan.x) / totalScale);
            const canvasRow = Math.floor((mouseY - pan.y) / totalScale);
            if (col < 0 || col >= selected!.width || canvasRow < 0 || canvasRow >= selected!.height) {
                setHover(null);
                return;
            }
            setHover({ x: col, y: canvasRow, value: pixels![canvasRow * selected!.width + col] });
        }
        function onMouseLeave() {
            setHover(null);
        }
        el.addEventListener('mousemove', onMouseMove);
        el.addEventListener('mouseleave', onMouseLeave);
        return () => {
            el.removeEventListener('mousemove', onMouseMove);
            el.removeEventListener('mouseleave', onMouseLeave);
        };
    }, [selected, pixels, fitScale]);

    const dragRef = useRef<{ x: number, y: number, pan: { x: number, y: number } } | null>(null);
    const [isPanning, setIsPanning] = useState(false);

    function onMouseDown(e: React.MouseEvent) {
        if (e.button !== 0) return;
        dragRef.current = { x: e.clientX, y: e.clientY, pan: panRef.current };
        setIsPanning(true);
    }

    useEffect(() => {
        if (!isPanning) return;
        function onMouseMove(e: MouseEvent) {
            const drag = dragRef.current;
            if (!drag) return;
            const newPan = { x: drag.pan.x + (e.clientX - drag.x), y: drag.pan.y + (e.clientY - drag.y) };
            panRef.current = newPan;
            setPan(newPan);
        }
        function onMouseUp() {
            dragRef.current = null;
            setIsPanning(false);
        }
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [isPanning]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !selected || !pixels) return;
        const tDraw0 = performance.now();

        canvas.width = selected.width;
        canvas.height = selected.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imgData = ctx.createImageData(selected.width, selected.height);
        const vmin = effectiveVmin;
        const vmax = effectiveVmax;
        const scale = 255 / ((vmax - vmin) || 1);

        for (let row = 0; row < selected.height; row++) {
            for (let col = 0; col < selected.width; col++) {
                const v = Math.max(0, Math.min(255, (pixels[row * selected.width + col] - vmin) * scale));
                const o = (row * selected.width + col) * 4;
                imgData.data[o] = v;
                imgData.data[o + 1] = v;
                imgData.data[o + 2] = v;
                imgData.data[o + 3] = 255;
            }
        }
        const tLoop = performance.now();
        ctx.putImageData(imgData, 0, 0);
        const tPut = performance.now();
        console.log(`[ImageViewer] pixel loop: ${(tLoop - tDraw0).toFixed(1)}ms | putImageData: ${(tPut - tLoop).toFixed(1)}ms | total draw: ${(tPut - tDraw0).toFixed(1)}ms`);
    }, [pixels, selected, effectiveVmin, effectiveVmax]);

    if (blobsLoading) {
        return <Skeleton variant="rectangular" width="100%" sx={{ aspectRatio: 1 }} />;
    }

    if (images.length === 0) {
        return <Typography variant="body2" color="text.secondary">No images available</Typography>;
    }

    return (
        <Stack spacing={1} sx={{ width: '100%', height: '100%', flexGrow: 1, minHeight: 0 }}>
            <Select size="small" value={selectedKey ?? ''} onChange={(e) => setSelectedKey(e.target.value)} sx={{ minWidth: 240, flexShrink: 0 }}>
                {images.map((b) => (
                    <MenuItem key={b.natural_key} value={b.natural_key}>
                        {b.image_name?.slice(NAME_PREFIX.length) ?? '?'}
                    </MenuItem>
                ))}
            </Select>
            <Box
                ref={containerRef}
                onMouseDown={onMouseDown}
                sx={{
                    width: '100%', flexGrow: 1, minHeight: 0,
                    position: 'relative', overflow: 'hidden',
                    cursor: isPanning ? 'grabbing' : 'grab',
                    userSelect: isPanning ? 'none' : 'auto',
                }}
            >
                {isImageLoading && <Skeleton variant="rectangular" width="100%" height="100%" sx={{ position: 'absolute', inset: 0 }} />}
                <canvas
                    ref={canvasRef}
                    style={{
                        display: isImageLoading || !selected ? 'none' : 'block',
                        position: 'absolute',
                        left: pan.x, top: pan.y,
                        width: selected ? selected.width * fitScale * zoom : 0,
                        height: selected ? selected.height * fitScale * zoom : 0,
                        imageRendering: 'pixelated',
                    }}
                />
                {!isImageLoading && selected && showMarks && (
                    <svg
                        viewBox={`0 0 ${selected.width} ${selected.height}`}
                        style={{
                            position: 'absolute',
                            left: pan.x, top: pan.y,
                            width: selected.width * fitScale * zoom,
                            height: selected.height * fitScale * zoom,
                            pointerEvents: 'none',
                        }}
                    >
                        {objectPositions?.filter((o) => o.x != null && o.y != null).map((o) => {
                            const r = 20;
                            return (
                                <g key={o.natural_key} stroke="red" strokeWidth={4}>
                                    <line x1={o.x! - r} y1={o.y! - r} x2={o.x! + r} y2={o.y! + r} />
                                    <line x1={o.x! - r} y1={o.y! + r} x2={o.x! + r} y2={o.y! - r} />
                                </g>
                            );
                        })}
                    </svg>
                )}
                <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'stretch', gap: 1 }}>
                    <Box
                        sx={{
                            backgroundColor: 'rgba(0, 0, 0, 0.7)', color: '#fff',
                            borderRadius: 1, padding: '4px 8px',
                            fontFamily: 'monospace', fontSize: 12, lineHeight: 1.4,
                            pointerEvents: 'none',
                        }}
                    >
                        <div>{`x: ${hover?.x ?? '—'}  y: ${hover?.y ?? '—'}`}</div>
                        <div>{`value: ${hover ? hover.value.toFixed(3) : '—'}`}</div>
                    </Box>
                    <Tooltip title="Adjust scaling">
                        <IconButton
                            onClick={() => setScaleModalOpen(true)}
                            size="small"
                            sx={{
                                backgroundColor: 'rgba(0, 0, 0, 0.7)', color: '#fff', borderRadius: 1,
                                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.85)' },
                            }}
                        >
                            <EqualizerIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={showMarks ? 'Hide object markers' : 'Show object markers'}>
                        <IconButton
                            onClick={() => setShowMarks((current) => !current)}
                            size="small"
                            sx={{
                                backgroundColor: 'rgba(0, 0, 0, 0.7)', color: showMarks ? 'red' : '#fff', borderRadius: 1,
                                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.85)' },
                            }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
                {onToggleFullscreen && (
                    <Tooltip title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                        <IconButton
                            onClick={onToggleFullscreen}
                            size="small"
                            sx={{
                                position: 'absolute', top: 8, right: 8,
                                backgroundColor: 'rgba(0, 0, 0, 0.7)', color: '#fff',
                                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.85)' },
                            }}
                        >
                            {fullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
            <Dialog open={scaleModalOpen} onClose={() => setScaleModalOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Adjust Scaling</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Lower bound"
                            type="number"
                            size="small"
                            value={effectiveVmin}
                            onChange={(e) => setScaleOverride({ vmin: Number(e.target.value), vmax: effectiveVmax })}
                        />
                        <TextField
                            label="Upper bound"
                            type="number"
                            size="small"
                            value={effectiveVmax}
                            onChange={(e) => setScaleOverride({ vmin: effectiveVmin, vmax: Number(e.target.value) })}
                        />
                        <Button size="small" onClick={() => setScaleOverride(null)} sx={{ alignSelf: 'flex-start' }}>
                            Reset to zscale
                        </Button>
                    </Stack>
                </DialogContent>
            </Dialog>
        </Stack>
    );
}
