

export const isSubscriptionDue = (schedule: string[], date: Date) => {
    for (const sd of schedule) {
        const sdDate = new Date(sd);
        // console.log(sdDate.getUTCFullYear(), date.getUTCFullYear());
        // console.log(sdDate.getUTCMonth(), date.getUTCMonth());
        // console.log(sdDate.getUTCDay(), date.getUTCDay());
        // console.log(sdDate.getUTCHours(), date.getUTCHours());
        // console.log('------')
        // Check if year, month, and hour match
        if (sdDate.getUTCFullYear() === date.getUTCFullYear() &&
            sdDate.getUTCMonth() === date.getUTCMonth() &&
            sdDate.getUTCDay() === date.getUTCDay() && 
            sdDate.getHours() === date.getUTCHours()
        ) {
            return true;
        }
    }
    return false;
}