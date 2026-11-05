import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface TemperatureChartProps {
    data: {
        time: string;
        temperature: number;
    }[];
}

function TemperatureChart({ data }: TemperatureChartProps) {
    return (
        <div>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="time"
                        stroke="#94a3b8"
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        unit="°"
                    />
                    <Tooltip />
                    <Line
                        type="monotone"
                        dataKey="temperature"
                        stroke="#38bdf8"
                        strokeWidth={3}
                    />
                </LineChart>
            </ResponsiveContainer>

        </div>
    );
}

export default TemperatureChart;
