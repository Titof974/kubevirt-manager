import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { PrometheusResponse } from '../models/prometheus.interface';

@Injectable({
    providedIn: 'root'
})
export class PrometheusService {

    constructor(private http: HttpClient) { }

    /*
     * Check if Prometheus is Enabled
     */
    checkPrometheus(): Observable<boolean> {
        var metric = "absent(kubevirt_info)";
        var baseUrl = './api/v1/query?query';
        var promQuery = metric;
        return this.http.get<PrometheusResponse>(`${baseUrl}=${promQuery}`)
            .pipe(map(result => result.data.result.length == 0),
                catchError(_error => of(false)));
    }

    /*
    * Prometheus Query Range
    */
    queryRange(promQuery: String): Observable<any> {
        var baseUrl = './api/v1/query_range?query';
        return this.http.get(`${baseUrl}=${promQuery}`);
    }

    /*
     * Get Storage Writes
     */
    getStorageWrite(start: Number, end: Number, step: Number): Observable<PrometheusResponse> {
        var metric = "kubevirt_vmi_storage_write_traffic_bytes_total";
        var promQuery = "sum(" + metric + ")or%20vector(0)&start=" + start.toString() + "&end=" + end.toString() + "&step=" + step.toString();
        return this.queryRange(promQuery);
    }

    /*
     * Get Storage Reads
     */
    getStorageRead(start: Number, end: Number, step: Number): Observable<PrometheusResponse> {
        var metric = "kubevirt_vmi_storage_read_traffic_bytes_total";
        var promQuery = "sum(" + metric + ")or%20vector(0)&start=" + start.toString() + "&end=" + end.toString() + "&step=" + step.toString();
        return this.queryRange(promQuery);
    }

    /*
     * Get Network Sent Data
     */
    getNetSent(start: Number, end: Number, step: Number): Observable<PrometheusResponse> {
        var metric = "kubevirt_vmi_network_transmit_bytes_total";
        var promQuery = "sum(" + metric + ")or%20vector(0)&start=" + start.toString() + "&end=" + end.toString() + "&step=" + step.toString();
        return this.queryRange(promQuery);
    }

    /*
     * Get Network Received Data
     */
    getNetRecv(start: Number, end: Number, step: Number): Observable<PrometheusResponse> {
        var metric = "kubevirt_vmi_network_receive_bytes_total";
        var promQuery = "sum(" + metric + ")or%20vector(0)&start=" + start.toString() + "&end=" + end.toString() + "&step=" + step.toString();
        return this.queryRange(promQuery);
    }

    /*
     * Get CPU Summary
     */
    getCpuSummary(start: Number, end: Number, step: Number): Observable<PrometheusResponse> {
        var metric = "kube_pod_container_resource_requests";
        var promQuery = "sum(" + metric + "{container=\"compute\",resource=\"cpu\"})or%20vector(0)&start=" + start.toString() + "&end=" + end.toString() + "&step=" + step.toString();
        return this.queryRange(promQuery);
    }

    /*
     * Get Mem Summary
     */
    getMemSummary(start: Number, end: Number, step: Number): Observable<PrometheusResponse> {
        var metric = "kubevirt_vmi_memory_domain_bytes_total";
        var promQuery = "sum(" + metric + "/1024000)or%20vector(0)&start=" + start.toString() + "&end=" + end.toString() + "&step=" + step.toString();
        return this.queryRange(promQuery);
    }

    /*
    * Check if Prometheus is Enabled
    */
    checkNodeExporterPrometheus(): Observable<boolean> {
        var metric = "absent(node_cpu_seconds_total) or absent(node_memory_Active_bytes) or absent(node_memory_MemTotal_bytes) or absent(node_filesystem_avail_bytes) or absent(node_filesystem_size_bytes)";
        var baseUrl = './api/v1/query?query';
        var promQuery = metric;
        return this.http.get<PrometheusResponse>(`${baseUrl}=${promQuery}`)
            .pipe(map(result => result.data.result.length == 0),
                catchError(_error => of(false)));
    }

    /*
    * Get CPU Usage by Node in percentage
    */
    getCpuUsagePercentageByNode(start: Number, end: Number, step: Number): Observable<PrometheusResponse> {
        var promQuery = "100 * avg(1 - rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) by (node)&start=" + start.toString() + "&end=" + end.toString() + "&step=" + step.toString();
        return this.queryRange(promQuery);
    }

    /*
    * Get Memory Usage by Node in percentage
    */
    getMemoryUsagePercentageByNode(start: Number, end: Number, step: Number): Observable<PrometheusResponse> {
        var promQuery = "node_memory_Active_bytes/node_memory_MemTotal_bytes*100&start=" + start.toString() + "&end=" + end.toString() + "&step=" + step.toString();
        return this.queryRange(promQuery);
    }

    /*
    * Get Storage Usage by Node in percentage
    */
    getStorageUsagePercentageByNode(start: Number, end: Number, step: Number): Observable<PrometheusResponse> {
        var promQuery = "100 - ((sum(node_filesystem_avail_bytes) by (node))/(sum(node_filesystem_size_bytes) by (node))*100)&start=" + start.toString() + "&end=" + end.toString() + "&step=" + step.toString();
        return this.queryRange(promQuery);
    }
}
