declare module 'satellite.js' {
  export function json2satrec(omm: any): any;
  export function propagate(satrec: any, tsince: number): any;
  export function gstime(jday: number): number;
  export function eciToGeodetic(eci: any, gmst: number): any;
  export function degreesLat(angle: number): number;
  export function degreesLong(angle: number): number;
  export type OMMJsonObject = any;
  export type SatRec = any;
}
