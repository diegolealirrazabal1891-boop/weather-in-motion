import { useState, useEffect, lazy, Suspense } from "react";
import { flags } from "./components/flags";
import {
  obtenerIconoClima,
  obtenerColorClima,
} from "./components/weatherutils";
import { Wind, Droplets, Moon, CloudMoon } from "lucide-react";
const TemperatureChart = lazy(
  () => import("./components/TemperatureChart")
);

type City = {
  id: number;
  name: string;
  country: string;
  country_code: keyof typeof flags;
  latitude: number;
  longitude: number;
};

type WeatherData = {
  current: {
    temperature_2m: number;
    weather_code: number;
    apparent_temperature: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    relative_humidity_2m: number;
    time: string;
    is_day: number;

  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    is_day: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
};
type PronosticoHora = {
  time: string;
  temperature: number;
  weatherCode: number;
  isDay: number;
};


function App() {
  const [dataCity, setDataCity] = useState("");
  const [cityFound, setCityFound] = useState("");
  const [resultingClimate, setResultingClimate] =
    useState<WeatherData | null>(null);
  const [errorFound, setErrorFound] = useState("");
  const [cityResults, setCityResults] = useState<City[]>([]);
  const [fechaActualizada, setFechaActualizada] = useState("");
  const [cityHistory, setCityHistory] = useState<City[]>(() => {
    const historialGuardado = localStorage.getItem("cityHistory");
    return historialGuardado ? JSON.parse(historialGuardado) : [];
  });
  const [pronosticoHoras, setPronosticoHoras] = useState<PronosticoHora[]>([]);
  const [pronosticoDias, setPronosticoDias] = useState<WeatherData["daily"] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(true);
  const [ciudadesPopulares, setCiudadesPopulares] = useState<
    (City & { selecciones: number })[]
  >(() => {
    const ciudadesGuardadas = localStorage.getItem("ciudadesPopulares");
    return ciudadesGuardadas ? JSON.parse(ciudadesGuardadas) : [];
  });
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mostrarConfirmacionPopulares, setMostrarConfirmacionPopulares] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      "ciudadesPopulares",
      JSON.stringify(ciudadesPopulares)
    );
  }, [ciudadesPopulares]);
  useEffect(() => {
    localStorage.setItem("cityHistory", JSON.stringify(cityHistory));
  }, [cityHistory]);


  async function citySearch() {
    setPronosticoDias(null);
    setMostrarHistorial(false);
    setResultingClimate(null);
    setErrorFound("");
    setCityFound(dataCity);

    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${dataCity}`
    );

    if (!response.ok) {
      throw new Error("Hubo un error..");
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      setErrorFound("NO SE ENCONTRARON RESULTADOS...");
      setCityResults([]);
      return;
    }

    setCityResults(data.results);
  }

  async function searchHistoryCity(cityName: string) {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}`
    );

    const data = await response.json();
    const city = data.results[0];

    selectCity(city);
  }


  async function selectCity(city: City) {
    setErrorFound("");
    setResultingClimate(null);
    setPronosticoHoras([]);
    setPronosticoDias(null);
    setMostrarHistorial(true);
    setCityResults([]);
    setPronosticoDias(null);
    setCargando(true);
    setCiudadesPopulares((prev) => {
      const ciudadExistente = prev.find(
        (item) => item.id === city.id
      );

      if (ciudadExistente) {
        return prev
          .map((item) =>
            item.id === city.id
              ? { ...item, selecciones: item.selecciones + 1 }
              : item
          )
          .sort((a, b) => b.selecciones - a.selecciones);
      }

      return [
        ...prev,
        { ...city, selecciones: 1 },
      ];
    });

    setCityFound(
      city.name + ", " + city.country + flags[city.country_code]
    );

    try {
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,weather_code,apparent_temperature,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,is_day&hourly=temperature_2m,weather_code,is_day&timezone=auto&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=7`
      );

      if (!weatherResponse.ok) {
        throw new Error("Hubo un error..");
      }

      const dataWeather: WeatherData = await weatherResponse.json();

      setPronosticoDias(dataWeather.daily);
      console.log("Nuevo pronóstico semanal:", dataWeather.daily.time);

      const indiceHoraActual = dataWeather.hourly.time.findIndex(
        (hora) => hora >= dataWeather.current.time
      );

      const proximasHoras = dataWeather.hourly.time.slice(
        indiceHoraActual,
        indiceHoraActual + 24
      );

      const proximasTemperaturas = dataWeather.hourly.temperature_2m.slice(
        indiceHoraActual,
        indiceHoraActual + 24
      );

      const proximosCodigosClima = dataWeather.hourly.weather_code.slice(
        indiceHoraActual,
        indiceHoraActual + 24
      );

      const proximasHorasDias = dataWeather.hourly.is_day.slice(
        indiceHoraActual,
        indiceHoraActual + 24
      );

      const pronostico = proximasHoras.map((hora, i) => ({
        time: hora,
        temperature: proximasTemperaturas[i],
        weatherCode: proximosCodigosClima[i],
        isDay: proximasHorasDias[i],
      }));

      setPronosticoHoras(pronostico);
      setResultingClimate(dataWeather);
      console.log(pronostico);

      const fecha = new Date(dataWeather.current.time);

      const dias = [
        "Domingo",
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
      ];

      const meses = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ];

      const fechaFormateada =
        dias[fecha.getDay()] +
        ", " +
        fecha.getDate() +
        " " +
        meses[fecha.getMonth()] +
        " • " +
        fecha.getHours() +
        ":" +
        String(fecha.getMinutes()).padStart(2, "0");

      setFechaActualizada(fechaFormateada);

      if (!cityHistory.some((historyCity) => historyCity.id === city.id)) {
        const newHistory = [...cityHistory, city];
        setCityHistory(newHistory);
      }

    } catch (error) {
      console.error("Error al obtener el clima:", error);
      setErrorFound("No se pudo obtener el clima. Verifica tu conexión e intenta nuevamente.");
    } finally {
      setCargando(false);
    }

  }
  let descripcionClima = "";

  if (resultingClimate) {
    const codigoClima = resultingClimate.current.weather_code;

    if (codigoClima === 0) {
      descripcionClima = "Despejado";
    } else if (codigoClima === 1) {
      descripcionClima = "Mayormente despejado";
    } else if (codigoClima === 2) {
      descripcionClima = "Parcialmente nublado";
    } else if (codigoClima === 3) {
      descripcionClima = "Nublado";
    } else if (codigoClima === 45 || codigoClima === 48) {
      descripcionClima = "Niebla";
    } else if (codigoClima >= 51 && codigoClima <= 67) {
      descripcionClima = "Lluvia o llovizna";
    } else if (codigoClima >= 71 && codigoClima <= 86) {
      descripcionClima = "Nieve";
    } else if (codigoClima >= 95) {
      descripcionClima = "Tormenta";
    } else {
      descripcionClima = "Condición desconocida";
    }
  }
  console.log(
    "Clima actual:",
    resultingClimate?.current.weather_code,
    resultingClimate?.current.is_day
  );
  const IconoClima = resultingClimate
    ? resultingClimate.current.is_day === 0
      ? resultingClimate.current.weather_code === 0
        ? Moon
        : resultingClimate.current.weather_code === 1 ||
          resultingClimate.current.weather_code === 2
          ? CloudMoon
          : obtenerIconoClima(resultingClimate.current.weather_code)
      : obtenerIconoClima(resultingClimate.current.weather_code)
    : null;

  const colorClima = resultingClimate
    ? obtenerColorClima(resultingClimate.current.weather_code)
    : "";
  const ciudadesFrecuentes = ciudadesPopulares
    .filter((city) => city.selecciones >= 3)
    .slice(0, 5);

  return (

    <div className="space-y-4 p-4 sm:p-6 md:p-10 text-center mt-0 min-h-screen flex flex-col items-center text-white relative isolate bg-sky-950">
      {resultingClimate === null && cityResults.length === 0 && !cargando && (
        <img
          src="/images/Mascota%20del%20clima%20en%20movimiento.png"
          alt="Logo de Weather In Motion"
          className="hidden sm:block absolute top-5 left-5 w-28 md:w-36 opacity-90 z-10 pointer-events-none"
        />
      )}
      <div className="bg-slate-800/90 backdrop-blur-md border border-white/10 shadow-xl rounded-2xl p-6 w-full max-w-xl">

        <div className="flex gap-2 w-full">
          <input
            className="w-full bg-slate-700 text-white rounded-2xl h-10 px-4 py-2 border-b-slate-800"
            type="text"
            value={dataCity}
            onChange={(event) => setDataCity(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                citySearch();
              }
            }}
          />

          <button
            className="bg-sky-500 hover:bg-sky-300 text-black font-bold py-2 px-5 h-10 rounded-2xl cursor-pointer"
            onClick={citySearch}
          >
            Buscar
          </button>
        </div>
      </div>
      {cityResults.map((city) => (
        <p
          key={city.id}
          onClick={() => selectCity(city)}
          className="cursor-pointer p-3 rounded-lg bg-slate-800 text-white hover:bg-slate-700 border border-slate-600"
        >
          {city.name} - {city.country} {flags[city.country_code]}
        </p>
      ))}
      <div className="w-full max-w-xl">
        {mostrarHistorial && cityHistory.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-left mb-3">
              Recientes:
            </h2>
            <button
              onClick={() => setMostrarConfirmacion(true)}
              className="text-sm text-sky-300 hover:text-sky-100 transition-colors cursor-pointer"
            >
              Limpiar historial
            </button>

            <div className="flex flex-wrap justify-center gap-4 w-full max-w-4xl mx-auto">
              {cityHistory.map((city) => (
                <p
                  onClick={() => selectCity(city)}
                  className="cursor-pointer p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-center border border-slate-600"
                  key={city.id}
                >
                  {city.name} - {city.country}
                </p>
              ))}
            </div>
          </>
        )}
      </div>
      {mostrarConfirmacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">

            <h2 className="text-xl font-bold text-white mb-3">
              ¿Limpiar historial?
            </h2>

            <p className="text-slate-300 mb-6">
              Se eliminarán todas las ciudades recientes. Esta acción no se puede deshacer.
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setMostrarConfirmacion(false)}
                className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  setCityHistory([]);
                  setMostrarConfirmacion(false);
                }}
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold transition-colors cursor-pointer"
              >
                Eliminar
              </button>
            </div>

          </div>
        </div>
      )}
      {mostrarConfirmacionPopulares && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">

            <h2 className="text-xl font-bold text-white mb-3">
              ¿Restablecer ciudades populares?
            </h2>

            <p className="text-slate-300 mb-6">
              Se eliminarán los contadores de las ciudades más consultadas. Esta acción no se puede deshacer.
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setMostrarConfirmacionPopulares(false)}
                className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  setCiudadesPopulares([]);
                  setMostrarConfirmacionPopulares(false);
                }}
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold transition-colors cursor-pointer"
              >
                Restablecer
              </button>
            </div>

          </div>
        </div>
      )}
      {resultingClimate === null && cityResults.length === 0 && !cargando && (
        <section className="relative isolate w-full max-w-5xl text-center py-16 px-4 overflow-hidden rounded-3xl">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-900/20 via-sky-950/40 to-slate-950/80" />
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-sky-400/10 rounded-full blur-3xl -z-10" />

          <img
            src="/images/Mascota%20del%20clima%20en%20movimiento.png"
            alt="Mascota de Weather in Motion"
            className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-none opacity-25 blur-[2px] z-0 pointer-events-none"
          />

          <div className="relative z-10">

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
              Weather In{" "}
              <span className="text-sky-300 drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]">
                Motion
              </span>
            </h1>

            <p className="text-white mt-4 text-lg">
              Descubre el clima de cualquier lugar del mundo.
            </p>

            <p className="text-white text-sm mt-8 mb-3">
              CIUDADES POPULARES
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {["París", "Milán", "Buenos Aires", "Madrid", "Tokyo"].map((ciudad) => (
                <button
                  key={ciudad}
                  onClick={() => searchHistoryCity(ciudad)}
                  className="rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-white transition-transform duration-300 hover:scale-105 ease-in-out active:scale-95 hover:bg-sky-400/20 hover:border-sky-300 cursor-pointer"
                >
                  {ciudad}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
      {ciudadesFrecuentes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-white text-sm font-semibold mb-3">
            TUS CIUDADES MÁS CONSULTADAS
          </h2>
          <button
            onClick={() => setMostrarConfirmacionPopulares(true)}
            className="mt-4 text-sm text-sky-300 hover:text-sky-100 transition-colors cursor-pointer"
          >
            Restablecer ciudades más consultadas
          </button>

          <div className="flex flex-wrap justify-center gap-3">
            {ciudadesFrecuentes.map((city) => (
              <button
                key={city.id}
                onClick={() => selectCity(city)}
                className="rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-white transition-transform duration-300 hover:scale-105 hover:bg-sky-400/20 cursor-pointer"
              >
                {city.name} {flags[city.country_code]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-7xl items-start">
        <div className="flex flex-col gap-6 min-w-0">
          {resultingClimate !== null && (
            <div className="bg-slate-800/90 backdrop-blur-md border border-white/30 shadow-xl rounded-2xl p-6 w-full ">
              <h1 className="text-4xl font-bold text-center mt-4">
                WEATHER FORECAST
              </h1>



              <p className="text-xl font-medium">{cityFound}</p>

              {resultingClimate !== null && (
                <>

                  <div className="flex items-start justify-between gap-2 sm:gap-4 min-w-0">
                    <div className="flex flex-col items-start">
                      <p className="text-6xl sm:text-8xl font-bold mt-2 mb-2 whitespace-nowrap">
                        {resultingClimate.current.temperature_2m + " °C"}
                      </p>

                      <p className="text-2xl mt-2 mb-2 flex flex-col items-start gap-1">
                        <span className="text-slate-400 text-sm font-medium">
                          Sensación Térmica
                        </span>
                        <span className="text-white text-lg font-medium mt-2">
                          {resultingClimate.current.apparent_temperature + " °C"}
                        </span>
                      </p>

                      <p className="text-lg text-slate-300 mt-2 mb-1">
                        {fechaActualizada}
                      </p>

                      {descripcionClima && (
                        <p className="text-lg text-slate-200 font-medium text-right">
                          {descripcionClima}
                        </p>
                      )}
                    </div>

                    {IconoClima && (
                      <IconoClima
                        size={130}
                        className={`${colorClima} animate-pulse shrink-0 w-20 h-20 sm:w-[130px] sm:h-[130px]`}
                      />
                    )}
                  </div>


                  <div className="flex flex-row gap-4 w-full">
                    <div className="bg-slate-700 p-4 rounded-2xl text-white text-center mt-4 gap-2 flex flex-col flex-1">
                      <div className="flex items-center justify-center gap-2 ">
                        <Wind size={22} className="text-sky-400" />
                        <p className="text-3xl sm:text-4xl font-bold text-white text-center break-words">
                          Viento
                        </p>
                      </div>
                      <p className="text-4xl font-bold text-white text-center">
                        {resultingClimate.current.wind_speed_10m} Km/h
                      </p>

                      <div>
                        <p className="text-slate-400">Ráfagas hasta:</p>
                        <p className="text-sm text-white">
                          {resultingClimate.current.wind_gusts_10m + " Km/h"}
                        </p>
                      </div>

                    </div>

                    <div className="bg-slate-700 p-4 rounded-2xl text-white mt-4 gap-2 flex flex-col flex-1">
                      <div className="flex items-center justify-center gap-2">
                        <Droplets size={22} className="text-sky-400" />
                        <p className="text-lg font-semibold text-slate-400">
                          Humedad
                        </p>
                      </div>

                      <p className="text-4xl font-bold text-white mt-6 text-center">
                        {resultingClimate.current.relative_humidity_2m + " %"}
                      </p>
                    </div>
                  </div>

                </>

              )}
            </div>
          )}
          {resultingClimate !== null && (
            <div className="bg-slate-800/90 backdrop-blur-md border border-white/10 shadow-xl rounded-2xl p-6 w-full ">
              <h2 className="text-xl font-bold text-white">
                Pronóstico por horas
              </h2>

              <div className="flex gap-3 overflow-x-auto pb-2">
                {pronosticoHoras.map((hora, i) => {
                  console.log(hora.time, hora.weatherCode, hora.isDay);
                  console.log("Hora actual:", resultingClimate.current.time);
                  const IconoHora =
                    (hora.weatherCode === 0 || hora.weatherCode === 1) &&
                      hora.isDay === 0
                      ? Moon
                      : obtenerIconoClima(hora.weatherCode);
                  const colorHora = obtenerColorClima(hora.weatherCode);

                  return (
                    <div
                      key={hora.time}
                      className="flex flex-col items-center gap-2 bg-slate-700 rounded-xl p-4 min-w-[90px]">

                      <p className="text-white">
                        {i === 0
                          ? "Ahora"
                          : hora.time.split("T")[1]}
                      </p>
                      <IconoHora size={28}
                        className={`${colorHora}`}
                      />
                      <p className="text-lg font-bold text-white">
                        {Math.round(hora.temperature)} °C</p>



                    </div>

                  );
                })}
              </div>

            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 min-w-0">
          {pronosticoDias && !cargando && (
            <div className="bg-slate-800/90 backdrop-blur-md border border-white/10 shadow-xl rounded-2xl p-6 w-full">
              <h2 className="text-xl font-bold text-white">
                Pronóstico de 7 días
              </h2>

              <div className="flex flex-col gap-4 mt-4">
                {pronosticoDias.time.map((fecha, i) => {
                  const nombreDia = new Date(`${fecha}T12:00:00`).toLocaleDateString(
                    "es-BO",
                    { weekday: "long" }
                  );
                  const IconoDia = obtenerIconoClima(pronosticoDias.weather_code[i]);
                  const colorDia = obtenerColorClima(pronosticoDias.weather_code[i]);
                  return (
                    <div key={fecha} className="flex items-center justify-between gap-4 text-white">
                      <div className="w-24 shrink-0">
                        <p className=" font-medium">
                          {i === 0 ? 'Hoy' : nombreDia}
                        </p>

                      </div>
                      <div className="w-10 flex justify-center shrink-0">
                        <IconoDia size={28} className={colorDia} />
                      </div>
                      <div className="flex items-center justify-end gap-3 w-24 shrink-0">
                        <p className="font-semibold">
                          {pronosticoDias.temperature_2m_max[i]}°
                        </p>

                        <p className="text-slate-400">
                          {pronosticoDias.temperature_2m_min[i]}°
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {resultingClimate !== null && (
            <div className="bg-slate-800 p-6 rounded-2xl w-full">
              <h2 className="text-xl font-semibold mb-4">
                Evolución de temperatura
              </h2>

              <Suspense fallback={<p>Cargando gráfico...</p>}>
                <TemperatureChart
                  data={pronosticoHoras.map((hora) => ({
                    time: hora.time.split("T")[1],
                    temperature: hora.temperature,
                  }))}
                />
              </Suspense>
            </div>
          )}

          {errorFound !== "" && <p>{errorFound}</p>}
        </div>
      </div>
    </div>
  );
}

export default App;
