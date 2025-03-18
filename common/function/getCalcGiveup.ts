export const getCalcGiveup = (event: any) => {
    if (event?.flag.name === 'Ok' && event?.final_mark === 0) {
        return (true);
    }
    return (false);
}
