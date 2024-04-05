export interface PrometheusResponse {
    status: string,
    data: {
        resultType: string,
        result: {
            metric: any,
            values: any[]
        }[]
    }
}
