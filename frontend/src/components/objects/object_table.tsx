import { Object } from "@api/object";
// import { UserChip } from "@components/users";
import { AppRoutes } from "@config/routes";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, Chip, Typography, Box, Paper } from "@mui/material";
import { forwardRef, useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router";
import AutoSizer from "react-virtualized-auto-sizer";
import { ObjectCard, ObjectCardContent } from "./object_card";
import InfiniteLoader from 'react-window-infinite-loader';
import { FixedSizeList } from 'react-window';
import React from "react";
import { MediumLoadingCard, SelectableCardContainer, CardContainer } from "@components/general";

const GUTTER_SIZE = 18;

export function ObjectTable({ objects, hasNextPage, loadNextPage, nObj }: { objects: Array<Object>, hasNextPage: boolean, loadNextPage: () => void, nObj: number }) {

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
        let isLoaded = !hasNextPage || index < objects.length;
        // console.log("isItemLoaded index:", index, "hasNextPage:", hasNextPage, "objects.length:", objects.length, "itemCount:",itemCount, "isLoaded:", isLoaded);
        return isLoaded;
    }
    const itemCount = hasNextPage ? objects.length + 1 : objects.length;

    // console.log("ObjectTable: objects.length:", objects.length, "hasNextPage:", hasNextPage, "nObj:", nObj, "itemCount:", itemCount);


    const ObjRenderer = ({ index, style }) => {
        // console.log("ObjRenderer: index:", index, "style:", style, "objects.length:", objects.length, "nObj:", nObj);


        const fullStyle = {
            ...style,
            top: style.top + GUTTER_SIZE,
            paddingLeft:10, paddingRight:-10
        }

        if (index >= objects.length) {
            if (index >= nObj) {
                console.log("out of bounds draw: index:", index, "objects.length:", objects.length);
                return <div style={fullStyle}></div>;
            }
            return ( // loading row
                <div style={fullStyle}>
                    <MediumLoadingCard />
                </div>
            );
        }
        const obj = objects[index];
        return (
            // the "'&:hover .hover-child': {opacity: 100}" part makes the go-to-object icon visible on hover
            <div style={fullStyle}>
                <Link to={`${AppRoutes.objects}/${obj.natural_key}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <CardContainer sx={{'&:hover .hover-child': {opacity: 100}, width:"98%"}} key={obj.id}>
                        <ObjectCardContent obj={obj} />
                    </CardContainer>
                </Link>
                {/* <ObjectCard id={obj.id} /> */}
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

    let navigate = useNavigate();
    return (
        <Box sx={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
            <div ref={rowRef} style={{ visibility: "hidden", position: "absolute" }}>
                <ObjectCard natural_key={objects[0].natural_key} />
            </div>
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
                                    {ObjRenderer}
                                </FixedSizeList>
                            )}
                        </InfiniteLoader>
                    )}
                </AutoSizer>
            </Box>
        </Box>
    );
}