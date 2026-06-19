import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  MapPin,
  Sparkles,
  Sun,
  Timer,
} from "lucide-react";

import { GlassCard } from "../glass/GlassCard";
import { useDashboardData } from "../../context/DashboardDataContext";
import type { CalendarEvent, CareerItem } from "../../types/dashboard";

type WeatherState = {
  temperature: number | null;
  weatherCode: number | null;
  loading: boolean;
  error: string;
};

const DEFAULT_LOCATION_LABEL = "천호동, 강동구";

const toLocalDateInput = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatClock = (date: Date) => {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

const formatDateLabel = (date: Date) => {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
};

const eventTouchesToday = (event: CalendarEvent, today: string) => {
  return event.startDate <= today && event.endDate >= today;
};

const diffDays = (targetDate: string) => {
  if (!targetDate) return null;

  const today = new Date(`${toLocalDateInput()}T00:00:00`);
  const target = new Date(`${targetDate}T00:00:00`);
  const diff = target.getTime() - today.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const isActiveCareer = (item: CareerItem) => {
  return (
    item.status === "Preparing" ||
    item.status === "Submitted" ||
    item.status === "Interview"
  );
};

const getCareerTargetDate = (item: CareerItem) => {
  return item.applicationEndDate || item.deadline;
};

const getWeatherInfo = (code: number | null) => {
  if (code === null) {
    return {
      label: "Weather",
      Icon: Cloud,
    };
  }

  if (code === 0) {
    return {
      label: "맑음",
      Icon: Sun,
    };
  }

  if ([1, 2, 3].includes(code)) {
    return {
      label: "구름",
      Icon: Cloud,
    };
  }

  if ([45, 48].includes(code)) {
    return {
      label: "안개",
      Icon: CloudFog,
    };
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return {
      label: "이슬비",
      Icon: CloudDrizzle,
    };
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return {
      label: "비",
      Icon: CloudRain,
    };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return {
      label: "눈",
      Icon: CloudSnow,
    };
  }

  if ([95, 96, 99].includes(code)) {
    return {
      label: "천둥",
      Icon: CloudLightning,
    };
  }

  return {
    label: "흐림",
    Icon: Cloud,
  };
};

export const TodayFocusWidget = () => {
  const { calendarEvents, careerApplications } = useDashboardData();

  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState<WeatherState>({
    temperature: null,
    weatherCode: null,
    loading: true,
    error: "",
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000 * 30);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadWeather = async (latitude: number, longitude: number) => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`
        );

        if (!response.ok) {
          throw new Error("Weather request failed.");
        }

        const data = await response.json();

        setWeather({
          temperature: Math.round(data.current?.temperature_2m ?? 0),
          weatherCode: data.current?.weather_code ?? null,
          loading: false,
          error: "",
        });
      } catch {
        setWeather({
          temperature: null,
          weatherCode: null,
          loading: false,
          error: "날씨 불러오기 실패",
        });
      }
    };

    if (!navigator.geolocation) {
      setWeather({
        temperature: null,
        weatherCode: null,
        loading: false,
        error: "위치 권한 없음",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        loadWeather(position.coords.latitude, position.coords.longitude);
      },
      () => {
        // 위치 권한 거부 시 천호동 근처 좌표로 기본 표시
        loadWeather(37.5386, 127.1237);
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 1000 * 60 * 30,
      }
    );
  }, []);

  const today = toLocalDateInput(now);

  const todayEvents = useMemo(() => {
    return calendarEvents.filter((event) => eventTouchesToday(event, today));
  }, [calendarEvents, today]);

  const urgentCareerCount = useMemo(() => {
    return careerApplications.filter((item) => {
      if (!isActiveCareer(item)) return false;

      const targetDate = getCareerTargetDate(item);
      const diff = diffDays(targetDate);

      return diff !== null && diff <= 7;
    }).length;
  }, [careerApplications]);

  const nextEvent = useMemo(() => {
    return [...todayEvents].sort((a, b) =>
      `${a.startTime}`.localeCompare(`${b.startTime}`)
    )[0];
  }, [todayEvents]);

  const weatherInfo = getWeatherInfo(weather.weatherCode);
  const WeatherIcon = weatherInfo.Icon;

  return (
    <GlassCard
      title="Today"
      subtitle={formatDateLabel(now)}
      icon={<Sparkles className="w-4 h-4" />}
      className="today-mini-card"
    >
      <div className="today-mini">
        <section className="today-mini-main">
          <div>
            <div className="today-mini-time">{formatClock(now)}</div>

            <div className="today-mini-location">
              <MapPin className="w-3.5 h-3.5" />
              {DEFAULT_LOCATION_LABEL}
            </div>
          </div>

          <div className="today-mini-weather">
            <WeatherIcon className="w-6 h-6" />

            <div>
              <strong>
                {weather.loading
                  ? "--°"
                  : weather.temperature !== null
                    ? `${weather.temperature}°`
                    : "--°"}
              </strong>
              <span>{weather.error || weatherInfo.label}</span>
            </div>
          </div>
        </section>

        <section className="today-mini-stats">
          <div className="today-mini-stat">
            <CalendarCheck className="w-4 h-4" />
            <div>
              <strong>{todayEvents.length}</strong>
              <span>events</span>
            </div>
          </div>

          <div className="today-mini-stat">
            <Timer className="w-4 h-4" />
            <div>
              <strong>{urgentCareerCount}</strong>
              <span>deadlines</span>
            </div>
          </div>
        </section>

        <section className="today-mini-next">
          <div className="today-mini-next-label">Next</div>

          {nextEvent ? (
            <div className="today-mini-next-content">
              <span>{nextEvent.startTime}</span>
              <strong>{nextEvent.title}</strong>
            </div>
          ) : (
            <div className="today-mini-next-empty">No event left today.</div>
          )}
        </section>
      </div>
    </GlassCard>
  );
};