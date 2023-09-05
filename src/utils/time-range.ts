import {
    eachDayOfInterval,
    isWeekend,
    setHours,
    setMinutes,
    format,
    addMinutes,
} from "date-fns";
import prisma from "../lib/prisma";

const allowedTimesForSlot = [
    "10:00:00 am",
    "10:30:00 am",
    "11:00:00 am",
    "11:30:00 am",
    "12:00:00 pm",
    "12:30:00 pm",
    "01:00:00 pm",
    "01:30:00 pm",
    "02:00:00 pm",
    "02:30:00 pm",
    "03:00:00 pm",
    "03:30:00 pm",
    "04:00:00 pm",
    "04:30:00 pm",
    "05:00:00 pm" ]

async function getAvailableTime ( inputDate: Date ) {
    const slotTime = format( inputDate, "HH:mm:ss a" ).toLowerCase();
    const slotDate = format( inputDate, "yyyy-MM-dd" ).toLowerCase();
    const slotEnd = format( addMinutes( inputDate, 30 ), "HH:mm:ss a" ).toLowerCase();

    console.log( [ slotTime, slotDate, slotEnd ] )

    const scheduledVaccinationTimes = await prisma.timeOfVaccination.findMany( {
        where: { date: slotDate },
        select: { timeFrom: true }
    } )


    const availableTimes = []
    scheduledVaccinationTimes.map( data => availableTimes.push( data[ 'timeFrom' ] ) )

    if ( !scheduledVaccinationTimes.length ) return false;
    const filteredArray = allowedTimesForSlot.filter( item => availableTimes.indexOf( item ) === -1 );

    const response = {
        availableTimes: filteredArray,
        from: slotTime,
        to: slotEnd,
        date: slotDate
    }

    console.log( response )
    return response;

}

async function generateTimeRangeForMonth ( slotDate: Date ) {

    const month = parseInt(
        ( slotDate.getMonth() + 1 ).toString().padStart( 2, "0" )
    );
    const startDate = new Date(
        slotDate.getFullYear(),
        month - 1,
        slotDate.getDate()
    );
    const endDate = new Date( slotDate.getFullYear(), month, 0 );
    const timeRange: { timeRange: string[] } = {
        timeRange: []
    };

    const startTime = setHours( setMinutes( startDate, 0 ), 10 ); // 10:00 AM
    const endTime = setHours( setMinutes( startDate, 0 ), 17 ); // 5:00 PM
    const daysOfMonth = eachDayOfInterval( { start: startDate, end: endDate } );

    for ( const day of daysOfMonth ) {
        if ( !isWeekend( day ) ) {
            const startTimeOfDay = setHours( day, 10 );
            const endTimeOfDay = setHours( day, 17 );

            if ( startTimeOfDay >= startTime && endTimeOfDay <= endTime ) {
                timeRange[ "timeRange" ] = startTimeOfDay
                    .toLocaleString()
                    .split( "," );
            }
        }
    }

    return timeRange;
}


export { getAvailableTime, generateTimeRangeForMonth }