import { Box } from "@mui/material";
import { forwardRef, useEffect, useRef, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import InfiniteLoader from 'react-window-infinite-loader';
import { FixedSizeList } from 'react-window';
import { MediumLoadingCard } from "./cards";

const GUTTER_SIZE = 18;

// shared by object/observation tables
export function VirtualizedCardList<T>({ items, hasNextPage, loadNextPage, nObj, getKey, renderItem, scrollAnchorKey = null, scrollAnchorOffset = 0, onAnchorScrolled, onScrollOffsetChange }: {
    items: T[],
    hasNextPage: boolean,
    loadNextPage: () => void,
    nObj: number,
    getKey: (item: T) => string | number,
    renderItem: (item: T) => React.ReactNode,
    scrollAnchorKey?: string | number | null, // item to page in far enough to restore scroll near (e.g. after returning from a detail page)
    scrollAnchorOffset?: number, // exact pixel offset to restore, so the view lands where it actually was rather than re-centering on the item
    onAnchorScrolled?: () => void,
    onScrollOffsetChange?: (offset: number) => void, // reports current scroll offset so a caller can remember it
}) {
    const rowRef = useRef<HTMLDivElement>(null);
    // state (not a plain ref) so that AutoSizer/InfiniteLoader attaching the list ref
    // after their own measurement pass re-triggers the anchor-scroll effect below
    const [listInstance, setListInstance] = useState<FixedSizeList | null>(null);
    const [rowHeight, setRowHeight] = useState(48); // fallback default
    // whether the real row height has been measured yet
    const [measured, setMeasured] = useState(false);
    // whether a pending scroll-to-anchor has been applied (or there was none to apply)
    const [scrolled, setScrolled] = useState(scrollAnchorKey == null);
    // the list stays mounted throughout (avoids remounting/blinking) but is kept invisible
    // until it's both correctly sized and, if returning to a remembered position, scrolled there
    const ready = items.length === 0 || (measured && scrolled);

    // restore the exact scroll offset the list was at when the anchor item was clicked, rather than
    // re-finding the item and centering on it (which lands somewhere different than where it actually was).
    // the item lookup is only used to decide whether enough pages have loaded to trust that offset yet.
    const anchorHandled = useRef(false);
    useEffect(() => {
        if (anchorHandled.current || scrollAnchorKey == null || !listInstance || !measured) return;
        const found = items.some((item) => getKey(item) === scrollAnchorKey);
        if (found || !hasNextPage) {
            anchorHandled.current = true;
            listInstance.scrollTo(scrollAnchorOffset);
            setScrolled(true);
            onAnchorScrolled?.();
        } else {
            loadNextPage();
        }
    }, [items, hasNextPage, scrollAnchorKey, scrollAnchorOffset, listInstance, measured]);

    useEffect(() => {
        if (!rowRef.current) return;
        const observer = new ResizeObserver((entries) => {
            const height = entries[0].contentRect.height;
            if (!isNaN(height) && height > 0) {
                setRowHeight(height);
                setMeasured(true);
            }
        });
        observer.observe(rowRef.current);
        return () => observer.disconnect();
    }, []);

    function isItemLoaded(index: number) {
        return !hasNextPage || index < items.length;
    }
    const itemCount = hasNextPage ? items.length + 1 : items.length;

    const ItemRenderer = ({ index, style }) => {
        const fullStyle = {
            ...style,
            top: style.top + GUTTER_SIZE,
            paddingLeft: 10, paddingRight: -10
        }

        if (index >= items.length) {
            if (index >= nObj) {
                return <div style={fullStyle}></div>;
            }
            return ( // loading row
                <div style={fullStyle}>
                    <MediumLoadingCard />
                </div>
            );
        }
        const item = items[index];
        return (
            <div style={fullStyle} key={getKey(item)}>
                {renderItem(item)}
            </div>
        );
    }

    const innerElementType = forwardRef(({ style, ...rest }, ref) => (
        <div
            style={{
                ...style,
                paddingTop: GUTTER_SIZE,
                paddingLeft: GUTTER_SIZE,
                paddingRight: GUTTER_SIZE,
            }}
            ref={ref}
            {...rest}
        />
    ));

    return (
        <Box sx={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
            {items.length > 0 && (
                <div ref={rowRef} style={{ visibility: "hidden", position: "absolute", width: "100%" }}>
                    {renderItem(items[0])}
                </div>
            )}
            <Box sx={{ flexGrow: 1, minHeight: 0, width: "100%", visibility: ready ? "visible" : "hidden" }}>
                <AutoSizer>
                    {({ height, width }) => (
                        <InfiniteLoader
                            isItemLoaded={isItemLoaded}
                            loadMoreItems={loadNextPage}
                            itemCount={itemCount}
                        >
                            {({ onItemsRendered, ref }) => (
                                <FixedSizeList
                                    onItemsRendered={onItemsRendered}
                                    onScroll={({ scrollOffset }) => onScrollOffsetChange?.(scrollOffset)}
                                    ref={(list) => { setListInstance(list); ref(list); }}
                                    height={height}
                                    width={width}
                                    layout="vertical"
                                    itemSize={rowHeight + 2 * GUTTER_SIZE}
                                    overscanCount={5}
                                    itemCount={nObj}
                                    innerElementType={innerElementType}
                                >
                                    {ItemRenderer}
                                </FixedSizeList>
                            )}
                        </InfiniteLoader>
                    )}
                </AutoSizer>
            </Box>
        </Box>
    );
}
