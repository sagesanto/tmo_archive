import pagination_config from '../config/pagination';

export type Page<T> = {
    records: T;
    page: number;
    hasMore: boolean;
}

export function offsetParams(page: number, limit: number = pagination_config.obj_per_page) {
    return { limit: limit, offset: (page - 1) * limit };
}
