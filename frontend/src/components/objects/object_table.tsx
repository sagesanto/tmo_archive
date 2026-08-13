import { Object } from "@api/object";
import { AppRoutes } from "@config/routes";
import { Link } from "react-router";
import { ObjectCardContent } from "./object_card";
import { CardContainer, VirtualizedCardList } from "@components/general";

export function ObjectTable({ objects, hasNextPage, loadNextPage, nObj, selected, setSelected }: { objects: Array<Object>, hasNextPage: boolean, loadNextPage: () => void, nObj: number, selected: Array<Object>, setSelected: React.Dispatch<React.SetStateAction<Object[]>> }) {
    return (
        <VirtualizedCardList
            items={objects}
            hasNextPage={hasNextPage}
            loadNextPage={loadNextPage}
            nObj={nObj}
            getKey={(obj) => obj.id}
            renderItem={(obj) => (
                // the "'&:hover .hover-child': {opacity: 100}" part makes the go-to-object icon visible on hover
                <Link to={`${AppRoutes.objects}/${obj.natural_key}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <CardContainer sx={{ '&:hover .hover-child': { opacity: 100 }, width: "98%" }}>
                        <ObjectCardContent obj={obj} />
                    </CardContainer>
                </Link>
            )}
        />
    );
}
