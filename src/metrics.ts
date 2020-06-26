import { Kumo } from "./kumojs";
import { RequestHandler } from "express";

const prefix = "kumo_";
const c2f = (tempC:number) => Math.round((tempC * 9) / 5 + 32);
const modeValue = (mode:string) : number => {
    switch (mode) {
        case "heat":
            return 1;
        case "cool":
            return -1;
        default:
            return 0;
    }
};

const help = (metric:string, description:string) => `# HELP ${prefix}${metric} ${description}`;
const type = (metric:string) => `# TYPE ${prefix}${metric} guage`; // we only use Guages for this
const value = (metric:string, labels:object, value:number) => {
    let labelString = Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',');
    return `${prefix}${metric}{${labelString}} ${value}`;
};

export default (kumo : Kumo): RequestHandler => {
    return (req, res) => {
        Promise.all(
        kumo.getRoomList()
            .map(room => {
                const address = kumo.getAddress(room);
                return kumo.getStatus(address)
                    .then(s => { return {room, status: s.r.indoorUnit.status}});
            })
        )
        .then(rs => {
            const lines: string[] = [];
            // current temperature
            let metric = "temperature_current_Imperial";
            lines.push(help(metric, "Current room temperature, degrees F"));
            lines.push(type(metric));
            rs.forEach(s => lines.push(value(metric,{room: s.room}, c2f(s.status.roomTemp))));

            // mode
            metric = "mode";
            lines.push(help(metric, "Current room mode. Heat = 1, Cool = -1, anything else = 0"));
            lines.push(type(metric));
            rs.forEach(s => lines.push(value(metric,{room: s.room}, modeValue(s.status.mode))));

            // mode setting
            metric = "temperature_setting_Imperial";
            lines.push(help(metric, "Set temperature for heat/cool"));
            lines.push(type(metric));
            rs.forEach(s => lines.push(value(metric,{room: s.room, mode: "heat"}, c2f(s.status.spHeat))));
            rs.forEach(s => lines.push(value(metric,{room: s.room, mode: "cool"}, c2f(s.status.spCool))));

            res.setHeader('Content-Type', 'text/plain; version=0.0.4');
            res.send(
                lines.join('\n') + '\n'
            );
        });
    };
};