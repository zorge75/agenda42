import dayjs from 'dayjs'

export const roundToNearest15 = (date: any) => {
    let adjustedDate = dayjs(date);
    let minutes = adjustedDate.minute() - 15;
    let roundedMinutes = Math.round(minutes / 15) * 15;
    if (roundedMinutes === 60)
        adjustedDate = adjustedDate.add(1, 'h').minute(0);
    else
        adjustedDate = adjustedDate.minute(roundedMinutes);
    return (adjustedDate.second(0).millisecond(0).toISOString());
}
