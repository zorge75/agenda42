import React, { useEffect, useState } from "react";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import dayjs from "dayjs";
import classNames from "classnames";
import Hanna from './../assets/img/hanna.gif';
import {
  Calendar,
  dayjsLocalizer,
  Formats,
  View as TView,
  Views,
} from "react-big-calendar";
import { useFormik } from "formik";
import Head from "next/head";
import { Calendar as DatePicker } from "react-date-range";
import eventList, { IEvents } from "../common/data/events";
import USERS, {
  getUserDataWithUsername,
  IUserProps,
} from "../common/data/userDummyData";
import { TColor } from "../type/color-type";
import useDarkMode from "../hooks/useDarkMode";
import Icon from "../components/icon/Icon";
import Avatar, { AvatarGroup } from "../components/Avatar";
import Tooltips from "../components/bootstrap/Tooltips";
import {
  CalendarTodayButton,
  CalendarViewModeButtons,
  getLabel,
  getUnitType,
  getViews,
} from "../components/extras/calendarHelper";
import {
  getServiceDataWithServiceName,
} from "../common/data/serviceDummyData";
import PageWrapper from "../layout/PageWrapper/PageWrapper";
import { demoPagesMenu } from "../menu";
import Popovers from "../components/bootstrap/Popovers";
import Button from "../components/bootstrap/Button";
import Page from "../layout/Page/Page";
import Card, {
  CardActions,
  CardBody,
  CardHeader,
  CardLabel,
  CardSubTitle,
  CardTitle,
} from "../components/bootstrap/Card";
import OffCanvas, {
  OffCanvasBody,
  OffCanvasHeader,
  OffCanvasTitle,
} from "../components/bootstrap/OffCanvas";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import { setUnitType } from "../store/slices/calendarSlice";
import axios from "axios";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";
import showNotification from "../components/extras/showNotification";
import { setOriginalSlots, setScaleTeams, setSlots } from "../store/slices/slotsSlice";
import { preparationSlots } from "../common/function/preparationSlots";
import { getScaleTeams } from "../common/function/getScaleTeams";
import { getCorrectorImageUrl } from "../common/function/getCorrectorImageUrl";
import { setEvals } from "../store/slices/evalsSlice";
import { setEvents as setEventsRedux, setAllEvents } from '../store/slices/eventsSlice';
import Spinner from "../components/bootstrap/Spinner";

dayjs.extend(utc);
dayjs.locale("fr");
const localizer = dayjsLocalizer(dayjs);
const now = new Date();

