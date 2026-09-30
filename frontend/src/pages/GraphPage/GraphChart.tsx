// import { useState, useEffect} from "react";
import ReactECharts from "echarts-for-react";
import "./GraphChart.css";
type Props = {
    graphMode: string;
    unit: string;
    targetValue: number | null;
};

export default function GraphChart({
    graphMode,
    unit,
    targetValue,
}: Props) {

    // ダミーデータ100日分を作成
    const graphData = Array.from({ length: 100 }, (_, i) => ({
        day: i + 1,
        value: Number((20 + Math.sin(i / 5) * 2 + Math.random() * 0.5).toFixed(2)),
    }));

    // 横軸ラベル
    const xData = graphData.map((_, i) => `${i + 1}`);

    // 横軸の単位
    const xUnit =
        graphMode === "日"
            ? "時間"
            : graphMode === "月"
                ? "日"
                : "月";


    // EChartsの設定
    const option = {

        grid: {
            left: 35,
            right: 20,
            top: 30,
            bottom: 0,
        },

        xAxis: {
            type: "category",
            data: xData,
            name: `[${xUnit}]`,
            nameLocation: "end",
            nameGap: 20,
            nameTextStyle: {
                verticalAlign: "middle",
            },
        },

        yAxis: {
            type: "value",
            name: `[${unit}]`,
            nameLocation: "end",
            nameTextStyle: {
                align: "right",
            },
        },

        series: [

            {
                type: "line",
                smooth: true,
                data: graphData.map((d) => d.value),
                symbol: "circle",
                symbolSize: 12,
                color: "#4A90E2",

                label: {
                    show: false, // 普段は非表示
                },

                emphasis: {
                    label: {
                        show: true,
                        position: "top", // 点の真上
                        distance: 10,      // 点との間隔
                        formatter: (params: any) => `${params.value}${unit}`,
                        fontSize: 14,
                        fontWeight: "bold",
                        color: "#333",
                    },
                },

                markLine: targetValue === null ? undefined :{
                    symbol: ["none", "none"],
                    label: {
                        position: "end",
                        color: "#2ecc71",
                        fontWeight: "bold",
                        formatter: `${targetValue}`,
                    },
                    lineStyle: {
                        color: "#2ecc71",
                        type: "solid",
                        width: 2,
                    },
                    data: [
                        {
                            yAxis: targetValue, // ★localStorageから取得した値をセット
                        }
                    ],
                }
            }
        ],

        // ★ここを追加
        dataZoom: [
            {
                type: "inside",
                xAxisIndex: 0,
                start: 0,
                end: 8,
                zoomLock: true,
                moveOnMouseMove: true,
                moveOnMouseWheel: false,
            },
        ],
    };

    return (
        <div className="graph-chart">
            <ReactECharts
                option={option}
                notMerge={true}
                style={{ width: "100%", height: "100%" }}
            />
        </div>
    );
}