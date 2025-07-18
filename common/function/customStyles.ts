import dayjs from "dayjs";
import { Formats } from "react-big-calendar";

export const customStyles = `
    .rbc-current-time-indicator {
        background-color: red;
        height: 2px;
        z-index: 10;
    }
	.rbc-current-time-indicator::before,
    .rbc-current-time-indicator::after {
        content: '';
        position: absolute;
        width: 6px;
        height: 6px;
        background-color: red;
        border-radius: 50%;
        top: -2px;
    }
    .rbc-current-time-indicator::before {left: 0;}
    .rbc-current-time-indicator::after {right: 0;}
`;


export const customFormats = {
  firstDayOfWeek: () => 0,
  timeGutterFormat: "H:mm",
  eventTimeRangeFormat: (
    { start, end }: { start: Date; end: Date },
    culture: string,
    localizer: any,
  ) => `${localizer.format(start, "H:mm")} - ${localizer.format(end, "H:mm")}`,
  dayHeaderFormat: (date: any) => dayjs(date).format("D MMMM (dddd)"),
  dayFormat: (date: any) => dayjs(date).format("ddd, D MMMM"),
  weekdayFormat: (date: any) => dayjs(date).format("ddd"),
} as Formats;
