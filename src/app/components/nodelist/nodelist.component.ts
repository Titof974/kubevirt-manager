import { Component, OnInit } from '@angular/core';
import { K8sService } from 'src/app/services/k8s.service';
import { K8sNode } from 'src/app/models/k8s-node.model';
import { lastValueFrom } from 'rxjs';
import { PrometheusService } from 'src/app/services/prometheus.service';
import { PrometheusResponse } from 'src/app/models/prometheus.interface';

@Component({
    selector: 'app-nodelist',
    templateUrl: './nodelist.component.html',
    styleUrls: ['./nodelist.component.css']
})
export class NodelistComponent implements OnInit {

    nodeList: K8sNode[] = []
    nodeExporterAvailable: boolean;
    cpuByNode!: PrometheusResponse;
    memByNode!: PrometheusResponse;
    storageByNode!: PrometheusResponse;

    constructor(
        private k8sService: K8sService,
        private prometheusService: PrometheusService
    ) {
        this.nodeExporterAvailable = false;
    }

    async ngOnInit(): Promise<void> {
        await this.getNodeExporterMetrics();
        await this.getNodes();
        let navTitle = document.getElementById("nav-title");
        if (navTitle != null) {
            navTitle.replaceChildren("Nodes");
        }
    }

    /*
     * Retrieve values from Prometheus Node Expoter
     */
    async getNodeExporterMetrics(): Promise<void> {
        this.nodeExporterAvailable = await lastValueFrom(this.prometheusService.checkNodeExporterPrometheus());
        console.log(this.nodeExporterAvailable)
        if (this.nodeExporterAvailable) {
            let stopTimeRange = +new Date() / 1000;
            let startTimeRange = stopTimeRange - 3600;
            let stepsForRange = 14;
            this.cpuByNode = await lastValueFrom(this.prometheusService.getCpuUsagePercentageByNode(startTimeRange, stopTimeRange, stepsForRange));
            this.memByNode = await lastValueFrom(this.prometheusService.getMemoryUsagePercentageByNode(startTimeRange, stopTimeRange, stepsForRange));
            this.storageByNode = await lastValueFrom(this.prometheusService.getStorageUsagePercentageByNode(startTimeRange, stopTimeRange, stepsForRange));
        }
    }

    /*
     * Get Nodes from Kubernetes
     */
    async getNodes(): Promise<void> {
        try {
            const data = await lastValueFrom(this.k8sService.getNodes());
            let nodes = data.items;
            for (let i = 0; i < nodes.length; i++) {
                let currentNode = new K8sNode();
                currentNode.name = nodes[i].metadata["name"];
                currentNode.arch = nodes[i].status.nodeInfo["architecture"];
                currentNode.cidr = nodes[i].spec["podCIDR"];
                currentNode.mem = this.convertSize(nodes[i].status.capacity["memory"]);
                currentNode.disk = this.convertSize(nodes[i].status.capacity["ephemeral-storage"]);
                currentNode.cpu = nodes[i].status.capacity["cpu"];
                currentNode.os = nodes[i].status.nodeInfo["operatingSystem"];
                currentNode.osimg = nodes[i].status.nodeInfo["osImage"];
                currentNode.kernel = nodes[i].status.nodeInfo["kernelVersion"];
                currentNode.criver = nodes[i].status.nodeInfo["containerRuntimeVersion"];
                currentNode.kubever = nodes[i].status.nodeInfo["kubeletVersion"];
                if (this.nodeExporterAvailable) {
                    let cpuUsages = this.cpuByNode.data.result.find(res => res.metric.node == nodes[i].metadata["name"]);
                    let memUsages = this.memByNode.data.result.find(res => res.metric.node == nodes[i].metadata["name"]);
                    let storageUsages = this.storageByNode.data.result.find(res => res.metric.node == nodes[i].metadata["name"]);
                    currentNode.cpuUsage = (cpuUsages) ? Math.ceil(cpuUsages.values.slice(-1)[0][1]) : 0;
                    currentNode.memUsage = (memUsages) ? Math.ceil(memUsages.values.slice(-1)[0][1]) : 0;
                    currentNode.storageUsage = (storageUsages) ? Math.ceil(storageUsages.values.slice(-1)[0][1]) : 0;
                }
                this.nodeList.push(currentNode);
            }
        } catch (e: any) {
            console.error(e);
        }
    }

    /*
     * Convert unit size
     */
    convertSize(inputSize: string): string {
        inputSize = inputSize.replace('Ki', '');
        var fileSize = Number.parseFloat(inputSize) / (1024 * 1024);
        return (Math.round(fileSize * 100) / 100).toString() + " GB";
    }

}
function provideEcharts(): import("@angular/core").Provider {
    throw new Error('Function not implemented.');
}

