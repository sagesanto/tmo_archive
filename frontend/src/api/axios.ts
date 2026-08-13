import assert from "assert";
import Axios from "axios";
import backend from "@config/backend"

// import store from "@state/store";
// import { state_logout } from "@state/authSlice";

// FastAPI expects repeated bare keys for list query params (?a=1&a=2), not axios's default a[]=1&a[]=2
function serializeParams(params: Record<string, unknown>): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === null || value === undefined) continue;
        for (const v of Array.isArray(value) ? value : [value]) {
            search.append(key, String(v));
        }
    }
    return search.toString();
}

export const axios = Axios.create({
    baseURL: backend.address,
    paramsSerializer: serializeParams,
    // withCredentials: true,
});

axios.interceptors.response.use(function (response) {
    return response;
}, function (error) {
    // if (error.response.status === 401 && !error.config.url.includes("/login")) {
    //     console.log("axios: detected a 401 error, setting state to logged out")
    //     store.dispatch(state_logout());
    // }
    if (error.response.data && error.response.data.message && typeof error.response.data.message === 'string' && error.response.data.message.length < 200) {
        return Promise.reject(new Error( `${error.response.status}: ${error.response.data.message}`));
    }
    if (error.response.data && typeof error.response.data === 'string') {
        return Promise.reject(new Error( `${error.response.status}: ${error.response.data}`));
    }
    return Promise.reject(error);
}); 