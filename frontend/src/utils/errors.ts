import { axios } from "@api/axios";

const ENDPOINT = "/errors";

export async function webCreateError(
    report: { error_message: string, misc: string | null },
    options?: { signal?: AbortSignal },
) {
    const { data } = await axios.post(ENDPOINT, report, { signal: options?.signal });
    return data;
}