// // 水温
// export type WaterSensorData = {
//   sensorId: string;
//   timestamp: string;
//   battery: number;
//   outsideTemp: number;
//   waterTemp: number;
// };

// // 塩分
// export type SalinitySensorData = {
//   sensorId: string;
//   timestamp: string;
//   battery: number;
//   outsideTemp: number;
//   waterTemp: number;
//   conductivity: number;
//   salinity: number;
// };

// // DO1号
// export type DO1SensorData = {
//   sensorId: string;
//   timestamp: string;
//   battery: number;
//   outsideTemp: number;
//   waterTemp: number;
//   DO_percent: number;
//   DO_mgL: number;
// };

// // 水温レスポンス
// type WaterApiResponse = {
//   success: boolean;
//   data: WaterSensorData[];
// };

// // 塩分レスポンス
// type SalinityApiResponse = {
//   success: boolean;
//   data: SalinitySensorData[];
// };

// // DO1レスポンス
// type DO1ApiResponse = {
//   success: boolean;
//   data: DO1SensorData[];
// };

// //塩分取得
// export async function getSalinityData() {
//     const response = await fetch("/api/salinity");
//     return json.data;
// }