const customStyles = `
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

const customFormats = {
  firstDayOfWeek: () => 1,
  timeGutterFormat: "H:mm", // Simple string format: "8:00", "9:00", etc.
  eventTimeRangeFormat: (
    { start, end }: { start: Date; end: Date },
    culture: string,
    localizer: any,
  ) => `${localizer.format(start, "H:mm")} - ${localizer.format(end, "H:mm")}`,
  // dayRangeHeaderFormat: ({ start, end }) => {
  // 	const startFormatted = dayjs(start).format('D MMMM (dddd)');
  // 	const endFormatted = dayjs(end).format('D MMMM (dddd)');
  // 	return `${startFormatted} - ${endFormatted}`;
  // },
  // Optional: Format for single day headers (e.g., day view)
  dayHeaderFormat: (date: any) => dayjs(date).format("D MMMM (dddd)"),
  dayFormat: (date: any) => dayjs(date).format("ddd, D MMMM"), // Short weekday
  // Alternative: Full weekday
  // dayFormat: (date) => dayjs(date).format('D MMMM (dddd)'),
  // Format for weekday labels if needed (e.g., "jeu")
  weekdayFormat: (date: any) => dayjs(date).format("ddd"),
} as Formats;

interface IEvent extends IEvents {
  user?: IUserProps;
  users?: IUserProps[];
  color?: TColor;
}

const MyEvent = (data: { event: IEvent }) => {
  const { darkModeStatus } = useDarkMode();

  const { event } = data;
  return (
    <div className="row g-2">
      <div className="col text-truncate">
        {event?.icon && <Icon icon={event?.icon} size="lg" className="me-2" />}
        {event?.name}
      </div>
      {event?.user?.src && (
        <div className="col-auto">
          <div className="row g-1 align-items-baseline">
            <div className="col-auto">
              <Avatar src={event?.user?.src} size={18} />
            </div>
            <small
              className={classNames("col-auto text-truncate", {
                "text-dark": !darkModeStatus,
                "text-white": darkModeStatus,
              })}
            >
              {event?.user?.name}
            </small>
          </div>
        </div>
      )}
      {event?.users && (
        <div className="col-auto">
          <AvatarGroup size={18}>
            {event.users.map((user) => (
              // eslint-disable-next-line react/jsx-props-no-spreading
              <Avatar key={user.src} {...user} />
            ))}
          </AvatarGroup>
        </div>
      )}
    </div>
  );
};

const MyWeekEvent = (data: { event: IEvent }) => {
  const { darkModeStatus } = useDarkMode();

  const { event } = data;
  return (
    <div className="row g-2">
      <div className="col-12 text-truncate">
        {event?.icon && <Icon icon={event?.icon} size="lg" className="me-2" />}
        {event?.name}
      </div>
      {event?.user && (
        <div className="col-12">
          <div className="row g-1 align-items-baseline">
            <div className="col-auto">
              {/* eslint-disable-next-line react/jsx-props-no-spreading */}
              <Avatar {...event?.user} size={18} />
            </div>
            <small
              className={classNames("col-auto text-truncate", {
                "text-dark": !darkModeStatus,
                "text-white": darkModeStatus,
              })}
            >
              {event?.user?.name}
            </small>
          </div>
        </div>
      )}
      {event?.users && (
        <div className="col-12">
          <AvatarGroup size={18}>
            {event.users.map((user) => (
              // eslint-disable-next-line react/jsx-props-no-spreading
              <Avatar key={user.src} {...user} />
            ))}
          </AvatarGroup>
        </div>
      )}
    </div>
  );
};

const MyEventDay = (data: { event: IEvent }) => {
  const { event } = data;
  return (
    <Tooltips
      title={`${event?.name} / ${dayjs(event.start).format("H:mm")} - ${dayjs(
        event.end,
      ).format("H:mm")}`}
    >
      <div className="row g-2">
        {event?.user?.src && (
          <div className="col-auto">
            <Avatar src={event?.user?.src} size={16} />
          </div>
        )}
        {event?.users && (
          <div className="col">
            <AvatarGroup size={16}>
              {event.users.map((user) => (
                // eslint-disable-next-line react/jsx-props-no-spreading
                <Avatar key={user.src} {...user} />
              ))}
            </AvatarGroup>
          </div>
        )}
        <small className="col text-truncate">
          {event?.icon && (
            <Icon icon={event?.icon} size="lg" className="me-2" />
          )}
          {event?.name}
        </small>
      </div>
    </Tooltips>
  );
};

const Index: NextPage = ({ token }: any) => {
  const { darkModeStatus, themeStatus } = useDarkMode();
  const dispatch = useDispatch();
  const [localRemoved, setLocalRemoved] = useState([]);
  const eventsIntra = useSelector((state: RootState) => state.events.events);
  const allEvents = useSelector((state: RootState) => state.events.all);
  const slotsIntra = useSelector((state: RootState) => state.slots.slots);
  const originalSlotsIntra = useSelector((state: RootState) => state.slots.original);
  const viewMode = useSelector((state: RootState) => state.calendar.unitType);
  const me = useSelector((state: RootState) => state.user.me);
  const scaleUsers = useSelector((state: RootState) => state.slots.scaleTeam);

  const unsubscribeHandler = async (event: any) => {
    if (event.scale_team !== 'event') {
      const res = await fetch("/api/proxy?id=" + event.id, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const filtredSlots = originalSlotsIntra.filter((i: any) => i.id != event.id);
        dispatch(setOriginalSlots(filtredSlots));
        dispatch(setSlots(preparationSlots(filtredSlots)));
        showNotification(
          <span className='d-flex align-items-center'>
            <Icon
              icon='Info'
              size='lg'
              className='me-1'
            />
            <span>Successfully</span>
          </span>,
          'Slot has been deleted',
          'success'
        );
      } else {
        showNotification(
          <span className='d-flex align-items-center'>
            <Icon
              icon='Error'
              size='lg'
              className='me-1'
            />
            <span>Error</span>
          </span>,
          "Slot not removed",
          'danger'
        );
      }
    } else {
      // router.push(`https://profile.intra.42.fr/events/${event.id}`);
      window.open(`https://profile.intra.42.fr/events/${event.id}`, "_blank");
    }
  };

  // BEGIN :: Calendar
  // Active employee
  const [employeeList, setEmployeeList] = useState({
    [USERS.JOHN.username]: true,
    [USERS.ELLA.username]: true,
    [USERS.RYAN.username]: true,
    [USERS.GRACE.username]: true,
  });
  // Events
  const [events, setEvents] = useState(eventList);
  const [eventsActive, setEventsActive] = useState(eventList);

  useEffect(() => {
    if (eventsIntra && slotsIntra) {
      const eventList = eventsIntra.map((event: any) => ({
        id: event.id,
        name: event.name ?? event.id,
        start: dayjs(event["begin_at"]).toDate(),
        end: dayjs(event["end_at"]).toDate(),
        color: "primary",
        user: null,
        description: event.description,
        kind: event.kind,
        location: event.location,
        max_people: event.max_people,
        nbr_subscribers: event.nbr_subscribers,
        prohibition_of_cancellation: event.prohibition_of_cancellation,
        themes: event.themes,
        scale_team: "event",
      }));
      const slotsList = slotsIntra.map((slot: any) => ({
        id: slot.id,
        name:
          slot.scale_team == "invisible" || slot.scale_team?.id
            ? ""
            : "Available",
        start: dayjs(slot["begin_at"]).toDate(),
        end: dayjs(slot["end_at"]).toDate(),
        color:
          slot.scale_team == "invisible" || slot.scale_team?.id
            ? "danger"
            : "success",
        user: null,
        description: "description",
        kind: "kind",
        location: "event.location",
        max_people: "event.max_people",
        nbr_subscribers: "event.nbr_subscribers",
        prohibition_of_cancellation: "event.prohibition_of_cancellation",
        themes: "event.themes",
        scale_team: slot.scale_team,
        slots_data: slot?.slots_data,
      }));
      setEvents([...eventList, ...slotsList]);
      setEventsActive([...eventList, ...slotsList]);
    }
  }, [eventsIntra, slotsIntra]);

  const initialEventItem: IEvent = {
    start: undefined,
    end: undefined,
    name: undefined,
    id: undefined,
    user: undefined,
  };
  // Selected Event
  const [eventItem, setEventItem] = useState<IEvent>(initialEventItem);
  // Calendar View Mode
  // const [viewMode, setViewMode] = useState<TView>(Views.MONTH);
  // Calendar Date
  const [date, setDate] = useState(new Date());
  // Item edit panel status
  const [toggleInfoEventCanvas, setToggleInfoEventCanvas] = useState(false);
  const setInfoEvent = () => setToggleInfoEventCanvas(!toggleInfoEventCanvas);
  const [eventAdding, setEventAdding] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [timeoutForRefresh, setTimeoutForRefresh] = useState(false);
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const [switchEvents, setSwitchEvents] = useState("my");

  useEffect(() => {
    let isMounted = true; // To prevent state updates after unmount
    let response;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/all_events?id=${me.campus[0].id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        response = await res.json();

        if (res.ok) {
          dispatch(setAllEvents(response));
          // Example: setState(response);
        } else {
          throw new Error(response.message || "Request failed");
        }
      } catch (error) {
        if (isMounted) {
          console.error("Fetch error:", error);
          // Handle error (e.g., setError(error.message))
        }
      }
    };
    if (!allEvents)
      fetchData();

    return () => {
      isMounted = false; // Prevent updates if component unmounts
    };
  }, [switchEvents, allEvents]);

  useEffect(() => {
    if (switchEvents == 'all' && allEvents) {
      const eventList = allEvents.map((event: any) => ({
        id: event.id,
        name: event.name ?? event.id,
        start: dayjs(event["begin_at"]).toDate(),
        end: dayjs(event["end_at"]).toDate(),
        color: "primary",
        user: null,
        description: event.description,
        kind: event.kind,
        location: event.location,
        max_people: event.max_people,
        nbr_subscribers: event.nbr_subscribers,
        prohibition_of_cancellation: event.prohibition_of_cancellation,
        themes: event.themes,
        scale_team: "event",
      })) || [];
      setEventsActive([
        ...events,
        ...eventList,
      ]);
      // dispatch(setUnitType(Views.WORK_WEEK));
    }
    else {
      setEventsActive([
        ...events
      ]);
      // dispatch(setUnitType(Views.WEEK));
    }
  }, [allEvents, switchEvents]);

  // Calendar Unit Type
  const unitType = getUnitType(viewMode);
  // Calendar Date Label
  const calendarDateLabel = getLabel(date, viewMode);

  // Change view mode
  const handleViewMode = (e: dayjs.ConfigType) => {
    setDate(dayjs(e).toDate());
    dispatch(setUnitType(Views.DAY));
  };

  // View modes; Month, Week, Work Week, Day and Agenda
  const views = getViews();

  const refreshHandler = async () => {
    setTimeoutForRefresh(true);
    setRefresh(true);
    const res = await fetch(
      "/api/refresh_agenda?id=" + me.id,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const response = await res.json();

    if (res.ok) {
      if (response.evaluations)
        dispatch(setEvals(response.evaluations));
      if (response.slots) {
        dispatch(setOriginalSlots(response.slots));
        dispatch(setSlots(preparationSlots(response.slots)));
      }
      if (response.events)
        dispatch(setEventsRedux(response.events));

      showNotification(
        <span className='d-flex align-items-center'>
          <Icon
            icon='Info'
            size='lg'
            className='me-1'
          />
          <span>Updated Successfully</span>
        </span>,
        'Agenda update. Button is disabler for 1 minute for safe trafic.',
        'success'
      );
    } else {
      location?.reload();
    }
    setRefresh(false);
    await delay(60000);
    setTimeoutForRefresh(false);
  }

  // New Event
  const handleSelect = async ({ start, end }: { start: any; end: any }) => {
    const startFormated = dayjs(start).add(-1, "h").format();
    const endFormated = dayjs(end).add(-1, "h").format();

    const res = await fetch(
      "/api/make_slot?id=" +
      me.id +
      "&end=" +
      endFormated +
      "&start=" +
      startFormated,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const slotJson = await res?.json();

    if (res.ok) {
      showNotification(
        <span className='d-flex align-items-center'>
          <Icon
            icon='Info'
            size='lg'
            className='me-1'
          />
          <span>Updated Successfully</span>
        </span>,
        'Slot has been created',
        'success'
      );
      const combined = [...slotJson, ...slotsIntra];
      dispatch(setOriginalSlots(combined));
      dispatch(setSlots(preparationSlots(combined)));
    } else {
      showNotification(
        <span className='d-flex align-items-center'>
          <Icon
            icon='Error'
            size='lg'
            className='me-1'
          />
          <span>Error</span>
        </span>,
        slotJson.message,
        'danger'
      );
    }
  };

  useEffect(() => {
    if (eventAdding) {
      setInfoEvent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventAdding]);

  const eventStyleGetter = (
    event: { color?: TColor },
    start: any,
    end: any,
    // isSelected: boolean,
  ) => {
    const isActiveEvent = start <= now && end >= now;
    const isPastEvent = end < now;
    const color = isActiveEvent ? "success" : event.color;

    return {
      className: classNames({
        [`bg-l${darkModeStatus ? "o25" : "10"}-${color} text-${color}`]: color,
        "border border-success": isActiveEvent,
        "opacity-50": isPastEvent,
      }),
    };
  };

  const formik = useFormik({
    initialValues: {
      eventName: "",
      eventStart: "",
      eventEnd: "",
      eventEmployee: "",
      eventAllDay: false,
    },
    onSubmit: (values) => {
      if (eventAdding) {
        setEvents((prevEvents) => [
          ...prevEvents,
          {
            id: values.eventStart,
            ...getServiceDataWithServiceName(values.eventName),
            end: values.eventEnd,
            start: values.eventStart,
            user: { ...getUserDataWithUsername(values.eventEmployee) },
          },
        ]);
      }
      setToggleInfoEventCanvas(false);
      setEventAdding(false);
      setEventItem(initialEventItem);
      formik.setValues({
        eventName: "",
        eventStart: "",
        eventEnd: "",
        eventEmployee: "",
        eventAllDay: false,
      });
    },
  });

  // Add state for loading and error handling
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch scaleUsers on mount
  useEffect(() => {
    const fetchScaleUsers = async () => {
      try {
        setLoading(true);
        const users = await getScaleTeams(slotsIntra, token); // Pass slotsIntra and token
        dispatch(setScaleTeams(users)); // Update Redux state
      } catch (err) {
        console.error("Failed to fetch scale users:", err);
        setError("Failed to load scale users");
        dispatch(setScaleTeams([])); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    if (slotsIntra && token) {
      fetchScaleUsers();
    }
  }, [slotsIntra, token, dispatch]);

  useEffect(() => {
    console.log('Date updated:', date);
  }, [date]);

  useEffect(() => {
    if (eventItem)
      formik.setValues({
        ...formik.values,
        // @ts-ignore
        eventId: eventItem.id || null,
        eventName: eventItem.name || "",
        eventStart: dayjs(eventItem.start).format(),
        eventEnd: dayjs(eventItem.end).format(),
        eventEmployee: eventItem?.user?.username || "",
      });
    return () => { };
    //	eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventItem]);
  // END:: Calendar
  return (
    <PageWrapper>
      <Head>
        <title>{demoPagesMenu.dashboard.text}</title>
      </Head>
      {/* <SubHeader>
        <SubHeaderLeft>
          
        </SubHeaderLeft>
        <SubHeaderRight>
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
        </SubHeaderRight>
      </SubHeader> */}
      <Page container="fluid">
        <div className="stories">
          <div className="row mb-4 g-3">
            {loading ? (

              Object.keys(USERS).map((u) => (
                <div key={USERS[u].username} className="col-auto">
                  <div className="position-relative">
                    <Avatar
                      src={USERS[u].src}
                      color={USERS[u].color}
                      size={64}
                      // border={4}
                      className="cursor-pointer"
                      borderColor={
                        employeeList[USERS[u].username] ? "info" : themeStatus
                      }
                      onClick={() =>
                        setEmployeeList({
                          ...employeeList,
                          [USERS[u].username]: !employeeList[USERS[u].username],
                        })
                      }
                    />
                    {!!events.filter(
                      (i) =>
                        i.user?.username === USERS[u].username &&
                        i.start &&
                        i.start < now &&
                        i.end &&
                        i.end > now,
                    ).length && (
                        <span className="position-absolute top-85 start-85 translate-middle badge border border-2 border-light rounded-circle bg-success p-2">
                          <span className="visually-hidden">Online user</span>
                        </span>
                      )}
                  </div>
                </div>
              ))

            ) : error ? (
              <div className="text-danger">{error}</div>
            ) : !scaleUsers || scaleUsers.length === 0 ? (
              <div>No scale users found</div>
            ) : (
              scaleUsers.map((u: any) => (
                <div key={u.login} className="col-auto">
                  <Popovers
                    trigger="hover"
                    desc={
                      <>
                        <div className="h4">{`${u.usual_full_name}`}</div>
                        <div className="h6">{`${u.grade}: ${u.level} level`}</div>
                        <div>
                          Piscine: {u.pool_month} {u.pool_year}
                        </div>
                        <div>
                          Login: {u.login}
                        </div>
                      </>
                    }
                  >
                    <div className="position-relative"
                      onClick={() => {
                        window.open("https://profile.intra.42.fr/users/" + u.login, "_blank")
                      }
                      }
                    >
                      <Avatar
                        src={u.image}
                        color={"info"}
                        size={64}
                        // border={2}
                        className="cursor-pointer"
                        borderColor={"info"}

                      />
                      {/* {!!events.filter(
                      (i) =>
                        i.user?.username === USERS[u].username &&
                        i.start &&
                        i.start < now &&
                        i.end &&
                        i.end > now,
                    ).length && (
                        <span className="position-absolute top-85 start-85 translate-middle badge border border-2 border-light rounded-circle bg-success p-2">
                          <span className="visually-hidden">Online user</span>
                        </span>
                      )} */}
                    </div>
                  </Popovers>

                </div>
              )))
            }

          </div>


          <div className="message_exam mb-4">
            <Icon icon="Info" color="danger" className="me-2" size="2x" />
            <p>Attention ! L'agenda ne prend pas en compte <strong>les examens</strong>.
              Pour vous inscrire aux examens, veuillez vous rendre sur l'intra !</p>
            <img
              src={Hanna}
              alt="Petit chat"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                transition: 'transform 0.3s ease-in-out'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(2)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            />
          </div>
        </div>
        <div className="row h-100">

          <div className="col-xl-3">
            <Card stretch style={{ minHeight: 600 }}>
              <CardHeader>
                <CardLabel icon="Today" iconColor="info">
                  <CardTitle>
                    {dayjs(date).format("dddd, D MMMM YYYY")}
                  </CardTitle>
                  <CardSubTitle>{dayjs(date).fromNow()}</CardSubTitle>
                </CardLabel>
                <CardActions>
                  <CalendarTodayButton
                    unitType={Views.DAY}
                    date={date}
                    setDate={setDate}
                    viewMode={Views.DAY}
                  />
                </CardActions>
              </CardHeader>
              <CardBody isScrollable>
                <Calendar
                  formats={customFormats}
                  selectable
                  toolbar={false}
                  localizer={localizer}
                  events={events}
                  defaultView={Views.WEEK}
                  views={views}
                  view={Views.DAY}
                  date={date}
                  scrollToTime={dayjs().add(-2, 'h').toISOString()}
                  defaultDate={new Date()}
                  onSelectEvent={(event) => {
                    setInfoEvent();
                    setEventItem(event);
                  }}
                  onSelectSlot={handleSelect}
                  onView={handleViewMode}
                  onDrillDown={handleViewMode}
                  components={{
                    event: MyEventDay, // used by each view (Month, Day, Week)
                  }}
                  eventPropGetter={eventStyleGetter}
                />
              </CardBody>
            </Card>
          </div>
          <div className="col-xl-9">
            <Card stretch style={{ minHeight: 600 }}>
              <CardHeader>
                <CardActions>
                  <CalendarTodayButton
                    unitType={unitType}
                    date={date}
                    setDate={setDate}
                    viewMode={viewMode}
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
                    disabled={refresh || !scaleUsers}
                    color={switchEvents == "all" ? 'light' : 'primary'}
                    onClick={() => setSwitchEvents("my")}
                  >
                    My slots & events
                  </Button>
                  <Button
                    disabled={refresh || !scaleUsers}
                    color={switchEvents == "my" ? 'light' : 'primary'}
                    onClick={() => setSwitchEvents("all")}
                  >
                    All events
                  </Button>
                </div>
                {
                  (refresh || !scaleUsers)
                    ?
                    <div className="spinner"> <Spinner color={'info'} inButton /></div>
                    :
                    <Tooltips title='For saving calls to request to api.42.fr we block the update button for a minute.' placement='bottom'>
                      <Button disabled={timeoutForRefresh} icon='Refresh' color='storybook' onClick={refreshHandler}>
                        Refresh
                      </Button>
                    </Tooltips>
                }
                <CardActions>

                  <CalendarViewModeButtons viewMode={viewMode} />
                </CardActions>
              </CardHeader>
              <CardBody isScrollable>
                <style>{customStyles}</style>
                <Calendar
                  formats={customFormats}
                  selectable
                  toolbar={false}
                  localizer={localizer}
                  events={eventsActive}
                  defaultView={Views.WEEK}
                  views={views}
                  view={viewMode}
                  date={date}
                  onNavigate={(_date) => setDate(_date)}
                  scrollToTime={dayjs().add(-1, 'h').toISOString()}
                  defaultDate={new Date()}
                  onSelectEvent={(event) => {
                    setInfoEvent();
                    setEventItem(event);
                  }}
                  onSelectSlot={handleSelect}
                  // onView={handleViewMode}
                  // onDrillDown={handleViewMode}
                  components={{
                    event: MyEvent, // used by each view (Month, Day, Week)
                    week: {
                      event: MyWeekEvent,
                    },
                    work_week: {
                      event: MyWeekEvent,
                    },
                  }}
                  eventPropGetter={eventStyleGetter}
                />
              </CardBody>
            </Card>
          </div>
        </div>

        <OffCanvas
          setOpen={(status: boolean) => {
            setToggleInfoEventCanvas(status);
            setEventAdding(status);
          }}
          isOpen={toggleInfoEventCanvas}
          titleId="canvas-title"
        >
          <OffCanvasHeader
            setOpen={(status: boolean) => {
              setToggleInfoEventCanvas(status);
              setEventAdding(status);
            }}
            className="p-4"
          >
            <OffCanvasTitle id="canvas-title">
              {eventAdding ? "Add Event" : ""}
            </OffCanvasTitle>
          </OffCanvasHeader>
          <OffCanvasBody
            tag="form"
            onSubmit={formik.handleSubmit}
            className="p-4"
          >
            {!eventAdding ? (
              <div className="row g-4" style={{ backgroundColor: 'transparent' }}>
                {/* Name */}

                {eventItem?.scale_team?.id ? (
                  <div>
                    <h2>Evaluation of the project</h2>
                    <br />
                    <div className="col-12">
                      <Card
                        className="mb-0 bg-l10-info"
                        shadow="sm"
                        style={{ textAlign: "end" }}
                      >
                        <CardHeader className="bg-l25-info">
                          <Avatar
                            src={getCorrectorImageUrl(eventItem?.scale_team?.corrector.id, scaleUsers, me)}
                            size={64}
                            border={4}
                            className="cursor-pointer"
                            borderColor={true ? "info" : themeStatus}
                          />
                          <CardLabel iconColor="dark">
                            <CardTitle>
                              {eventItem?.scale_team?.corrector.login}
                            </CardTitle>
                            <p style={{ marginTop: 5 }}>
                              {dayjs(eventItem?.end).format(
                                "dddd, D MMMM YYYY",
                              )}
                            </p>
                          </CardLabel>
                        </CardHeader>

                        <CardBody>
                          <p>
                            Final mark:{" "}
                            <b>{eventItem?.scale_team?.final_mark}</b>
                          </p>
                          <p>
                            Final mark:{" "}
                            <b>{eventItem?.scale_team?.flag.name}</b>
                          </p>
                          <br />
                          <p>{eventItem?.scale_team?.comment}</p>
                        </CardBody>
                      </Card>
                    </div>
                    <br />
                    <div className="col-12">
                      <Card className="mb-0 bg-l10-success" shadow="sm">
                        <CardHeader className="bg-l25-success">
                          <CardLabel iconColor="dark">
                            <CardTitle>
                              {eventItem?.scale_team?.correcteds[0].login}
                            </CardTitle>
                            <p style={{ marginTop: 5 }}>
                              {dayjs(eventItem?.end).format(
                                "dddd, D MMMM YYYY",
                              )}
                            </p>
                          </CardLabel>
                          <Avatar
                            src={getCorrectorImageUrl(eventItem?.scale_team?.correcteds[0].id, scaleUsers, me)}
                            size={64}
                            border={4}
                            className="cursor-pointer"
                            borderColor={true ? "info" : themeStatus}
                          />
                        </CardHeader>

                        <CardBody>
                          <p>{eventItem?.scale_team?.feedback}</p>
                        </CardBody>
                      </Card>
                    </div>

                  </div>
                ) : (
                  <div>
                    {eventItem.name != "Available" ? (
                      <>
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
                            color="danger"
                            type="submit"
                            onClick={() => unsubscribeHandler(eventItem)}
                          >
                            Unsubscribe
                          </Button>
                          <br />
                          <p style={{ marginTop: 15 }}>
                            This button opening page of event in intra.42.fr
                            in&nbsp;other tab and click to button "Unsubscribe"
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <h2>Remove the slots</h2>
                        <div>
                          {
                            eventItem.slots_data.map((item: any) => {
                              return (
                                <div className="col" id={item.id}  >
                                  <Button
                                    style={{ marginTop: 10 }}
                                    color="danger"
                                    type="submit"
                                    onClick={() => unsubscribeHandler(item)}
                                  >
                                    {dayjs(item.begin_at).format('H:mm')} - {dayjs(item.end_at).format('H:mm')}
                                  </Button>
                                </div>
                              );
                            })
                          }
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* <div className='col-12'>
								<FormGroup id='eventName' label='Name'>
									<Select
										ariaLabel='Service select'
										placeholder='Please select...'
										size='lg'
										value={formik.values.eventName}
										onChange={formik.handleChange}>
										{Object.keys(SERVICES).map((s) => (
											<Option key={SERVICES[s].name} value={SERVICES[s].name}>
												{SERVICES[s].name}
											</Option>
										))}
									</Select>
								</FormGroup>
							</div> */}
                {/* Date */}
                {/* <div className='col-12'>
								<Card className='mb-0 bg-l10-info' shadow='sm'>
									<CardHeader className='bg-l25-info'>
										<CardLabel icon='DateRange' iconColor='info'>
											<CardTitle className='text-info'>
												Date Options
											</CardTitle>
										</CardLabel>
									</CardHeader>
									<CardBody>
										<div className='row g-3'>
											<div className='col-12'>
												<FormGroup id='eventAllDay'>
													<Checks
														type='switch'
														value='true'
														label='All day event'
														checked={formik.values.eventAllDay}
														onChange={formik.handleChange}
													/>
												</FormGroup>
											</div>
											<div className='col-12'>
												<FormGroup
													id='eventStart'
													label={
														formik.values.eventAllDay
															? 'Date'
															: 'Start Date'
													}>
													<Input
														type={
															formik.values.eventAllDay
																? 'date'
																: 'datetime-local'
														}
														value={
															formik.values.eventAllDay
																? dayjs(
																	formik.values.eventStart,
																).format('YYYY-MM-DD')
																: dayjs(
																	formik.values.eventStart,
																).format('YYYY-MM-DDTHH:mm')
														}
														onChange={formik.handleChange}
													/>
												</FormGroup>
											</div>

											{!formik.values.eventAllDay && (
												<div className='col-12'>
													<FormGroup id='eventEnd' label='End Date'>
														<Input
															type='datetime-local'
															value={dayjs(
																formik.values.eventEnd,
															).format('YYYY-MM-DDTHH:mm')}
															onChange={formik.handleChange}
														/>
													</FormGroup>
												</div>
											)}
										</div>
									</CardBody>
								</Card>
							</div> */}
                {/* Employee */}
                {/* <div className='col-12'>
								<Card className='mb-0 bg-l10-dark' shadow='sm'>
									<CardHeader className='bg-l25-dark'>
										<CardLabel icon='Person Add' iconColor='dark'>
											<CardTitle>Employee Options</CardTitle>
										</CardLabel>
									</CardHeader>
									<CardBody>
										<FormGroup id='eventEmployee' label='Employee'>
											<Select
												placeholder='Please select...'
												value={formik.values.eventEmployee}
												onChange={formik.handleChange}
												ariaLabel='Employee select'>
												{Object.keys(USERS).map((u) => (
													<Option
														key={USERS[u].id}
														value={USERS[u].username}>
														{`${USERS[u].name} ${USERS[u].surname}`}
													</Option>
												))}
											</Select>
										</FormGroup>
									</CardBody>
								</Card>
							</div> */}
              </div>
            ) : (
              <div className="row g-4">{ }</div>
            )}
          </OffCanvasBody>
        </OffCanvas>
      </Page>
    </PageWrapper>
  );
};

export async function getServerSideProps({ req, locale }: any) {
  const { token, expires_at } = req.cookies || {};

  console.log("Cookies received:", { token, expires_at });

  const authUrl =
    "https://api.intra.42.fr/oauth/authorize?" +
    new URLSearchParams({
      client_id: process.env.CLIENT_ID as string,
      redirect_uri: process.env.API_URI as string,
      response_type: "code",
      scope: "public projects profile",
    }).toString();

  if (!token) {
    console.log("No token, redirecting to:", authUrl);
    return {
      redirect: { destination: authUrl, permanent: false },
      props: { ...(await serverSideTranslations(locale, ["common", "menu"])) },
    };
  }

  const expiresAtNum = expires_at ? parseInt(expires_at, 10) : 0;
  const isExpired = Date.now() > expiresAtNum;
  console.log("Token expiration check:", {
    expires_at,
    isExpired,
    now: Date.now(),
  });

  if (isExpired) {
    console.log("Token expired, redirecting to:", authUrl);
    return {
      redirect: { destination: authUrl, permanent: false },
      props: { ...(await serverSideTranslations(locale, ["common", "menu"])) },
    };
  }

  try {
    console.log("Fetching user data with token:", token);
    const response = await axios.get("https://api.intra.42.fr/v2/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("User data fetched:", response.data.login);
    return {
      props: {
        token,
        userData: response.data,
        ...(await serverSideTranslations(locale, ["common", "menu"])),
      },
    };
  } catch (error: any) {
    console.error("API error:", error.response?.status, error.response?.data);
    return {
      redirect: { destination: authUrl, permanent: false },
      props: { ...(await serverSideTranslations(locale, ["common", "menu"])) },
    };
  }
}

export default Index;
