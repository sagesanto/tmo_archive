import { useSelector } from "react-redux";
import { axios } from "./axios";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, InfiniteData, keepPreviousData } from "@tanstack/react-query";
import { Page, offsetParams } from "./pagination";
import pagination_config from '@config/pagination';

const ENDPOINT = "/objects";

export type Object = {
    id: number;
    analysis_run_id: number;
    blob_ref_id: number | null;
    natural_key: string;
    display_name: string;

    snr: number
    type: string
    classification: string
    magnitude: number | null
    num_frames: number
    cluster_children: number

    v_ra: number | null
    v_dec: number | null
    ra: number | null
    dec: number | null

    source_key: Record<string, unknown>
    analysis_time: string
    analysis_run_key: string | null
    results_db_key: string | null
    dataset_key: string
    obs_time: string
}

export function getObject(natural_key: string) {
    const queryKey = ["object", natural_key];
    return useQuery<Object, Error>({
        queryKey: queryKey,
        queryFn: () => webGetObject(natural_key),
    });
}

function makeInfiniteQuery(queryKey: readonly unknown[], queryFn: (context: { pageParam: number }) => Promise<Page<Object[]>>) {
    return useInfiniteQuery<Page<Object[]>, Error, InfiniteData<Page<Object[]>, number>, readonly unknown[], number>({
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

export type ObjectsParams = {
    analysis_key?: string;
    dataset_id?: number;
    results_db_id?: number;
    classification?: string | null;
    min_snr?: number | null;
    sort?: string;
}

export function getObjects(params: ObjectsParams = {}) {
    const queryKey = ["objects", params];
    return makeInfiniteQuery(queryKey, ({ pageParam = 1 }) => webGetObjects(pageParam, params))
}

async function webGetObject(
    natural_key: string,
    options?: { signal?: AbortSignal },
) {
    const { data } = await axios.get<Object[]>(ENDPOINT, { params: { natural_key }, signal: options?.signal });
    if (data.length === 0) {
        throw new Error("Object not found");
    }
    return data[0];
}

async function webGetObjects(
    pageParam: number,
    params: ObjectsParams,
    options?: { signal?: AbortSignal },
): Promise<Page<Object[]>> {
    const limit = pagination_config.obj_per_page;
    const { data } = await axios.get<Object[]>(ENDPOINT, { params: { ...offsetParams(pageParam, limit), ...params }, signal: options?.signal });
    return { records: data, page: pageParam, hasMore: data.length === limit };
}
