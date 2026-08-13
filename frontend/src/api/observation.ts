import { axios } from "./axios";
import { useInfiniteQuery, useQuery, InfiniteData, keepPreviousData } from "@tanstack/react-query";
import { Page, offsetParams } from "./pagination";
import pagination_config from '@config/pagination';

const ENDPOINT = "/observations";

export type Observation = {
    id: number;
    natural_key: string;
    display_name: string;
    acq_system_id: number;
    acq_timestamp: number;
    acq_num_1: number;
    acq_num_2: number;
    name: string | null;
    obs_type: string | null;
    description: string | null;
    is_science: boolean | null;
    is_calib: boolean | null;
    is_dark: boolean | null;
    is_bias: boolean | null;
    is_flat: boolean | null;

    n_runs: number;

    exptime: number | null;
    frames: number | null;
    filter: string | null;

    tele_ra: number | null;
    tele_dec: number | null;

    camera_name: string | null;
    gain: number | null;
    binning_mode: string | null;
    operation_mode: string | null;

    binning_size: number | null;
    roi_start_x: number | null;
    roi_start_y: number | null;
    roi_width: number | null;
    roi_height: number | null;

    cooler_on: boolean | null;
    target_temp: number | null;
    front_housing_temp: number | null;
    rear_housing_temp: number | null;
    camera_temp: number | null;
}

export function getObservation(natural_key: string) {
    const queryKey = ["observation", natural_key];
    return useQuery<Observation, Error>({
        queryKey: queryKey,
        queryFn: () => webGetObservation(natural_key),
    });
}

function makeInfiniteQuery(queryKey: readonly unknown[], queryFn: (context: { pageParam: number }) => Promise<Page<Observation[]>>) {
    return useInfiniteQuery<Page<Observation[]>, Error, InfiniteData<Page<Observation[]>, number>, readonly unknown[], number>({
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

export type ObservationsParams = {
    search?: string;
    obs_types?: string;
    has_runs?: boolean;
    sort?: string;
}

export function getObservations(params: ObservationsParams = {}) {
    const queryKey = ["observations", params];
    return makeInfiniteQuery(queryKey, ({ pageParam = 1 }) => webGetObservations(pageParam, params))
}

async function webGetObservation(
    natural_key: string,
    options?: { signal?: AbortSignal },
) {
    const { data } = await axios.get<Observation[]>(ENDPOINT, { params: { natural_key }, signal: options?.signal });
    if (data.length === 0) {
        throw new Error("Observation not found");
    }
    return data[0];
}

async function webGetObservations(
    pageParam: number,
    params: ObservationsParams,
    options?: { signal?: AbortSignal },
): Promise<Page<Observation[]>> {
    const limit = pagination_config.obj_per_page;
    const { data } = await axios.get<Observation[]>(ENDPOINT, { params: { ...offsetParams(pageParam, limit), ...params }, signal: options?.signal });
    return { records: data, page: pageParam, hasMore: data.length === limit };
}
