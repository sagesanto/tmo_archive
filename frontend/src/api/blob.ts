import { useSelector } from "react-redux";
import { axios } from "./axios";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { Page, offsetParams } from "./pagination";
import pagination_config from '@config/pagination';

const ENDPOINT = "/blobs";

export type BlobRef = {
    id: number;
    natural_key: string;
    analysis_run_id: number;
    source_table: string;

    width: number;
    height: number;
    size_class: string;
    
    thumbnail_url: string;
    analysis_run_key: string;
}

export function getBlob(natural_key: string) {
    const queryKey = ["object", natural_key];
    return useQuery<Object, Error>({
        queryKey: queryKey,
        queryFn: () => webGetBlob(natural_key),
    });
}

function makeInfiniteQuery(queryKey: readonly unknown[], queryFn: (context: { pageParam: number }) => Promise<Page<Object[]>>) {
    return useInfiniteQuery<Page<Object[]>, Error, InfiniteData<Page<Object[]>, number>, readonly unknown[], number>({
        initialPageParam: 1,
        queryKey: queryKey,
        queryFn: queryFn,
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

export function getObjects() {
    const queryKey = ["objects"];
    return makeInfiniteQuery(queryKey, ({ pageParam = 1 }) => webGetObjects(pageParam))

}

// export function getBlobByAnalysis(natural_key: string) {
//     const queryKey = ["blobByAnalysis", natural_key];
//     return makeInfiniteQuery(queryKey, ({ pageParam = 1 }) => webGetObjectsByAnalysis(natural_key, pageParam))
// }

export function getBlobByObject(object_key: string) {
    const queryKey = ["blobByObject", object_key];
    return useQuery<BlobRef, Error>({
        queryKey: queryKey,
        queryFn: () => webGetBlobByObject(object_key),
    });
}

async function webGetBlob(
    natural_key:string,
    options?: { signal?: AbortSignal },
) {
    const { data } = await axios.get<BlobRef[]>(ENDPOINT, { params: { natural_key }, signal: options?.signal });
    if (data.length === 0) {
        throw new Error("Blob not found");
    }
    return data[0];
}

async function webGetObjects(
    pageParam: number,
    options?: { signal?: AbortSignal },
): Promise<Page<Object[]>> {
    const limit = pagination_config.obj_per_page;
    const { data } = await axios.get<Object[]>(ENDPOINT, { params: offsetParams(pageParam, limit), signal: options?.signal });
    return { records: data, page: pageParam, hasMore: data.length === limit };
}

async function webGetObjectsByAnalysis(
    natural_key:string,
    pageParam: number,
    options?: { signal?: AbortSignal },
): Promise<Page<Object[]>> {
    const limit = pagination_config.obj_per_page;
    const { data } = await axios.get<Object[]>(ENDPOINT, { params: { ...offsetParams(pageParam, limit), ...{analysis_key : natural_key} } , signal: options?.signal });
    return { records: data, page: pageParam, hasMore: data.length === limit };
}

async function webGetBlobByObject(
    object_key:string,
    options?: { signal?: AbortSignal },
) {
    const { data } = await axios.get<BlobRef[]>(ENDPOINT, { params: { object_key }, signal: options?.signal });
    if (data.length === 0) {
        throw new Error("Blob not found");
    }
    return data[0];
}