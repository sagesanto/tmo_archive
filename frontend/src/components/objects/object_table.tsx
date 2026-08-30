import { Object } from "@api/object";
import { AppRoutes } from "@config/routes";
import { Link } from "react-router";
import { ObjectCardContent } from "./object_card";
import { CardContainer, VirtualizedCardList } from "@components/general";
import { useRef, useState } from "react";

// remembers which object was last opened and where the list was scrolled, so it can be restored on return
const SCROLL_ANCHOR_KEY = "object_table_scroll_anchor";
const SCROLL_OFFSET_KEY = "object_table_scroll_offset";

export function ObjectTable({ objects, hasNextPage, loadNextPage, nObj, selected, setSelected }: { objects: Array<Object>, hasNextPage: boolean, loadNextPage: () => void, nObj: number, selected: Array<Object>, setSelected: React.Dispatch<React.SetStateAction<Object[]>> }) {
    const [scrollAnchorId] = useState<number | null>(() => {
        const stored = sessionStorage.getItem(SCROLL_ANCHOR_KEY);
        return stored ? Number(stored) : null;
    });
    const [scrollAnchorOffset] = useState<number>(() => Number(sessionStorage.getItem(SCROLL_OFFSET_KEY) ?? 0));
    const currentOffset = useRef(0);

    return (
        <VirtualizedCardList
            items={objects}
            hasNextPage={hasNextPage}
            loadNextPage={loadNextPage}
            nObj={nObj}
            getKey={(obj) => obj.id}
            scrollAnchorKey={scrollAnchorId}
            scrollAnchorOffset={scrollAnchorOffset}
            onScrollOffsetChange={(offset) => { currentOffset.current = offset; }}
            onAnchorScrolled={() => {
                sessionStorage.removeItem(SCROLL_ANCHOR_KEY);
                sessionStorage.removeItem(SCROLL_OFFSET_KEY);
            }}
            renderItem={(obj) => (
                // the "'&:hover .hover-child': {opacity: 100}" part makes the go-to-object icon visible on hover
                <Link
                    to={`${AppRoutes.objects}/${obj.natural_key}`}
                    onClick={() => {
                        sessionStorage.setItem(SCROLL_ANCHOR_KEY, String(obj.id));
                        sessionStorage.setItem(SCROLL_OFFSET_KEY, String(currentOffset.current));
                    }}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                >
                    <CardContainer sx={{ '&:hover .hover-child': { opacity: 100 }, width: "98%" }}>
                        <ObjectCardContent obj={obj} />
                    </CardContainer>
                </Link>
            )}
        />
    );
}
