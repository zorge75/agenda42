import Button from "../bootstrap/Button";
import Card, { CardHeader, CardLabel, CardTitle } from "../bootstrap/Card";
import { delay, getName, isMyPiscine, userInIntraHandler } from "../../helpers/helpers";
import { useEffect, useState } from "react";
import Collapse from "../bootstrap/Collapse";
import Avatar from "../Avatar";
import Badge from "../bootstrap/Badge";
import Spinner from "../bootstrap/Spinner";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import useDarkMode from "../../hooks/useDarkMode";
import Link from "next/dist/client/link";
import { addFriendToList } from "../../store/slices/friendsReducer";

const UsersOfEvent = ({ myId, id, size = 30, token, eventTitle }: any) => {
    const dispatch = useDispatch();

    const me = useSelector((state: RootState) => state.user.me);
    const friends = useSelector((state: RootState) => state.friends.list);
    const [success, setSuccess] = useState<number[]>([]);
    const [successWavingHand, setSuccessWavingHand] = useState<number[]>([]);
    const [update, setUpdate] = useState(false);

    const { darkModeStatus } = useDarkMode();

    const addFriendHandler = async (id: number, login: string, name: string, image: string, month: string, year: string) => {
        setUpdate(true);
        await fetch("/api/friends", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: myId,
                friend_id: id,
                friend_login: login,
                friend_name: name,
                friend_image: image,
                pool_month: month,
                pool_year: year,
            }),
        }).then(async (response) => {
            setUpdate(false);
            if (!response.ok) {
                console.log(`Failed to create settings: ${response.statusText}`);
            } else {
                setSuccess((i: number[]) => [...i, id]);
                dispatch(addFriendToList(
                    {
                        user_id: myId,
                        friend_id: id,
                        friend_login: login,
                        friend_name: name,
                        friend_image: image,
                        pool_month: month,
                        pool_year: year,
                    }
                ));
            }
            return { success: true };
        })
    };

     const addWavingHandHandler = async (destinator_id: number, event_title: string, status: string, author_image_url: string, author_name: string, author_login: string) => {
            setUpdate(true);
            await fetch("/api/waving_hand", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    author_id: me.id, 
                    destinator_id, 
                    event_title, 
                    status, 
                    author_image_url, 
                    author_name, 
                    author_login
                }),
            }).then(async (response) => {
                setUpdate(false);
                if (!response.ok) {
                    console.log(`Failed to create settings: ${response.statusText}`);
                } else {
                    setSuccessWavingHand((i: number[]) => [...i, destinator_id]);
                }
                return { success: true };
            })
        };

    const [refresh, setRefresh] = useState(false);
    const [users, setUsers] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    const getUsersOfEvent = async () => {
        const maxRetries = 3; // Maximum number of retry attempts
        let retryCount = 0;

        const attemptRefresh = async () => {
            setRefresh(true);

            console.log("*", users.length, refresh, isOpen)

            const res = await fetch(
                "/api/users_of_event?id=" + id + "&size=" + size,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const response = await res.json();

            if (res.ok) {
                setUsers(response);
                // Success case
            } else if (res.status === 429 && retryCount < maxRetries) {
                // Handle 429 error with retry
                retryCount++;
                const retryAfter = res.headers.get('Retry-After')
                    ? parseInt(res.headers.get('Retry-After')) * 1000
                    : 5000 * retryCount; // Default to 5s, 10s, 15s

                console.log(`Rate limited. Retrying after ${retryAfter / 1000} seconds...`);
                await delay(retryAfter);
                // return await attemptRefresh(); // Recursive retry
            } else {
                return;
            }
            setRefresh(false);
            await delay(3000);
        };

        await attemptRefresh();
    };

    useEffect(() => {
        getUsersOfEvent();
    }, [])

    if (!refresh && users.length == 0)
        return ("");

    return (
        <>
            <Button
                isDisable={refresh || users.length <= 0}
                color={darkModeStatus ? "light" : "dark"}
                isLight={darkModeStatus ? false : true}
                onClick={() => setIsOpen(!isOpen)}
                className="mb-3"
            >
                {
                    refresh || users.length <= 0
                        ? <Spinner isSmall />
                        : "Users registered for this event"
                }
            </Button>
            <Collapse
                tag="div"
                isOpen={isOpen}
            >
                {
                    users.map(({ user, key }) => {
                        const isIdInSuccess = success && success.includes(user.id);
                        const isIdInSuccessWavingHand = success && successWavingHand.includes(user.id);
                        const isFriend = friends.find(i => i.friend_id == user.id);
                        return (
                            <Card isCompact key={key}
                                className={isFriend ? "friend" : ""}
                            >

                                <CardHeader
                                    style={{ borderRadius: 20 }}
                                >

                                    <CardLabel
                                    >
                                        <CardTitle>
                                            {user.usual_full_name}
                                        </CardTitle>
                                        <p className="mt-2" >{user.email}</p>
                                    </CardLabel>
                                    <Avatar src={user.image.versions.medium} size={64} />
                                </CardHeader>

                                <div className='card-aside d-flex row align-items-end event_row m-3 mt-0'>
                                    <div className='col-lg-6 p-1'>
                                        <Button
                                            style={{ marginRight: 15 }}
                                            className='h4'
                                            icon={update ? "Refresh" : (isFriend || isIdInSuccess) ? "Group": "Add"}
                                            color={(isIdInSuccess || isFriend) ? "success" : "light"}
                                            isDisable={update || isFriend}
                                            onClick={() => addFriendHandler(user.id, user.login, getName(user), user.image.versions.medium, user.pool_month, user.pool_year)}
                                        />
                                        <Button
                                            className='h4'
                                            style={{ marginRight: 15 }}
                                            icon="Link"
                                            color="light"
                                            onClick={() => userInIntraHandler(user.id)}
                                        >
                                        </Button>
                                        <Button
                                            className='h4'
                                            icon={update ? "Refresh" : "WavingHand"}
                                            color={isIdInSuccessWavingHand ? "success" : "brand"}
                                            onClick={() => addWavingHandHandler(user.id, eventTitle, "send", user.image.versions.medium, getName(user), user.login)}
                                        >
                                        </Button>
                                    </div>
                                    <div className='col-lg-6'>
                                        <div className='h4 text-end'>
                                            <Badge
                                                isLight={darkModeStatus ? false : true}
                                                color={isMyPiscine(me, user) ? 'piscine' : 'primary'}
                                            >
                                                {user.pool_month} {user.pool_year}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )
                    })
                }
                {
                    users.length === 100
                        ? <Link style={{
                            margin: '40px auto',
                            display: 'flex',
                            width: 'max-content',
                        }} href="https://github.com/brgman/agenda42/issues/66">Loaded just 100 last students...</Link>
                        : null
                }
                <Button
                    color="dark"
                    isLight
                    onClick={() => setIsOpen(!isOpen)}
                    className="mb-3 w-100"
                >
                    Hide users
                </Button>
            </Collapse>
        </>
    );
};

export default UsersOfEvent;
