import { useState, useEffect, useMemo } from "react";
import { fetchSensorData, makeGraphPoints, type SensorRecord } from "@/services/sensorData";
import ReactECharts from "echarts-for-react";
import type { ECharts } from "echarts";
import "./GraphChart.css";

// 横軸ラベル（2段）を作る関数を返す
// 月モード：上段に月、下段に日
// 年モード：上段に年、下段に月
// 上段は「月（年）の最初」と「表示範囲で一番左のラベル」にだけ出す。
// スクロールしても左端に必ず月（年）が表示される。
const makeXAxisFormatter = (xData: string[], graphMode: string, startIndex: number) => {
    if (graphMode === "日") return (value: string) => value; // "00:30" など

    // 表示範囲で一番左のラベル
    const firstShown = xData[startIndex];

    return (value: string) => {
        const month = Number(value.slice(5, 7));
        if (graphMode === "月") {
            const day = Number(value.slice(8, 10));
            const top = day === 1 || value === firstShown ? `${month}月` : " ";
            return `${top}\n${day}`;
        }
        const top = month === 1 || value === firstShown ? `${value.slice(0, 4)}年` : " ";
        return `${top}\n${month}`;
    };
};

const NO_RECORDS: SensorRecord[] = [];
const MODE_CONFIG: Record<string, { kind: string; xUnit: string; pc: number; sp: number }> = {
    日: { kind: "today", xUnit: "時間", pc: 24, sp: 6 },
    月: { kind: "all", xUnit: "日", pc: 31, sp: 7 },
    年: { kind: "all", xUnit: "月", pc: 12, sp: 12 },
};

type Props = {
    graphType: string;
    graphMode: string;
    unit: string;
    targetValue: number | null;
};

export default function GraphChart({
    graphType,
    graphMode,
    unit,
    targetValue,
}: Props) {
    const [fetched, setFetched] = useState<{ kind: string; records: SensorRecord[] }>({
        kind: "",
        records: NO_RECORDS,
    });
    const [currentDate] = useState(() => new Date());
    const [errorKind, setErrorKind] = useState<string | null>(null);
    const { kind, xUnit, pc, sp } = MODE_CONFIG[graphMode];

    useEffect(() => {
        let ignore = false;
        const request = kind === "today" ? fetchSensorData(currentDate) : fetchSensorData();
        request
            .then((data) => {
                if (!ignore) {
                    setFetched({ kind, records: data });
                    setErrorKind(null);
                }
            })
            .catch((e) => {
                console.error("グラフ用データの取得に失敗しました:", e);
                if (!ignore) setErrorKind(kind);
            });
        return () => { ignore = true; };
    }, [kind, currentDate]);

    const error = errorKind === kind;
    const isLoading = fetched.kind !== kind;
    const records = isLoading ? NO_RECORDS : fetched.records;
    const graphData = useMemo(
        () => makeGraphPoints(records, graphType, graphMode, currentDate),
        [records, graphType, graphMode, currentDate]
    );

    const xData = useMemo(() => graphData.map((d) => d.label), [graphData]);
    // スマホなど画面が狭いか（日モードで30分ごとのラベルを全部出しても重ならないよう、表示時間を短くする）
    const isNarrow = window.innerWidth < 600;
    // 1画面に表示する点の数（PC / スマホ）
    const visibleCount = isNarrow ? sp : pc;
    // 最初に表示する範囲：日モードは最新のデータがある時刻まで、月・年モードは最後の点まで。それより前は左へスクロールして見る
    const lastDataIndex = graphData.findLastIndex((d) => d.value !== null);
    // 値が1つも無いときはグラフの上にエラーカードを重ねる（日・月・年すべて）
    const hasNoData = lastDataIndex === -1;
    const initialEndIndex =
        graphMode === "日" ? Math.max(lastDataIndex, visibleCount - 1) : xData.length - 1;
    const initialStartIndex = Math.max(0, initialEndIndex - (visibleCount - 1));
    // スクロールしたら、表示範囲の左端に合わせて横軸ラベルの上段（月・年）を付け直す
    const onEvents = useMemo(() => ({
        dataZoom: (_: unknown, chart: ECharts) => {
            if (graphMode === "日") return;
            const [dataZoom] = chart.getOption().dataZoom as { startValue: number }[];
            chart.setOption({
                xAxis: { axisLabel: { formatter: makeXAxisFormatter(xData, graphMode, dataZoom.startValue) } },
            });
        },
    }), [xData, graphMode]);

    const option = useMemo(() => ({
        grid: {
            left: 45,
            right: 40,
            top: 40,
            bottom: graphMode === "日" ? 30 : 45,
        },
        xAxis: {
            type: "category",
            data: xData,
            name: `[${xUnit}]`,
            nameLocation: "end",
            nameGap: 10,
            axisLabel: {
                formatter: makeXAxisFormatter(xData, graphMode, initialStartIndex),
                interval: 0,
            }
        },
        yAxis: {
            type: "value",
            min: graphType === "塩分濃度"
                ? 25
                : graphType === "溶存酸素"
                    ? 2
                    : hasNoData ? 0 : undefined,
            max: graphType === "塩分濃度"
                ? 35
                : graphType === "溶存酸素"
                    ? 9
                    : hasNoData ? 30 : undefined,
            interval: graphType === "塩分濃度"
                ? 1
                : graphType === "溶存酸素"
                    ? 1
                    : undefined,
            splitNumber: graphType === "塩分濃度"
                ? 10
                : graphType === "溶存酸素"
                    ? 6
                    : undefined,
            axisLabel: {
                formatter: (value: number) =>
                    graphType === "溶存酸素"
                        ? value.toFixed(1)
                        : value,
            },
            name: `[${unit}]`,
            nameLocation: "end",
            nameTextStyle: { align: "left" },
        },
        series: [
            {
                type: "line",
                smooth: true,
                data: graphData.map((d) => d.value),
                symbol: "circle",
                symbolSize: 12,
                color: "#4A90E2",
                emphasis: {
                    label: {
                        show: true,
                        position: "top",
                        distance: 10,
                        formatter: (params: any) => `${params.value}${unit}`,
                        fontSize: 14,
                        fontWeight: "bold",
                        color: "#333",
                    },
                },
                markLine: targetValue === null || hasNoData ? undefined : {
                    silent: true,
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
                    data: [{ yAxis: targetValue }],
                }
            }
        ],
        dataZoom: [
            {
                type: "inside",
                xAxisIndex: 0,
                startValue: initialStartIndex,
                endValue: initialEndIndex,
                zoomLock: true,
                moveOnMouseMove: true,
                moveOnMouseWheel: false,
            },
        ],
    }), [graphData, xData, graphMode, xUnit, unit, targetValue, initialStartIndex, initialEndIndex, hasNoData]);

    return (
        <div className="graph-chart">
            {error ? (
                // 取得エラー：データ画面と同じエラーカード
                <div className="graph-error-overlay">
                    <div className="error-message-card">
                        <p>データを取得できませんでした</p>
                    </div>
                </div>
            ) : isLoading ? (
                <div className="graph-message">
                    <div className="graph-spinner" />
                    <p>データを取得中...</p>
                </div>
            ) : (
                <>
                    <ReactECharts
                        key={graphMode}
                        option={option}
                        notMerge
                        onEvents={onEvents}
                        style={{ width: "100%", height: "100%" }}
                    />
                    {/* データなし：グラフの上にエラーカードを重ねる */}
                    {hasNoData && (
                        <div className="graph-error-overlay">
                            <div className="error-message-card">
                                <p>データがありません。</p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}