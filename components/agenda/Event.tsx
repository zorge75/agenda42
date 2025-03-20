import dayjs from "dayjs";
import Button from "../bootstrap/Button";
import Card, { CardHeader, CardLabel, CardTitle, CardBody } from "../bootstrap/Card";
import Markdown from 'react-markdown'
import Badge from "../bootstrap/Badge";
import Icon from "../icon/Icon";

function convertToMdLinks(text: any) {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlPattern, (match: string) => {
        // Extract just the domain part
        const domain = match.split('/')[2] || match;
        return `[${domain}](${match})`;
    });
}
const Event = ({ eventItem, token, originalSlotsIntra, }: any) => {
    const unsubscribeHandler = async (event: any) => {
        window.open(`https://profile.intra.42.fr/events/${event.id}`, "_blank");
    };

    return (
        eventItem.scale_team != "invisible"
            ? <>


                <Badge color='success' className="mb-4">
                    <Icon icon="LocationOn" />  {eventItem.location}
                </Badge>
                <h3>{eventItem.name}</h3>

                <Card borderColor={"light"} borderSize="2" className="mt-4 mb-5" >
                    <CardBody>
                        <div className='row align-items-end'>
                            <div className='col-lg-6'>
                                <div className='h4 mb-3'>{dayjs(eventItem.start).format('DD MMMM')}</div>
                                <span className='display-6 fw-bold text-dark'>{dayjs(eventItem.start).format('H:mm')}</span>
                            </div>
                            <div className='col-lg-6'>
                                <div className='h4 mb-3'>
                                    <Badge color='dark'>
                                        {eventItem.kind}
                                    </Badge>
                                </div>
                                <span className='display-6 fw-bold text-dark'>{dayjs(eventItem.end).format('H:mm')}</span>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <p className="h5"> <Markdown>{convertToMdLinks(eventItem.description)}</Markdown></p>

                <div className="col mt-5">
                    <Button
                        color="success"
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