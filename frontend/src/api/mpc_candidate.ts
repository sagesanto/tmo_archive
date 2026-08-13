import { useSelector } from "react-redux";
import { axios } from "./axios";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, InfiniteData, keepPreviousData } from "@tanstack/react-query";
import { Page, offsetParams } from "./pagination";
import pagination_config from '@config/pagination';

const ENDPOINT = "/mpc/candidates";

export type MPCCandidate = {
    id: number;
    designation: string;
}

export function getMPCCandidate(designation: string) {
    const queryKey = ["mpc_Candidate", designation];
    return useQuery<MPCCandidate, Error>({
        queryKey: queryKey,
        queryFn: () => webGetMPCCandidate(designation),
    });
}

async function webGetMPCCandidate(
    designation: string,
    options?: { signal?: AbortSignal },
) {
    const { data } = await axios.get<MPCCandidate[]>(ENDPOINT, { params: { designation }, signal: options?.signal });
    if (data.length === 0) {
        throw new Error("MPC not found");
    }
    return data[0];
}

function makeInfiniteQuery(queryKey: readonly unknown[], queryFn: (context: { pageParam: number }) => Promise<Page<Analysis[]>>) {
    return useInfiniteQuery<Page<MPCCandidate[]>, Error, InfiniteData<Page<Analysis[]>, number>, readonly unknown[], number>({
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

export type CandidateParams = {
    designation?: string | null;
    sort?: string;
}

export function getCandidates(params: CandidateParams = {}) {
    const queryKey = ["candidates", params];
    return makeInfiniteQuery(queryKey, ({ pageParam = 1 }) => webGetCandidates(pageParam, params))
}

async function webGetCandidates(
    pageParam: number,
    params: CandidateParams,
    options?: { signal?: AbortSignal },
): Promise<Page<MPCCandidate[]>> {
    const limit = pagination_config.obj_per_page;
    const { data } = await axios.get<MPCCandidate[]>(ENDPOINT, { params: { ...offsetParams(pageParam, limit), ...params }, signal: options?.signal });
    return { records: data, page: pageParam, hasMore: data.length === limit };
}