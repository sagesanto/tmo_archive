import { Observation } from "@api/observation";
import { AppRoutes } from "@config/routes";
import { Link } from "react-router";
import { ObservationCardContent } from "./observation_card";
import { CardContainer, VirtualizedCardList } from "@components/general";

export function ObservationTable({ observations, hasNextPage, loadNextPage, nObj }: { observations: Array<Observation>, hasNextPage: boolean, loadNextPage: () => void, nObj: number }) {
    return (
        <VirtualizedCardList
            items={observations}
            hasNextPage={hasNextPage}
            loadNextPage={loadNextPage}
            nObj={nObj}
            getKey={(observation) => observation.id}
            renderItem={(observation) => (
                <Link to={`${AppRoutes.observations}/${observation.natural_key}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <CardContainer sx={{ '&:hover .hover-child': { opacity: 100 }, width: "98%" }}>
                        <ObservationCardContent observation={observation} />
                    </CardContainer>
                </Link>
            )}
        />
    );
}
