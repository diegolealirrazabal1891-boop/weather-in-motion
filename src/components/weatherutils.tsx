import {
    Sun, Cloud, CloudSun, CloudRain,
    CloudLightning, Snowflake,CloudFog
} from "lucide-react";

export function obtenerIconoClima(codigoClima: number) {
    if (codigoClima === 0) {
        return Sun;
    } else if (codigoClima === 1 || codigoClima === 2) {
        return CloudSun;
    } else if (codigoClima === 3) {
        return Cloud;
    }

    else if (codigoClima >= 51 && codigoClima <= 67) {
        return CloudRain;
    } else if (codigoClima >= 80 && codigoClima <= 82) {
        return CloudRain;
    } else if (codigoClima >= 95 && codigoClima <= 99) {
        return CloudLightning;
    } else if (codigoClima === 71 || codigoClima === 73 || codigoClima === 75 || codigoClima === 77 || codigoClima === 85 || codigoClima === 86){
        return Snowflake;
    }else if (codigoClima === 45 || codigoClima === 48 ){
        return CloudFog;
    }
    
    return Cloud;
}


export function obtenerColorClima(codigoClima: number): string {
    if (codigoClima === 0 || codigoClima === 1) {
        return "text-yellow-400";
    } else if (codigoClima === 2 || codigoClima === 3) {
        return "text-slate-300";
    } else if (
        (codigoClima >= 51 && codigoClima <= 67) ||
        (codigoClima >= 80 && codigoClima <= 82)
    ) {
        return "text-sky-400";
    } else if (codigoClima >= 95 && codigoClima <= 99) {
        return "text-purple-400";
    } else if (codigoClima === 71 || codigoClima === 73 || codigoClima === 75 || codigoClima === 77 || codigoClima === 85 || codigoClima === 86 ){
        return "text-sky-400";
    }else if (codigoClima === 45 || codigoClima === 48){
        return "text-slate-400";
    }

    return "text-slate-400";
}