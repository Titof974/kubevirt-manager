import { Component, Input, OnInit, ElementRef } from '@angular/core';
import * as echarts from "echarts";

import $ from 'jquery';

@Component({
  selector: 'gauge',
  template: `<div class="mGraph-wrapper">
  <div class="mGraph" id="gauge"></div>
</div>`,
  styles: [`
  .mGraph-wrapper{
    width: 100%;
    height: 239px;
    background: #fff;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .mGraph-wrapper .mGraph{
    width: 100%;
    height: 100%;
    overflow: hidden;
  }`]
})
export class GaugechartComponent implements OnInit {
  @Input() value: number = 0;
  @Input() name: string = "";
  constructor(private elm: ElementRef) {
    this.value = Math.floor(this.value);
  }
  ngOnInit() {
    let piechart = echarts.init($(this.elm.nativeElement).find('#gauge')[0]);
    piechart.setOption({
      tooltip: {
        formatter: '{a} <br/>{b} : {c}%'
      },
      series: [
        {
          type: "gauge",
          center: ["50%", "60%"],
          startAngle: 200,
          endAngle: -20,
          min: 0,
          max: 100,
          splitNumber: 10,
          itemStyle: {
            color: "#007bff"
          },
          progress: {
            show: true,
            width: 30
          },

          pointer: {
            show: false
          },
          axisLine: {
            lineStyle: {
              width: 30
            }
          },
          splitLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            show: false
          },
          anchor: {
            show: false
          },
          title: {
            show: true,
            offsetCenter: [0, '50%']
          },
          detail: {
            valueAnimation: true,
            width: "60%",
            lineHeight: 40,
            borderRadius: 8,
            offsetCenter: [0, "-15%"],
            fontSize: 40,
            formatter: "{value}%",
            color: "inherit"
          },
          data: [{ value: this.value, name: this.name }],
          animationEasingUpdate: "cubicIn",
        }
      ]
    })
  }
}