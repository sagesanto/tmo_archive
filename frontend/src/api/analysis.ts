import { useSelector } from "react-redux";
import { axios } from "./axios";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, InfiniteData, keepPreviousData } from "@tanstack/react-query";
import { Page, offsetParams } from "./pagination";
import pagination_config from '@config/pagination';

const ENDPOINT = "/analyses";

export type Analysis = {
    id: number;
    natural_key: string;
    display_name: string;
    analysis_id: number;
    observation_id: number;
    observation_key: string;
    results_db_id: number;
    results_db_key: string | null;
    status: string;
    status_description: string;

    analysis_time: string
    obs_time: string

    n_objects: number | null
    metrics: Record<string, unknown> | null
}

export function getAnalysis(natural_key: string) {
    const queryKey = ["analysis", natural_key];
    return useQuery<Analysis, Error>({
        queryKey: queryKey,
        queryFn: () => webGetAnalysis(natural_key),
    });
}

function makeInfiniteQuery(queryKey: readonly unknown[], queryFn: (context: { pageParam: number }) => Promise<Page<Analysis[]>>) {
    return useInfiniteQuery<Page<Analysis[]>, Error, InfiniteData<Page<Analysis[]>, number>, readonly unknown[], number>({
        initialPageParam: 1,
        queryKey: queryKey,
        queryFn: queryFn,
        placeholderData: keepPreviousData,
        // maxPages: pagination_config.max_in_mem / pagination_config.obj_per_page,
        getNextPageParam: (lastPage) => {
            if (lastPage.hasMore) {
                return lastPage.page + 1;
            }
            return undefined;
        },
        getPreviousPageParam: (firstPage) => {
            if (firstPage.page > 1) {
                return firstPage.page - 1;
            }
            return undefined;
        }
    });
}

export type AnalysesParams = {
    status?: string | null;
    observation_id?: number;
    results_db_id?: number;
    sort?: string;
}

export function getAnalyses(params: AnalysesParams = {}) {
    const queryKey = ["analyses", params];
    return makeInfiniteQuery(queryKey, ({ pageParam = 1 }) => webGetAnalyses(pageParam, params))
}

// export function getObjectsByRun(id: number) {
//     const queryKey = ["objectsByCatalog", id];
//     return makeInfiniteQuery(queryKey, ({ pageParam = 1 }) => webGetObjectsByCatalog(id, pageParam))
// }

// export function getObjectsByProposal(id: number) {
//     const queryKey = ["objectsByProposal", id];
//     return makeInfiniteQuery(queryKey, ({ pageParam = 1 }) => webGetObjectsByProposal(id, pageParam))
// }

// export function getObjectsByFlag(id: number) {
//     const queryKey = ["objectsByFlag", id];
//     return makeInfiniteQuery(queryKey, ({ pageParam = 1 }) => webGetObjectsByFlag(id, pageParam))
// }

async function webGetAnalysis(
    natural_key: string,
    options?: { signal?: AbortSignal },
) {
    const { data } = await axios.get<Analysis[]>(ENDPOINT, { params: { natural_key }, signal: options?.signal });
    if (data.length === 0) {
        throw new Error("Analysis not found");
    }
    return data[0];
}

async function webGetAnalyses(
    pageParam: number,
    params: AnalysesParams,
    options?: { signal?: AbortSignal },
): Promise<Page<Analysis[]>> {
    const limit = pagination_config.obj_per_page;
    const { data } = await axios.get<Analysis[]>(ENDPOINT, { params: { ...offsetParams(pageParam, limit), ...params }, signal: options?.signal });
    return { records: data, page: pageParam, hasMore: data.length === limit };
}