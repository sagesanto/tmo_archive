import { axios } from "./axios";
import { useInfiniteQuery, useQuery, InfiniteData, keepPreviousData } from "@tanstack/react-query";
import { Page, offsetParams } from "./pagination";
import pagination_config from '@config/pagination';

const ENDPOINT = "/results_dbs";

export type ResultsDB = {
    id: number;
    natural_key: string;
    display_name: string;
    filename: string | null;
    filesize: number | null;
    last_file_update: string | null;
    date_ingested: string;
    date_updated: string;
    n_runs: number;
}

export function getResultsDB(natural_key: string) {
    const queryKey = ["results_db", natural_key];
    return useQuery<ResultsDB, Error>({
        queryKey: queryKey,
        queryFn: () => webGetResultsDB(natural_key),
    });
}

function makeInfiniteQuery(queryKey: readonly unknown[], queryFn: (context: { pageParam: number }) => Promise<Page<ResultsDB[]>>) {
    return useInfiniteQuery<Page<ResultsDB[]>, Error, InfiniteData<Page<ResultsDB[]>, number>, readonly unknown[], number>({
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

export type ResultsDBsParams = {
    search?: string;
    sort?: string;
}

export function getResultsDBs(params: ResultsDBsParams = {}) {
    const queryKey = ["results_dbs", params];
    return makeInfiniteQuery(queryKey, ({ pageParam = 1 }) => webGetResultsDBs(pageParam, params))
}

async function webGetResultsDB(
    natural_key: string,
    options?: { signal?: AbortSignal },
) {
    const { data } = await axios.get<ResultsDB[]>(ENDPOINT, { params: { natural_key }, signal: options?.signal });
    if (data.length === 0) {
        throw new Error("ResultsDB not found");
    }
    return data[0];
}

async function webGetResultsDBs(
    pageParam: number,
    params: ResultsDBsParams,
    options?: { signal?: AbortSignal },
): Promise<Page<ResultsDB[]>> {
    const limit = pagination_config.obj_per_page;
    const { data } = await axios.get<ResultsDB[]>(ENDPOINT, { params: { ...offsetParams(pageParam, limit), ...params }, signal: options?.signal });
    return { records: data, page: pageParam, hasMore: data.length === limit };
}
