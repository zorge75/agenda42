import Card, {
    CardActions,
    CardBody,
    CardHeader,
} from "../../components/bootstrap/Card";
import {
    Calendar,
    dayjsLocalizer,
    Views,
} from "react-big-calendar";
import { Calendar as DatePicker } from "react-date-range";
import {
    CalendarTodayButton,
    CalendarViewModeButtons,
    getLabel,
} from "../../components/extras/calendarHelper";
import Popovers from "../../components/bootstrap/Popovers";
import Button from "../../components/bootstrap/Button";
import Spinner from "../../components/bootstrap/Spinner";
import { customFormats, customStyles } from "../../common/function/customStyles";
import { MyEvent, MyWeekEvent } from "../../components/agenda/TemplatesEvent";
import dayjs from "dayjs";
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import ThemeContext from "../../context/themeContext";
import { useContext } from "react";

const MasterCalendar = ({
    unitType,
    date,
    setDate,
    viewMode,
    refresh,
    scaleUsers,
    setSwitchEvents,
    switchEvents,
    refreshHandler,
    eventsActive,
    views,
    moveEvent,
    setInfoEvent,
    setEventItem,
    handleSelect,
    eventStyleGetter,
}: any) => {
    const { mobileDesign } = useContext(ThemeContext);
    const todayAt9AM = dayjs().set('hour', 7).set('minute', 0).set('second', 0).set('millisecond', 0).toISOString();
    const todayAt0AM = dayjs().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).toISOString();

    const localizer = dayjsLocalizer(dayjs);
    const DnDCalendar = withDragAndDrop(Calendar);

    const calendarDateLabel = getLabel(date, viewMode);

    return (
        <Card stretch style={{ minHeight: 600 }} >
            <CardHeader style={mobileDesign ? {paddingBottom: 0} : {}}>
                <CardActions>
                    <CalendarTodayButton
                        unitType={unitType}
                        date={date}
                        setDate={setDate}
                        viewMode={viewMode}
                        central
                    />
                </CardActions>
                <Popovers
                    desc={
                        <DatePicker
                            onChange={(item) => setDate(item)}
                            date={date}
                            color={process.env.NEXT_PUBLIC_PRIMARY_COLOR}
                        />
                    }
                    placement="bottom-end"
                    className="mw-100"
                    trigger="click"
                >
                    <Button color="light">{calendarDateLabel}</Button>
                </Popovers>
                <div className="switch_events">
                    <Button
                        isDisable={refresh || !scaleUsers}
                        color={switchEvents == "all" ? 'primary' : 'light'}
                        onClick={() => setSwitchEvents("all")}
                    >
                        Agenda
                    </Button>
                    <Button
                        isDisable={refresh || !scaleUsers}
                        color={switchEvents == "my" ? 'primary' : 'light'}
                        onClick={() => setSwitchEvents("my")}
                    >
                        Focusing
                    </Button>

                    {/* <Button
                                      disabled={refresh || !scaleUsers}
                                      color={switchEvents == "meeting" ? 'primary' : 'light'}
                                      onClick={() => setSwitchEvents("meeting")}
                                    >
                                      Meeting rooms
                                    </Button> */}
                </div>
                {
                    (refresh || !scaleUsers)
                        ?
                        <div className="spinner"> <Spinner random inButton /></div>
                        :
                        <Button icon='Refresh' color='storybook' onClick={refreshHandler}>Update</Button>
                }
                
                    <CalendarViewModeButtons viewMode={viewMode} />
                
            </CardHeader>
            <CardBody isScrollable style={mobileDesign ? { paddingTop: 0 } : {}}>
                <DnDCalendar
                    formats={customFormats}
                    selectable
                    toolbar={false}
                    localizer={localizer}
                    events={eventsActive}
                    defaultView={Views.WEEK}
                    views={views}
                    view={mobileDesign ? Views.DAY : viewMode}
                    date={date}
                    step={15}
                    min={viewMode == Views.WORK_WEEK ? todayAt9AM : todayAt0AM}
                    onNavigate={(_date) => setDate(_date)}
                    scrollToTime={dayjs().add(-1, 'h').toISOString()}
                    defaultDate={new Date()}
                    onEventDrop={moveEvent}
                    onEventResize={moveEvent}
                    draggableAccessor="isDraggable"
                    onSelectEvent={(event) => {
                        setInfoEvent();
                        setEventItem(event);
                    }}
                    onSelectSlot={handleSelect}
                    components={{
                        event: MyEvent,
                        week: {
                            event: MyWeekEvent,
                        },
                        work_week: {
                            event: MyWeekEvent,
                        },
                    }}
                    eventPropGetter={eventStyleGetter}
                    style={mobileDesign ? { height: '66vh' } : {}}
                />
                <style>{customStyles}</style>
            </CardBody>
        </Card>
    )
};

export default MasterCalendar;