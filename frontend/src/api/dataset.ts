import { axios } from "./axios";
import { useInfiniteQuery, useQuery, InfiniteData, keepPreviousData } from "@tanstack/react-query";
import { Page, offsetParams } from "./pagination";
import pagination_config from '@config/pagination';

const ENDPOINT = "/datasets";

export type Dataset = {
    id: number;
    natural_key: string;
    display_name: string;
    acq_system_id: number;
    acq_timestamp: number;
    acq_num_1: number;
    acq_num_2: number;
    obs_name: string | null;
    n_runs: number;
}

export function getDataset(natural_key: string) {
    const queryKey = ["dataset", natural_key];
    return useQuery<Dataset, Error>({
        queryKey: queryKey,
        queryFn: () => webGetDataset(natural_key),
    });
}

function makeInfiniteQuery(queryKey: readonly unknown[], queryFn: (context: { pageParam: number }) => Promise<Page<Dataset[]>>) {
    return useInfiniteQuery<Page<Dataset[]>, Error, InfiniteData<Page<Dataset[]>, number>, readonly unknown[], number>({
        initialPageParam: 1,
        queryKey: queryKey,
        queryFn: queryFn,
        placeholderData: keepPreviousData,
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

export type DatasetsParams = {
    search?: string;
    sort?: string;
}

export function getDatasets(params: DatasetsParams = {}) {
    const queryKey = ["datasets", params];
    return makeInfiniteQuery(queryKey, ({ pageParam = 1 }) => webGetDatasets(pageParam, params))
}

async function webGetDataset(
    natural_key: string,
    options?: { signal?: AbortSignal },
) {
    const { data } = await axios.get<Dataset[]>(ENDPOINT, { params: { natural_key }, signal: options?.signal });
    if (data.length === 0) {
        throw new Error("Dataset not found");
    }
    return data[0];
}

async function webGetDatasets(
    pageParam: number,
    params: DatasetsParams,
    options?: { signal?: AbortSignal },
): Promise<Page<Dataset[]>> {
    const limit = pagination_config.obj_per_page;
    const { data } = await axios.get<Dataset[]>(ENDPOINT, { params: { ...offsetParams(pageParam, limit), ...params }, signal: options?.signal });
    return { records: data, page: pageParam, hasMore: data.length === limit };
}
