import { Box } from "@mui/material";
import { forwardRef, useEffect, useRef, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import InfiniteLoader from 'react-window-infinite-loader';
import { FixedSizeList } from 'react-window';
import { MediumLoadingCard } from "./cards";

const GUTTER_SIZE = 18;

// shared by object/observation tables
export function VirtualizedCardList<T>({ items, hasNextPage, loadNextPage, nObj, getKey, renderItem }: {
    items: T[],
    hasNextPage: boolean,
    loadNextPage: () => void,
    nObj: number,
    getKey: (item: T) => string | number,
    renderItem: (item: T) => React.ReactNode,
}) {
    const rowRef = useRef<HTMLDivElement>(null);
    const [rowHeight, setRowHeight] = useState(48); // fallback default

    useEffect(() => {
        if (!rowRef.current) return;
        const observer = new ResizeObserver((entries) => {
            const height = entries[0].contentRect.height;
            if (!isNaN(height) && height > 0) {
                setRowHeight(height);
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
            <Box sx={{ flexGrow: 1, minHeight: 0, width: "100%" }}>
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
                                    ref={ref}
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
