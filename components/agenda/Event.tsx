import dayjs from "dayjs";
import Button from "../bootstrap/Button";

const Event = ({ eventItem, token, originalSlotsIntra, }: any) => {
    const unsubscribeHandler = async (event: any) => {
        window.open(`https://profile.intra.42.fr/events/${event.id}`, "_blank");
    };

    return (
        eventItem.scale_team != "invisible"
            ? <>
                <h2>{eventItem.name}</h2>
                <p>{eventItem.description}</p>
                <p>{eventItem.kind}</p>
                <p>{eventItem.location}</p>
                <p> {eventItem.max_people}</p>
                <p> {eventItem.nbr_subscribers}</p>
                <p> {eventItem.prohibition_of_cancellation}</p>
                <p> {eventItem.themes}</p>

                <div className="col">
                    <Button
                        color="primary"
                        type="submit"
                        onClick={() => unsubscribeHandler(eventItem)}
                    >
                        Open event in intra
                    </Button>
                    <br />
                </div>
            </>
            : <div>You will evaluate someone at {dayjs(eventItem.slots_data[0].begin_at).format('H:mm')}</div>
    );
};

export default Event;