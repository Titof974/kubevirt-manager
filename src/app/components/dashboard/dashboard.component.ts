import { Component, OnInit } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { DataVolumesService } from 'src/app/services/data-volumes.service';
import { K8sApisService } from 'src/app/services/k8s-apis.service';
import { K8sService } from 'src/app/services/k8s.service';
import { KubeVirtService } from 'src/app/services/kube-virt.service';
import { PrometheusService } from 'src/app/services/prometheus.service';
import { Chart } from 'chart.js/auto'

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

    nodeInfo = {
        'total': 0,
        'running': 0
    };

    vmInfo = {
        'total': 0,
        'running': 0
    };

    /* Dashboard data */
    discInfo = 0;
    poolInfo = 0;
    cpuInfo = 0;
    memInfo = 0;
    storageInfo = 0;
    netInfo = 0;
    storageClassesInfo = 0;
    namespacesInfo = 0;
    instanceTypesInfo = 0;
    loadBalancers = 0;

    /* Prometheus query data */
    prometheusEnabled = false
    promStartTime = 0;
    promEndTime = 0;
    promInterval = 1800; // Prometheus window 30 minutes
    promStep = 15;       // Prometheus Step

    /* Chart.JS placeholder */
    cpuChart: any;
    memChart: any;
    netChart: any;
    stgChart: any;


    constructor(
        private k8sService: K8sService,
        private k8sApisService: K8sApisService,
        private kubeVirtService: KubeVirtService,
        private dataVolumesService: DataVolumesService,
        private prometheusService: PrometheusService
    ) { }

    async ngOnInit(): Promise<void> {
        await this.checkPrometheus();
        await this.getNodes();
        this.getVMs();
        this.getDisks();
        this.getNetworks();
        this.getPools();
        this.getStorageClasses();
        this.getNamespaces();
        this.getInstanceTypes();
        this.getLoadBalancers();
        let navTitle = document.getElementById("nav-title");
        if(navTitle != null) {
            navTitle.replaceChildren("Dashboard");
        }
        /* If prometheus is present */
        if(this.prometheusEnabled) {
            await this.getTimestamps();
            await this.enableRows();
            this.cpuGraph();
            this.memGraph();
            this.netGraph();
            this.stgGraph();
        }
    }

    /*
     * Check if Prometheus is Present
     */
    async checkPrometheus(): Promise<void>  {
        const data = await lastValueFrom(this.prometheusService.checkPrometheus());
        if(data["status"].toLowerCase() == "success") {
            this.prometheusEnabled = true;
        }
    }

    /*
     * Generate timestamps for Prometheus Query
     */
    async getTimestamps(): Promise<void>  {
        this.promEndTime = Math.floor(Date.now() / 1000)
        this.promStartTime = this.promEndTime - this.promInterval;
    }

    /*
     * Enable the Prometheus dashboard widgets
     */
    async enableRows(): Promise<void>  {
        let rowOne = document.getElementById("prometheus-row-one");
        if(rowOne != null) {
            rowOne.setAttribute("style","display: flex;");
        }

        let rowTwo = document.getElementById("prometheus-row-two");
        if(rowTwo != null) {
            rowTwo.setAttribute("style","display: flex;");
        }
    }

    /*
     * Get Nodes Information
     */
    async getNodes(): Promise<void> {
        let data = await lastValueFrom(this.k8sService.getNodes());
        let nodes = data.items;
        this.nodeInfo.total = nodes.length;
        for (let i = 0; i < nodes.length; i++) {
            this.memInfo += this.convertSize(nodes[i].status.capacity["memory"]);
            this.storageInfo += this.convertSize(nodes[i].status.capacity["ephemeral-storage"]);
            this.cpuInfo += Number.parseInt(nodes[i].status.capacity["cpu"]);
            let conditions = nodes[i].status.conditions;
            for (let j = 0; j < conditions.length; j++) {
                if(conditions[j].type == "Ready" && conditions[j].status == "True") {
                this.nodeInfo.running +=1;
                }
            }
        }
        this.storageInfo = Math.round((this.storageInfo * 100) / 100);
    }

    /*
     * Generate CPU Graph
     */
    async cpuGraph(): Promise<void> {
        /* get CPU data from Prometheus */
        let response = await lastValueFrom(this.prometheusService.getCpuSummary(this.promStartTime, this.promEndTime, this.promStep));
        let data = response.data.result[0].values;

        /* prepare Data for Graph */
        let cpuData = data.map(function(value: any[],index: any) { return value[1]; });
        let labelData = Array(cpuData.length).fill("");

        this.cpuChart = new Chart("CpuChart", {
            type: 'line',
            data: {
              labels: labelData, 
                 datasets: [
                {
                  label: "CPU Usage",
                  pointRadius: 1,
                  pointBorderWidth: 0,
                  tension: 1,
                  borderWidth: 3,
                  data: cpuData,
                  backgroundColor: 'blue',
                  borderColor: 'blue',
                  fill: true
                }  
              ]
            },
            options: {
              aspectRatio:5,
              animations: {
                tension: {
                  duration: 1000,
                  easing: 'linear',
                  from: 1,
                  to: 0,
                  loop: false
                }
              },
              scales: {
                x: {
                    grid: {
                      display: false
                    }
                  },
                  y: {
                    min: 0,
                    max: (this.cpuInfo + 1)/10,
                    grid: {
                      display: true
                    }
                  }
              }
            }
            
        });
    }

    /*
     * Generate Memory Graph
     */
    async memGraph(): Promise<void> {
        /* get Memory data from Prometheus */
        let response = await lastValueFrom(this.prometheusService.getMemSummary(this.promStartTime, this.promEndTime, this.promStep));
        let data = response.data.result[0].values;

        /* prepare Data for Graph */
        let memData = data.map(function(value: any[],index: any) { return value[1]; });
        let labelData = Array(memData.length).fill("");

        this.memChart = new Chart("MemChart", {
            type: 'line',
            data: {
              labels: labelData, 
                 datasets: [
                {
                  label: "Mem Usage",
                  pointRadius: 1,
                  pointBorderWidth: 0,
                  tension: 1,
                  borderWidth: 3,
                  data: memData,
                  backgroundColor: 'green',
                  borderColor: 'green',
                  fill: true
                }  
              ]
            },
            options: {
              aspectRatio:5,
              animations: {
                tension: {
                  duration: 1000,
                  easing: 'linear',
                  from: 1,
                  to: 0,
                  loop: false
                }
              },
              scales: {
                x: {
                    grid: {
                      display: false
                    }
                  },
                  y: {
                    min: 0,
                    max: Math.round(this.memInfo * 1024),
                    grid: {
                      display: true
                    }
                  }
              }
            }
            
        });
    }

    /*
     * Generate Network Graph (bytes)
     */
    async netGraph(): Promise<void> {
        /* get Network Sent data from Prometheus */
        let response = await lastValueFrom(this.prometheusService.getNetSent(this.promStartTime, this.promEndTime, this.promStep));
        let data = response.data.result[0].values;

        /* prepare Sent Data for Graph */
        let sentData = data.map(function(value: any[],index: any) { return value[1]; });

        let i = 0;

        /* Convert sent data to kbytes */
        for(i = 0; i < sentData.length; i++) {
            sentData[i] = (sentData[i]/1024)/1024;
        }

        /* get Network Received data from Prometheus */
        response = await lastValueFrom(this.prometheusService.getNetRecv(this.promStartTime, this.promEndTime, this.promStep));
        data = response.data.result[0].values;

        /* prepare Received Data for Graph */
        let recvData = data.map(function(value: any[],index: any) { return value[1]; });

        /* Convert received data to kbytes */
        for(i = 0; i < recvData.length; i++) {
            recvData[i] = (recvData[i]/1024)/1024;
        }

        let labelData = Array(sentData.length).fill("");

        this.netChart = new Chart("NetChart", {
            type: 'line',
            data: {
              labels: labelData, 
                 datasets: [
                {
                  label: "Sent",
                  data: sentData,
                  pointRadius: 1,
                  pointBorderWidth: 0,
                  tension: 1,
                  borderWidth: 3,
                  borderColor: 'green',
                  backgroundColor: 'green'
                },
                {
                  label: "Recv",
                  data: recvData,
                  pointRadius: 1,
                  pointBorderWidth: 0,
                  tension: 1,
                  borderWidth: 3,
                  borderColor: 'blue',
                  backgroundColor: 'blue'
                }
              ]
            },
            options: {
                aspectRatio:5,
                animations: {
                  tension: {
                    duration: 1000,
                    easing: 'linear',
                    from: 1,
                    to: 0,
                    loop: false
                  }
                },
                scales: {
                  x: {
                      grid: {
                        display: false
                      }
                    },
                    y: {
                      min: 0,
                      grid: {
                        display: true
                      }
                    }
                }
              }
            
        });
    }

    /*
     * Generate Storage Graph (bytes)
     */
    async stgGraph(): Promise<void> {
        /* get Storage Read data from Prometheus */
        let response = await lastValueFrom(this.prometheusService.getStorageRead(this.promStartTime, this.promEndTime, this.promStep));
        let data = response.data.result[0].values;

        /* prepare Read Data for Graph */
        let readData = data.map(function(value: any[],index: any) { return value[1]; });

        let i = 0;

        /* Convert read data to mbytes */
        for(i = 0; i < readData.length; i++) {
            readData[i] = (readData[i]/1024)/1024;
        }

        /* get Storage Write data from Prometheus */
        response = await lastValueFrom(this.prometheusService.getStorageWrite(this.promStartTime, this.promEndTime, this.promStep));
        data = response.data.result[0].values;

        /* prepare Write Data for Graph */
        let writeData = data.map(function(value: any[],index: any) { return value[1]; });

        /* Convert write data to mbytes */
        for(i = 0; i < writeData.length; i++) {
            writeData[i] = (writeData[i]/1024)/1024;
        }

        let labelData = Array(readData.length).fill("");

        this.stgChart = new Chart("StgChart", {
            type: 'line',
            data: {
              labels: labelData, 
                 datasets: [
                {
                  label: "Read",
                  data: readData,
                  pointRadius: 1,
                  pointBorderWidth: 0,
                  tension: 1,
                  borderWidth: 3,
                  borderColor: 'green',
                  backgroundColor: 'green'
                },
                {
                  label: "Write",
                  data: writeData,
                  pointRadius: 1,
                  pointBorderWidth: 0,
                  tension: 1,
                  borderWidth: 3,
                  borderColor: 'blue',
                  backgroundColor: 'blue'
                  }
              ]
            },
            options: {
                aspectRatio:5,
                animations: {
                  tension: {
                    duration: 1000,
                    easing: 'linear',
                    from: 1,
                    to: 0,
                    loop: false
                  }
                },
                scales: {
                  x: {
                      grid: {
                        display: false
                      }
                    },
                    y: {
                      min: 0,
                      grid: {
                        display: true
                      }
                    }
                }
              }
            
        });
    }

    /*
     * Get VMs Information
     */
    async getVMs(): Promise<void> {
        const data = await lastValueFrom(this.kubeVirtService.getVMs());
        let vms = data.items;
        this.vmInfo.total = data.items.length;
        for (let i = 0; i < vms.length; i++) {
            if(vms[i].status["printableStatus"] == "Running") {
            this.vmInfo.running += 1;
            }
        }
    }

    /*
     * Get Data Volumes Information
     */
    async getDisks(): Promise<void> {
        const data = await lastValueFrom(this.dataVolumesService.getDataVolumes());
        this.discInfo = data.items.length;
    }

    /*
     * Get Network Attachments from Kubernetes
     */
    async getNetworks(): Promise<void> {
        const data = await lastValueFrom(this.k8sApisService.getNetworkAttachs());
        this.netInfo = data.items.length;
    }

    /*
     * Get VM Pools
     */
    async getPools(): Promise<void> {
        const data = await lastValueFrom(this.kubeVirtService.getVMPools());
        this.poolInfo = data.items.length;
    }

    /*
     * Get Storage Classes
     */
    async getStorageClasses(): Promise<void> {
        const data = await lastValueFrom(this.k8sApisService.getStorageClasses());
        this.storageClassesInfo = data.items.length;
    }

    /*
     * Get Namespaces
     */
    async getNamespaces(): Promise<void> {
        const data = await lastValueFrom(this.k8sService.getNamespaces());
        this.namespacesInfo = data.items.length;
    }

    /*
     * Get Cluster Instance Types
     */
    async getInstanceTypes(): Promise<void> {
        const data = await lastValueFrom(this.kubeVirtService.getClusterInstanceTypes());
        this.instanceTypesInfo = data.items.length;
    }

    /*
     * Get Services from Kubernetes
     */
    async getLoadBalancers(): Promise<void> {
        const data = await lastValueFrom(this.k8sService.getServices());
        this.loadBalancers = data.items.length;
    }

    /*
     * Convert unit size
     */
    convertSize(inputSize: string): number {
        inputSize = inputSize.replace('Ki','');
        var fileSize = Number.parseFloat(inputSize)  / (1024*1024);
        return (Math.round(fileSize * 100) / 100);
    }

}
