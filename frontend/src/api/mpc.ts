import { axios } from "./axios";
import { useQuery } from "@tanstack/react-query";

const ENDPOINT = "/mpc/info";

export type MPCIdentification = {
    trksub: string;
    iau_desig: string|null;
    status: string;
    reference: string|null;
    datetime_ut: string|null;
    desig_page: string|null;
    reference_page: string|null;
    status_name: string;
}

export function getMPCIdentification(designation: string) {
    const queryKey = ["mpc_info", designation];
    return useQuery<MPCIdentification, Error>({
        queryKey: queryKey,
        queryFn: () => webGetMPCIdentification(designation),
    });
}

async function webGetMPCIdentification(designation: string, options?: { signal?: AbortSignal }) {
    const { data } = await axios.get<MPCIdentification>(ENDPOINT, { params: { designation }, signal: options?.signal });
    return data;
}
