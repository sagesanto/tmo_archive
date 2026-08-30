import { useSelector } from "react-redux";
import { axios } from "./axios";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, InfiniteData, keepPreviousData } from "@tanstack/react-query";
import { Page, offsetParams } from "./pagination";
import pagination_config from '@config/pagination';

const ENDPOINT = "/mpc/encounters";

export type MPCEncounter = {
    id: number;
    designation: string;
    observation_id: number;
    mpc_candidate_id: number;

    d_ra: number;
    d_dec: number;
}

export type SingleEncounterParams = {
    object_key?: string;
    observation_id?: number;
    analysis_id?: number;
}

export function getMPCEncounter(params: SingleEncounterParams, enabled: boolean = true) {
    const queryKey = ["mpc_encounter", params];
    return useQuery<MPCEncounter, Error>({
        queryKey: queryKey,
        queryFn: () => webGetMPCEncounter(params),
        enabled,
    });
}

async function webGetMPCEncounter(
    params: SingleEncounterParams,
    options?: { signal?: AbortSignal },
) {
    const { data } = await axios.get<MPCEncounter[]>(ENDPOINT, { params: { ...params }, signal: options?.signal });
    if (data.length === 0) {
        throw new Error("MPC not found");
    }
    return data[0];
}

function makeInfiniteQuery(queryKey: readonly unknown[], queryFn: (context: { pageParam: number }) => Promise<Page<Analysis[]>>) {
    return useInfiniteQuery<Page<MPCEncounter[]>, Error, InfiniteData<Page<Analysis[]>, number>, readonly unknown[], number>({
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

export type EncounterParams = {
    designation?: string | null;
    sort?: string;
}

export function getEncounters(params: EncounterParams = {}) {
    const queryKey = ["encounters", params];
    return makeInfiniteQuery(queryKey, ({ pageParam = 1 }) => webGetEncounters(pageParam, params))
}

async function webGetEncounters(
    pageParam: number,
    params: EncounterParams,
    options?: { signal?: AbortSignal },
): Promise<Page<MPCEncounter[]>> {
    const limit = pagination_config.obj_per_page;
    const { data } = await axios.get<MPCEncounter[]>(ENDPOINT, { params: { ...offsetParams(pageParam, limit), ...params }, signal: options?.signal });
    return { records: data, page: pageParam, hasMore: data.length === limit };
}