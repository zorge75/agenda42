import React, { useEffect, useState } from "react";
import type { NextPage } from "next";
import dayjs from "dayjs";
import classNames from "classnames";
import Hanna from './../assets/img/hanna.gif';
import Preview from './../assets/img/preview.png';
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
import { setEvals } from "../store/slices/evalsSlice";
import { setEvents as setEventsRedux, setAllEvents } from '../store/slices/eventsSlice';
import Spinner from "../components/bootstrap/Spinner";
import OverlappingModal from "../components/agenda/OverlappangModal";
import Evaluation from "../components/agenda/Evaluation";
import Event from "../components/agenda/Event";
import Slot from "../components/agenda/Slot";
import Defanse from "../components/agenda/Defanse";

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
  const eventsIntra = useSelector((state: RootState) => state.events.events);
  const allEvents = useSelector((state: RootState) => state.events.all);
  const slotsIntra = useSelector((state: RootState) => state.slots.slots);
  const originalSlotsIntra = useSelector((state: RootState) => state.slots.original);
  const viewMode = useSelector((state: RootState) => state.calendar.unitType);
  const me = useSelector((state: RootState) => state.user.me);
  const scaleUsers = useSelector((state: RootState) => state.slots.scaleTeam);
  const defances = useSelector((state: RootState) => state.slots.defances);
  const defancesHistory = useSelector((state: RootState) => state.slots.defancesHistory);

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
    if (eventsIntra && slotsIntra && defances && defancesHistory) {
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
            ? `📥 ${slot.scale_team?.correcteds[0].login}`
            : "Available",
        start: dayjs(slot["begin_at"]).toDate(),
        end: dayjs(slot["end_at"]).toDate(),
        color:
          slot.scale_team == "invisible" || slot.scale_team?.id
            ? "danger"
            : "success",
        user: null,
        description: null,
        kind: "kind",
        location: "event.location",
        max_people: "event.max_people",
        nbr_subscribers: "event.nbr_subscribers",
        prohibition_of_cancellation: "event.prohibition_of_cancellation",
        themes: "event.themes",
        scale_team: slot.scale_team,
        slots_data: slot?.slots_data,
      }));

      const defancesList = [...defancesHistory, ...defances].map((slot: any) => ({
        id: slot.id,
        name: `📥 ${slot.team?.project_gitlab_path?.split('/').pop()}`,
        start: dayjs(slot["begin_at"]).toDate(),
        end: dayjs(slot["begin_at"]).add(slot.scale.duration, 's').toDate(),
        color:
          slot.scale_team == "invisible" || slot.scale_team?.id
            ? "danger"
            : "dark",
        user: null,
        description: null,
        kind: "kind",
        location: "event.location",
        max_people: "event.max_people",
        nbr_subscribers: "event.nbr_subscribers",
        prohibition_of_cancellation: "event.prohibition_of_cancellation",
        themes: "event.themes",
        scale_team: slot,
        slots_data: null,
        type: "defances"
      }));

      setEvents([...eventList, ...slotsList, ...defancesList]);
      setEventsActive([...eventList, ...slotsList, ...defancesList]);
    }
  }, [eventsIntra, slotsIntra, defances, defancesHistory]);

  const initialEventItem: IEvent = {
    start: undefined,
    end: undefined,
    name: undefined,
    id: undefined,
    user: undefined,
  };

  const [eventItem, setEventItem] = useState<IEvent>(initialEventItem);
  const [date, setDate] = useState(new Date());
  const [toggleInfoEventCanvas, setToggleInfoEventCanvas] = useState(false);
  const setInfoEvent = () => setToggleInfoEventCanvas(!toggleInfoEventCanvas);
  const [eventAdding, setEventAdding] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const [switchEvents, setSwitchEvents] = useState("my");

  useEffect(() => {
    let isMounted = true; // To prevent state updates after unmount
    let response;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/all_events?id=${me?.campus[0].id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        response = await res.json();

        if (res.ok) {
          dispatch(setAllEvents(response));
          // Example: setState(response);
        } else {
          throw new Error(response?.message || "Request failed");
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
      dispatch(setUnitType(Views.WORK_WEEK));
    }
    else {
      setEventsActive([
        ...events
      ]);
      dispatch(setUnitType(Views.WEEK));
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
    const maxRetries = 3; // Maximum number of retry attempts
    let retryCount = 0;

    const attemptRefresh = async () => {
      setRefresh(true);

      try {
        const res = await fetch(
          "/api/refresh_agenda?id=" + me.id,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const response = await res.json();

        if (res.ok) {
          // Success case
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
            'Agenda update',
            'success'
          );
        } else if (res.status === 429 && retryCount < maxRetries) {
          // Handle 429 error with retry
          retryCount++;
          const retryAfter = res.headers.get('Retry-After')
            ? parseInt(res.headers.get('Retry-After')) * 1000
            : 5000 * retryCount; // Default to 5s, 10s, 15s

          console.log(`Rate limited. Retrying after ${retryAfter / 1000} seconds...`);
          await delay(retryAfter);
          return await attemptRefresh(); // Recursive retry
        } else {
          // Other errors or max retries reached
          location?.reload();
        }
      } catch (error) {
        console.error('Refresh failed:', error);
        location?.reload();
      }

      setRefresh(false);
      await delay(3000);
    };

    await attemptRefresh();
  };


  const handleSelect = async ({ start, end }: { start: any; end: any }) => {
    const startFormated = dayjs(start).add(-1, "h").format();
    const endFormated = dayjs(end).add(-1, "h").format();
    const diffInMinutes = dayjs(endFormated).diff(dayjs(startFormated), 'minute');

    if (diffInMinutes <= 30 || diffInMinutes > 480) {
      return null;
    }

    // const eventStart = new Date(start);
    // const eventEnd = new Date(start);
    // const reminderTime = new Date(start - 60 * 60 * 1000); // 60 minutes before

    // const response = await fetch("/api/events", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     name: "Event test",
    //     eventStart: eventStart.toISOString(),
    //     eventEnd: eventEnd.toISOString(),
    //     reminderTime: reminderTime.toISOString(),
    //     // chatId: "1150194983228412055",
    //   }),
    // });

    // if (response.ok) {
    //   console.log("Event created and reminder scheduled!");

    // } else {
    //   console.log("Error creating event.");
    // }

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
      setLoading(true);
      try {
        await delay(1000);
        const users = await getScaleTeams(slotsIntra, token);
        console.log("Users fetched, dispatching:", users.length);
        dispatch(setScaleTeams(users));
      } catch (err) {
        console.error("Failed to fetch scale users:", err);
        setError("Failed to load scale users. Please try again later.");
        dispatch(setScaleTeams([]));
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
        <meta property="og:title" content="Agenda42" />
        <meta property="og:description" content="This is a description of my awesome app.Simplify your life with Agenda42! Manage all your events and evaluations in a single, easy-to-use calendar. Whether it’s scheduling appointments, tracking availability, or organizing tasks, Agenda42 keeps everything in one place for seamless planning and productivity." />
        <meta property="og:image" content={Preview} />
        <meta property="og:url" content="https://agenda42.fr" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Page container="fluid">
        <div className="stories">
          <div className="row mb-4 g-3">
            {(loading || !scaleUsers || scaleUsers.length === 0) ? (

              Object.keys(USERS).slice(0, 3).map((u) => (
                <div key={USERS[u].username} className="col-auto">
                  <div className="position-relative">
                    <Avatar
                      src={USERS[u].src}
                      color={USERS[u].color}
                      size={64}
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
            ) : (
              [...scaleUsers].slice(0, 9).reverse().map((u: any) => (
                <div key={u.login} className="col-auto">
                  <Popovers
                    trigger="hover"
                    desc={
                      <>
                        <div className="h4">{`${u.usual_full_name}`}</div>
                        <div className="h6">{`${u.pool_month} ${u.pool_year}`}</div>
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
                        className="cursor-pointer"
                        borderColor={"info"}

                      />
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
                {/* <CardActions>
                  <CalendarTodayButton
                    unitType={Views.DAY}
                    date={date}
                    setDate={setDate}
                    viewMode={Views.DAY}
                  />
                </CardActions> */}
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
                  step={15}
                  min={dayjs().add(-1, 'h').toISOString()}
                  scrollToTime={dayjs().add(-1, 'h').toISOString()}
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
                    <Button icon='Refresh' color='storybook' onClick={refreshHandler}>
                      Refresh
                    </Button>
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
                  step={15}
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

                {(eventItem?.scale_team?.id && !(eventItem?.type === "defances")) ? (
                  <Evaluation token={token} eventItem={eventItem} scaleUsers={scaleUsers} me={me} />
                ) : (
                  <div>
                    {
                      (eventItem?.type === "defances")
                        ? <Defanse token={token} eventItem={eventItem} scaleUsers={scaleUsers} me={me} />
                        : (eventItem.name != "Available")
                          ? <Event eventItem={eventItem} token={token} originalSlotsIntra={originalSlotsIntra} />
                          : <Slot eventItem={eventItem} token={token} originalSlotsIntra={originalSlotsIntra} />
                    }
                  </div>
                )}
              </div>
            ) : (
              <div className="row g-4">{ }</div>
            )}
          </OffCanvasBody>
        </OffCanvas>
        <OverlappingModal events={events} />
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
      },
    };
  } catch (error: any) {
    console.error("API error:", error.response?.status, error.response?.data);
    return {
      redirect: { destination: authUrl, permanent: false },
    };
  }
}

export default Index;
